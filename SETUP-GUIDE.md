# JobReady Resume — Setup Guide (step by step)

Total time: ~45 minutes. Aapko koi code likhna nahi hai — sirf copy-paste aur click.
Ek step complete karke hi next step par jaiye.

---

## STEP 1 — Supabase (database + login)

1. https://supabase.com → **Sign in** → **New project**
   - Name: `jobready-resume`
   - Database password: koi strong password (save kar lijiye)
   - Region: **South Asia (Mumbai)**
   - **Create new project** → 2 minute wait.
2. Left menu → **SQL Editor** → **New query**
   - Is ZIP ka file `supabase/schema.sql` Notepad me kholiye → sab copy (Ctrl+A, Ctrl+C) → yahan paste → **Run**.
   - "Success. No rows returned" aana chahiye.
3. Phir se **New query** → `supabase/seed.sql` ka pura content paste → **Run**.
   (Isse 53 jobs, 28 qualifications aur 4 templates add ho jayenge.)
4. Left menu → **Project Settings → API Keys** (ya **API**). Ye 3 cheezein Notepad me save kijiye:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (ye kisi ko mat dikhaiye)
   - Agar "Publishable key" / "Secret key" dikhe to: Publishable → ANON_KEY, Secret → SERVICE_ROLE_KEY. (Ya **Legacy API Keys** tab se anon/service_role le lijiye.)
5. Left menu → **Authentication → Sign In / Providers → Email** → **Confirm email** ko **OFF** kijiye → **Save**.
   (Supabase ka free email system sirf aapke team ko email bhejta hai, isliye students ko confirmation mail nahi jayega. Baad me Brevo/Resend SMTP lagakar ise ON kar sakte hain.)

## STEP 2 — Razorpay keys

1. https://dashboard.razorpay.com → pehle **Test Mode** ON rakhiye (top par toggle).
2. **Account & Settings → API Keys → Generate Key**
   - Key Id → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Key Secret → `RAZORPAY_KEY_SECRET`
3. Webhook abhi nahi — Step 5 me karenge (website ka URL chahiye).

## STEP 3 — Code GitHub par upload

1. https://github.com → **New repository** → name `jobready-resume` → **Private** → **Create**.
2. **uploading an existing file** link par click.
3. ZIP ko apne computer par extract kijiye. `jobready-resume` folder ke **andar** ki saari files aur folders select karke browser me drag-drop kijiye.
4. **Commit changes** click.

## STEP 4 — Vercel par deploy

1. https://vercel.com → **Add New → Project** → GitHub se `jobready-resume` **Import**.
2. **Environment Variables** me ye sab add kijiye (Name = left, Value = aapki value):

| Name | Value |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Step 1 se |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Step 1 se |
| SUPABASE_SERVICE_ROLE_KEY | Step 1 se |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Step 2 se |
| RAZORPAY_KEY_SECRET | Step 2 se |
| RAZORPAY_WEBHOOK_SECRET | koi bhi lamba random text, e.g. `jr-webhook-8f3k29x` |
| NEXT_PUBLIC_SITE_URL | `https://resume.yourdomain.com` (ya Vercel URL) |
| NEXT_PUBLIC_APP_NAME | `JobReady Resume` |
| ADMIN_EMAILS | aapka email (jisse aap login karenge) |
| ABUSE_SALT | koi bhi random text |
| NEXT_PUBLIC_SUPPORT_EMAIL | support email |
| NEXT_PUBLIC_SUPPORT_WHATSAPP | `91` + WhatsApp number |

3. **Deploy** → 2–3 minute. Website URL mil jayega.
4. (Optional) **Settings → Domains** → apna subdomain add kijiye, DNS me CNAME `cname.vercel-dns.com` lagaiye.

## STEP 5 — Final connections

**Supabase login redirect:**
Supabase → **Authentication → URL Configuration**
- Site URL: `https://aapki-website`
- Redirect URLs → **Add URL**: `https://aapki-website/**`

**Razorpay webhook (backup activation):**
Razorpay → **Account & Settings → Webhooks → Add New Webhook**
- URL: `https://aapki-website/api/razorpay/webhook`
- Secret: wahi text jo `RAZORPAY_WEBHOOK_SECRET` me dala
- Events: ✅ `payment.captured` ✅ `order.paid` ✅ `payment.failed`
- **Create Webhook**

## STEP 6 — Test

1. Website kholiye → **Create My Resume — Free** → job select → details → **Sign up & Generate**.
2. Account banate hi resume generate hoga → PDF / Word / Print check kijiye.
3. Dusra resume banaiye → ₹9 popup aana chahiye → Test mode me UPI `success@razorpay` se pay kijiye.
4. `https://aapki-website/admin` kholiye → payment aur resume dikhna chahiye.

## STEP 7 — Live payments

Sab test ho jaye to Razorpay me **Live Mode** → live API keys generate → Vercel → Settings → Environment Variables me dono Razorpay keys replace → Webhook live mode me bhi add → **Deployments → Redeploy**.

---

### Admin panel (`/admin`)
- **Dashboard** — users, resumes, revenue, active Pro, 14-day chart, top jobs
- **Jobs** — naye job add/edit (skills, responsibilities, objective) — bina code
- **Qualifications** — add/edit, rank se eligibility decide hoti hai
- **Templates** — naam, colour, Free/Pro, hide
- **Payments** — sab payments, status filter
- **Users** — search, +1 credit, +30 days/1 year Pro, free reset, block

### Abuse protection (already built)
- 1 free resume per account **and** per device; same internet (IP) se 1 din me max 3 free
- Pro "unlimited" = max 15 resumes/hour, 60/day per user
- Max 10 payment attempts/hour
- Admin se kisi bhi user ko block kar sakte hain
- (Optional) Custom SMTP lagakar email confirmation ON kar sakte hain
