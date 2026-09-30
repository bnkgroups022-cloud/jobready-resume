-- =====================================================================
-- JobReady Resume — Supabase database schema (run ONCE in SQL Editor)
-- Safe to re-run: uses "if not exists" / "create or replace".
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- USERS (profile for each Supabase auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  mobile      text,
  is_blocked  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESUME CREDITS
-- ---------------------------------------------------------------------
create table if not exists public.resume_credits (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  free_resume_used     boolean not null default false,
  paid_resume_credits  integer not null default 0 check (paid_resume_credits >= 0),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SUBSCRIPTION (one row per user; renewals extend expiry_date)
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.profiles(id) on delete cascade,
  plan                      text not null check (plan in ('pro_monthly','pro_yearly')),
  status                    text not null default 'active' check (status in ('active','expired','cancelled')),
  start_date                timestamptz not null default now(),
  expiry_date               timestamptz not null,
  razorpay_subscription_id  text,
  updated_at                timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESUMES
-- ---------------------------------------------------------------------
create table if not exists public.resumes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  job_role         text not null,
  job_slug         text,
  candidate_level  text,
  template         text not null,
  resume_data      jsonb not null,
  source           text not null default 'free' check (source in ('free','credit','pro','admin')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists resumes_user_created_idx on public.resumes(user_id, created_at desc);
create index if not exists resumes_created_idx on public.resumes(created_at desc);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  amount               integer not null,            -- in paise (₹9 = 900)
  product              text not null check (product in ('resume_credit','pro_monthly','pro_yearly')),
  payment_type         text not null default 'one_time',
  razorpay_order_id    text unique,
  razorpay_payment_id  text unique,
  status               text not null default 'created' check (status in ('created','paid','failed')),
  fulfilled            boolean not null default false,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);
create index if not exists payments_user_idx on public.payments(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- JOB ROLE DATABASE (admin-editable)
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  title                   text not null,
  category                text not null default 'Other',
  min_qualification_rank  integer not null default 2,
  key_skills              text[] not null default '{}',
  optional_skills         text[] not null default '{}',
  responsibilities        text[] not null default '{}',
  learn_suggestions       text[] not null default '{}',
  objective_fresher       text,
  objective_experienced   text,
  is_active               boolean not null default true,
  sort_order              integer not null default 100,
  created_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- QUALIFICATION DATABASE (admin-editable). rank: higher = higher education
-- 1 Below 10th, 2 10th, 3 12th/ITI, 4 Diploma, 5 Graduate, 6 Post Graduate
-- ---------------------------------------------------------------------
create table if not exists public.qualifications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  rank        integer not null,
  group_name  text not null default 'School',
  is_active   boolean not null default true,
  sort_order  integer not null default 100
);

-- ---------------------------------------------------------------------
-- TEMPLATES (layout code lives in app; admin controls name/pro/active/colour)
-- ---------------------------------------------------------------------
create table if not exists public.templates (
  slug          text primary key,
  name          text not null,
  description   text,
  is_pro        boolean not null default false,
  is_active     boolean not null default true,
  accent_color  text not null default '#1f3a8a',
  sort_order    integer not null default 100
);

-- ---------------------------------------------------------------------
-- ABUSE PROTECTION: which device / IP has claimed a free resume
-- ---------------------------------------------------------------------
create table if not exists public.device_claims (
  device_id   text primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists device_claims_ip_idx on public.device_claims(ip_hash, created_at);

-- =====================================================================
-- New user -> create profile + credit row automatically
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, mobile)
  values (new.id, new.email,
          nullif(new.raw_user_meta_data->>'name',''),
          nullif(new.raw_user_meta_data->>'mobile',''))
  on conflict (id) do nothing;
  insert into public.resume_credits (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- CREATE RESUME (atomic: rate-limit + entitlement + insert)
-- Returns: resume id. Raises: RATE_LIMIT, BLOCKED, PRO_TEMPLATE,
--          FREE_USED_DEVICE, PAYMENT_REQUIRED, BAD_TEMPLATE
-- =====================================================================
create or replace function public.create_resume(
  p_user uuid, p_device text, p_ip_hash text,
  p_job_role text, p_job_slug text, p_level text,
  p_template text, p_data jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_is_pro      boolean;
  v_tpl_pro     boolean;
  v_cred        public.resume_credits%rowtype;
  v_source      text;
  v_hour        int;
  v_day         int;
  v_device_used boolean := false;
  v_ip_count    int := 0;
  v_id          uuid;
begin
  if exists (select 1 from public.profiles where id = p_user and is_blocked) then
    raise exception 'BLOCKED';
  end if;

  -- Rate limit (protects "unlimited" from bots)
  select count(*) into v_hour from public.resumes where user_id = p_user and created_at > now() - interval '1 hour';
  select count(*) into v_day  from public.resumes where user_id = p_user and created_at > now() - interval '1 day';
  if v_hour >= 15 or v_day >= 60 then
    raise exception 'RATE_LIMIT';
  end if;

  select is_pro into v_tpl_pro from public.templates where slug = p_template and is_active;
  if not found then raise exception 'BAD_TEMPLATE'; end if;

  select exists (
    select 1 from public.subscriptions
    where user_id = p_user and status = 'active' and expiry_date > now()
  ) into v_is_pro;

  if v_is_pro then
    v_source := 'pro';
  else
    if v_tpl_pro then raise exception 'PRO_TEMPLATE'; end if;

    insert into public.resume_credits (user_id) values (p_user) on conflict (user_id) do nothing;
    select * into v_cred from public.resume_credits where user_id = p_user for update;

    if not v_cred.free_resume_used then
      if p_device is not null and length(p_device) > 0 then
        select exists (select 1 from public.device_claims where device_id = p_device and user_id <> p_user)
          into v_device_used;
      end if;
      if p_ip_hash is not null then
        select count(*) into v_ip_count from public.device_claims
          where ip_hash = p_ip_hash and user_id <> p_user and created_at > now() - interval '1 day';
      end if;

      if not v_device_used and v_ip_count < 3 then
        update public.resume_credits set free_resume_used = true, updated_at = now() where user_id = p_user;
        insert into public.device_claims (device_id, user_id, ip_hash)
          values (coalesce(nullif(p_device,''), 'user:' || p_user::text), p_user, p_ip_hash)
          on conflict (device_id) do nothing;
        v_source := 'free';
      end if;
    end if;

    if v_source is null then
      if v_cred.paid_resume_credits > 0 then
        update public.resume_credits
          set paid_resume_credits = paid_resume_credits - 1, updated_at = now()
          where user_id = p_user;
        v_source := 'credit';
      elsif not v_cred.free_resume_used then
        raise exception 'FREE_USED_DEVICE';
      else
        raise exception 'PAYMENT_REQUIRED';
      end if;
    end if;
  end if;

  insert into public.resumes (user_id, job_role, job_slug, candidate_level, template, resume_data, source)
  values (p_user, p_job_role, p_job_slug, p_level, p_template, p_data, v_source)
  returning id into v_id;
  return v_id;
end $$;

-- =====================================================================
-- FULFIL PAYMENT (idempotent — safe if verify + webhook both call it)
-- ₹9 -> +1 credit | ₹49 -> +30 days Pro | ₹399 -> +365 days Pro
-- =====================================================================
create or replace function public.fulfill_payment(p_order_id text, p_payment_id text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_pay  public.payments%rowtype;
  v_days int;
begin
  select * into v_pay from public.payments where razorpay_order_id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_pay.fulfilled then return false; end if;

  update public.payments
     set status = 'paid', fulfilled = true, razorpay_payment_id = p_payment_id, paid_at = now()
   where id = v_pay.id;

  if v_pay.product = 'resume_credit' then
    insert into public.resume_credits (user_id, paid_resume_credits) values (v_pay.user_id, 1)
    on conflict (user_id) do update
      set paid_resume_credits = public.resume_credits.paid_resume_credits + 1, updated_at = now();
  else
    v_days := case when v_pay.product = 'pro_monthly' then 30 else 365 end;
    insert into public.subscriptions (user_id, plan, status, start_date, expiry_date)
    values (v_pay.user_id, v_pay.product, 'active', now(), now() + make_interval(days => v_days))
    on conflict (user_id) do update set
      plan        = excluded.plan,
      start_date  = case when public.subscriptions.status = 'active' and public.subscriptions.expiry_date > now()
                         then public.subscriptions.start_date else now() end,
      expiry_date = greatest(
                      case when public.subscriptions.status = 'active' then public.subscriptions.expiry_date else now() end,
                      now()) + make_interval(days => v_days),
      status      = 'active',
      updated_at  = now();
  end if;
  return true;
end $$;

-- =====================================================================
-- ADMIN STATS (dashboard analytics)
-- =====================================================================
create or replace function public.admin_stats()
returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'users',           (select count(*) from public.profiles),
    'users_7d',        (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'resumes',         (select count(*) from public.resumes),
    'resumes_7d',      (select count(*) from public.resumes where created_at > now() - interval '7 days'),
    'resumes_today',   (select count(*) from public.resumes where created_at > date_trunc('day', now())),
    'active_pro',      (select count(*) from public.subscriptions where status = 'active' and expiry_date > now()),
    'revenue_paise',   (select coalesce(sum(amount),0) from public.payments where status = 'paid'),
    'revenue_30d_paise',(select coalesce(sum(amount),0) from public.payments where status = 'paid' and paid_at > now() - interval '30 days'),
    'paid_count',      (select count(*) from public.payments where status = 'paid'),
    'by_source',       (select coalesce(jsonb_object_agg(source, c), '{}'::jsonb)
                          from (select source, count(*) c from public.resumes group by source) s),
    'top_jobs',        (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                          select job_role, count(*) c from public.resumes
                          group by job_role order by c desc limit 10) t),
    'daily',           (select coalesce(jsonb_agg(d order by d.day), '[]'::jsonb) from (
                          select to_char(g.day, 'YYYY-MM-DD') as day,
                                 (select count(*) from public.resumes r
                                   where r.created_at >= g.day and r.created_at < g.day + interval '1 day') as c
                          from generate_series(date_trunc('day', now()) - interval '13 days',
                                               date_trunc('day', now()), interval '1 day') as g(day)) d)
  );
$$;

-- Only the server (service role) may call these functions
revoke all on function public.create_resume(uuid,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.fulfill_payment(text,text) from public, anon, authenticated;
revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.create_resume(uuid,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.fulfill_payment(text,text) to service_role;
grant execute on function public.admin_stats() to service_role;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Users can only READ their own rows. All writes go through the server.
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.resume_credits enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.resumes        enable row level security;
alter table public.payments       enable row level security;
alter table public.jobs           enable row level security;
alter table public.qualifications enable row level security;
alter table public.templates      enable row level security;
alter table public.device_claims  enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own credits" on public.resume_credits;
create policy "own credits" on public.resume_credits for select using (auth.uid() = user_id);
drop policy if exists "own subscription" on public.subscriptions;
create policy "own subscription" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "own resumes" on public.resumes;
create policy "own resumes" on public.resumes for select using (auth.uid() = user_id);
drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for select using (auth.uid() = user_id);

drop policy if exists "public jobs" on public.jobs;
create policy "public jobs" on public.jobs for select using (is_active);
drop policy if exists "public qualifications" on public.qualifications;
create policy "public qualifications" on public.qualifications for select using (is_active);
drop policy if exists "public templates" on public.templates;
create policy "public templates" on public.templates for select using (is_active);
-- device_claims: no policy = nobody except the server can read/write
