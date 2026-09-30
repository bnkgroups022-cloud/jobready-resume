# JobReady Resume — Deploy Guide (GitHub → Vercel → Hostinger domain)

Live address: **https://resume.brightwayjobs.in**
Kisi bhi secret key ko chat, GitHub ya kisi file me paste mat kijiye — sirf Vercel ke Environment Variables screen me.

---

## STEP 1 — Supabase (database + login)

1. https://supabase.com → **New project** → Name `jobready-resume`, Region **South Asia (Mumbai)** → **Create**.
2. **SQL Editor → New query** → `supabase/schema.sql` ka pura content paste → **Run**.
3. **New query** → `supabase/seed.sql` paste → **Run**.
4. **Authentication → Sign In / Providers → Email** → **Confirm email = OFF** → **Save**.
   (Supabase ka free email sirf team ko jata hai. Baad me custom SMTP lagakar ON kar sakte hain.)
5. **Authentication → URL Configuration**
   - Site URL: `https://resume.brightwayjobs.in`
   - Redirect URLs → **Add URL**: `https://resume.brightwayjobs.in/**`
   - (Local testing ke liye optional: `http://localhost:3000/**`)

## STEP 2 — Razorpay

1. https://dashboard.razorpay.com → pehle **Test Mode**.
2. **Account & Settings → API Keys → Generate Key**. Key Id aur Secret sirf Vercel me daalenge (Step 4).
3. **Account & Settings → Payment capture** → **Automatic** (default) rehne dijiye.

## STEP 3 — GitHub

1. https://github.com/new → name `jobready-resume` → **Private** → **Create repository**.
2. **uploading an existing file** → extracted `jobready-resume` folder ke **andar** ki saari files/folders drag-drop → **Commit changes**.
3. Check: `package.json` repository ke pehle page par dikhna chahiye.

## STEP 4 — Vercel

1. https://vercel.com → **Add New → Project** → GitHub `jobready-resume` → **Import**.
2. Framework: **Next.js** (auto). Root Directory: `./`. Build/Install commands: default rehne dijiye.
3. **Environment Variables** khol kar ye 12 add kijiye (Environment: **Production** aur **Preview** tick rakhiye):

| Name | Kahan se | Type |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase → Settings → Data API → Project URL | Config (public) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Settings → API Keys → anon / publishable | Config (public) |
| SUPABASE_SERVICE_ROLE_KEY | Supabase → API Keys → service_role / secret | **Secret** — Sensitive ON |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Razorpay → API Keys → Key Id | Config (public) |
| RAZORPAY_KEY_SECRET | Razorpay → API Keys → Key Secret | **Secret** — Sensitive ON |
| RAZORPAY_WEBHOOK_SECRET | Aap khud banaiye (20+ random letters/numbers) | **Secret** — Sensitive ON |
| NEXT_PUBLIC_SITE_URL | `https://resume.brightwayjobs.in` | Config |
| NEXT_PUBLIC_APP_NAME | `JobReady Resume` | Config |
| ADMIN_EMAILS | aapka login email (comma se multiple) | Config (private) |
| ABUSE_SALT | Aap khud banaiye (20+ random letters/numbers) | **Secret** — Sensitive ON |
| NEXT_PUBLIC_SUPPORT_EMAIL | support email | Config |
| NEXT_PUBLIC_SUPPORT_WHATSAPP | `91XXXXXXXXXX` | Config |

   "Sensitive" toggle Secret wale variables par ON kijiye (value phir dobara dikhai nahi degi — yahi sahi hai).
4. **Deploy** → 2–4 minute.
5. Check: `https://<vercel-url>/api/health` kholiye → `"ok": true` aur `"missing": []` aana chahiye. (Sirf true/false dikhata hai, koi key nahi.)

⚠️ `NEXT_PUBLIC_` wale variable build ke time website me jud jate hain. Inhe baad me badla to **Deployments → ⋯ → Redeploy** zaroor kijiye.

## STEP 5 — Hostinger domain jodna

1. Vercel → Project → **Settings → Domains → Add** → `resume.brightwayjobs.in` → **Add**.
2. Vercel ek CNAME value dikhayega (jaise `cname.vercel-dns.com` ya `xxxx.vercel-dns-017.com`) — copy kijiye.
3. Hostinger → **Domains → brightwayjobs.in → DNS / Nameservers → DNS records**:
   - Type: **CNAME**
   - Name: `resume`
   - Target / Points to: Vercel wali value
   - TTL: default → **Add Record**
   - Agar `resume` naam ka koi purana A/CNAME record hai to pehle use delete kijiye.
4. 5–30 minute me Vercel me domain ke aage ✅ **Valid Configuration** aayega, SSL apne aap lagega.

## STEP 6 — Razorpay webhook

Razorpay → **Account & Settings → Webhooks → Add New Webhook**
- URL: `https://resume.brightwayjobs.in/api/razorpay/webhook`
- Secret: wahi text jo `RAZORPAY_WEBHOOK_SECRET` me dala
- Events: ✅ `payment.captured` ✅ `order.paid` ✅ `payment.failed` → **Create**

## STEP 7 — Test

1. `https://resume.brightwayjobs.in/api/health` → `ok: true`
2. Free resume banaiye → PDF / Word / Print.
3. Dusra resume → ₹9 popup → Test mode UPI `success@razorpay`.
4. `/admin` → payment + resume dikhna chahiye.

## STEP 8 — Live

Razorpay **Live Mode** → live keys → Vercel me `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` update → live mode me webhook dobara add → **Redeploy**.
