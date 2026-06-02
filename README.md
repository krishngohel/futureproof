# Futureproof

> Teach your child how to use AI the right way.

A lean, production-ready web app for K-12 AI literacy. 5 modules covering AI basics, prompting, school use, coding, and safety. Monetized with Stripe at $5/month. First module always free.

**Stack:** Next.js 14 · Tailwind CSS · Supabase (auth + db) · Stripe (subscriptions) · Vercel

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase + Stripe keys
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run
3. Copy your **Project URL** and **anon key** to `.env.local`
4. Copy your **service role key** (Settings → API) to `.env.local`

### 4. Set up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Go to **Products** → Create product: "Futureproof Pro" · $5/month recurring
3. Copy the **Price ID** to `.env.local` as `STRIPE_PRICE_ID`
4. Copy **Secret key** and **Publishable key** to `.env.local`

**For webhooks (local dev):**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET
```

**For webhooks (production):**
- Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://your-domain.vercel.app/api/stripe/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### 5. Run locally

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Project → Settings → Environment Variables
# Add all variables from .env.local
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for automatic deploys.

---

## Project structure

```
app/
  page.tsx                    ← Landing page
  (auth)/login|signup/        ← Auth pages
  (protected)/
    layout.tsx                ← Auth check + nav
    dashboard/                ← Student dashboard
    modules/[id]/             ← Module detail (lesson + quiz)
    playground/               ← Prompt practice
  api/
    progress/route.ts         ← Save quiz progress
    stripe/checkout/route.ts  ← Create Stripe session
    stripe/webhook/route.ts   ← Handle Stripe events

lib/
  modules-data.ts             ← All lesson content + quizzes
  supabase/client.ts          ← Browser Supabase client
  supabase/server.ts          ← Server Supabase client
  stripe.ts                   ← Stripe instance

components/
  layout/dashboard-nav.tsx    ← Nav bar
  modules/quiz.tsx            ← Quiz component
  modules/prompt-box.tsx      ← Interactive prompt input

supabase/schema.sql           ← DB schema + RLS policies
```

---

## To add a real AI API (optional upgrade)

Replace the mock responses in `components/modules/prompt-box.tsx` and `app/(protected)/playground/page.tsx` with a real API call:

```typescript
// In your API route (app/api/chat/route.ts):
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-haiku-4-5-20251001",  // cheapest, fast
  max_tokens: 400,
  messages: [{ role: "user", content: prompt }],
});
```

Claude Haiku costs ~$0.0008 per 1K tokens — about $0.01 per conversation. Safe to add even on a $5/month plan.

---

## Revenue math

- **Free tier:** 1 module (hooks users in)
- **Pro tier:** $5/month · all 5 modules
- **Break even:** 20 subscribers = $100/month
- **$300/month target:** 60 subscribers
- **$1,000/month:** 200 subscribers

Acquisition: parent Facebook groups, school newsletters, teachers on Reddit/Twitter.
