# JobReady Resume v1.0

Job-specific resume builder for Indian job seekers. Next.js 15 + Supabase + Razorpay, deploy on Vercel.

**Setup:** follow `SETUP-GUIDE.md`.

## Pricing logic
- 1st resume FREE (per account + per device + max 3 free/IP/day)
- ₹9 → +1 resume credit
- ₹49 → Pro 30 days · ₹399 → Pro 365 days (one-time, no auto-debit; renewals extend expiry)
- All credit/payment logic runs inside the database (`create_resume`, `fulfill_payment`) so it is atomic and cannot be bypassed from the browser. Razorpay verify + webhook are both idempotent.

## Folder map
- `app/` pages: `/` landing, `/builder` 6-step builder, `/resume/[id]` downloads + "Am I Ready?", `/dashboard`, `/pricing`, `/admin/*`, policy pages
- `app/api/` resumes, payments (create-order, verify), razorpay webhook, admin
- `lib/engine.ts` Candidate Level, Eligibility, Format Recommendation, Objective Generator, Readiness, Improvement tips (rule-based, ₹0 AI cost)
- `lib/sections.ts` resume model shared by HTML preview, PDF (`lib/export/pdf.tsx`) and Word (`lib/export/docx.ts`)
- `supabase/schema.sql` tables, RLS, functions · `supabase/seed.sql` 53 jobs, 28 qualifications, 4 templates
- `data/seed-data.mjs` edit seed data then `npm run seed`

## Local run (optional)
```
npm install
cp .env.example .env.local   # fill values
npm run dev
```
