# ALLY — Caregiver Co-Pilot for Singapore

> _Support the ones who support everyone else._

ALLY is an AI-powered caregiver coordination tool built for the 210,000+ Singaporeans holding their families together. It turns hospital discharge documents into care plans, family WhatsApp groups into coordinated teams, and the government scheme maze into a five-question wizard — in five languages, with first-class support for foreign domestic workers.

This repo is the working prototype: Next.js 14 App Router + TypeScript + Tailwind, Supabase for auth and persistence, Anthropic Claude for the AI chat and discharge parser.

## Features

- **Real authentication** — Supabase Auth with email/password + Google OAuth.
- **Discharge summary parser** — paste a hospital discharge note, Claude turns it into a structured care plan with medications, tasks, and warning signs. Human-in-the-loop confirmation before activation.
- **Care team coordination** — invite spouse, siblings, and FDW by email; tasks sync in real time across everyone's devices via Supabase Realtime.
- **Burnout monitoring** — passive score computed from mood logs + task completion patterns; banded display (Low / Moderate / High) on the Home tab.
- **Mood log** — daily 1–5 check-in, persisted to Supabase, drives the burnout calc.
- **FDW simplified mode** — toggle in Profile that enlarges text and surfaces audio cues for foreign domestic worker users.
- **Subsidy navigator** — six current Singapore schemes (HCG enhanced from 1 April 2026, CHAS, Pioneer Generation, SMF, MediFund, CTG) with status tags.
- **Five languages** — English, Mandarin, Malay, Tamil, Filipino — UI strings translated; resource library tagged by language.
- **AI chat** — Claude-powered "Ally" co-pilot grounded in Singapore healthcare context, with a clear medical disclaimer on every response.

## Architecture

```
src/
├── app/                          # Next.js routes
│   ├── login/, signup/           # Auth pages (server actions)
│   ├── auth/callback/, sign-out/ # OAuth + sign-out routes
│   ├── forgot-password/, reset-password/
│   ├── invite/[token]/           # Care team invite acceptance
│   ├── subsidies/                # Subsidy Navigator (separate route)
│   ├── api/
│   │   ├── parse-discharge/      # Claude discharge parser
│   │   └── chat/                 # Claude chat
│   ├── layout.tsx                # Wraps everything in <AppProvider>
│   └── page.tsx                  # Slim dispatcher (onboarding vs main app)
├── components/
│   ├── PhoneFrame, BottomNav, TaskRow, TaskDetailModal, …
│   ├── screens/                  # LanguageScreen, OnboardingScreen, DischargeFlow
│   └── tabs/                     # HomeTab, TasksTab, AllyChatTab, ResourcesTab, ProfileTab
├── context/
│   └── AppContext.tsx            # Auth/profile/lang/fdwMode/currentPlan state
├── lib/
│   ├── theme.ts, types.ts        # Theme tokens + TS types
│   ├── demo-data.ts              # Sample discharge, subsidies, resources
│   ├── i18n.ts                   # In-file 5-language translation table
│   ├── burnout.ts                # Burnout score calculation
│   ├── supabase/                 # client / server / middleware factories
│   └── hooks/                    # useTasks, useMood, useCareTeam (with Realtime)
└── middleware.ts                 # Protected-route enforcement
supabase/
└── schema.sql                    # Database schema + RLS + invite RPC
```

## Setup (local)

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Copy `.env.local.example` to `.env.local` and fill in:

```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- Anthropic key: [console.anthropic.com](https://console.anthropic.com)
- Supabase URL + anon key: Create a project at [supabase.com](https://supabase.com), pick the **`ap-southeast-1` (Singapore)** region, then go to *Project Settings → API*.

### 3. Apply the database schema

In your Supabase project: *SQL Editor → New query* → paste the entire contents of `supabase/schema.sql` → *Run*. This creates all tables, RLS policies, and the `accept_invite` RPC.

### 4. Configure Supabase Auth

In Supabase: *Authentication → URL Configuration* → set the **Site URL** to your deployed URL (e.g. `https://ally-app.vercel.app`) and add `http://localhost:3000` to *Redirect URLs* for local dev.

For Google OAuth: *Authentication → Providers → Google* → toggle on, then follow the steps to create an OAuth client in Google Cloud Console. Skip if you only want email/password for now.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` — sign up with an email, complete onboarding, paste the demo discharge summary, and the care plan should appear.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), *Add New → Project*, import the GitHub repo.
3. Under *Settings → Environment Variables*, add:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set to your Vercel URL (e.g. `https://ally-app.vercel.app`).
4. Deploy. Vercel runs `next build` automatically.
5. Update Supabase Auth's *Site URL* and *Redirect URLs* to include the Vercel URL.

## How the data model works

- A user signs up → trigger creates a **profile** row.
- Onboarding creates a **patient** row owned by the user.
- Discharge upload creates a **care_plan** row + the user's first **care_team** entry as `primary`, plus initial **tasks**.
- Inviting a family member creates a **care_team_invites** row with a UUID token. The invitee clicks `/invite/<token>`, signs in, and the `accept_invite` RPC adds them to `care_team` and marks the invite accepted.
- Mood check-ins write to **mood_logs**. The Home tab combines the last 7 days of mood with task completion to compute a burnout band.
- Real-time updates: tasks, care team, and mood logs are part of the `supabase_realtime` publication, so any change propagates to everyone subscribed.
- Row-level security: every table has policies that limit visibility to the patient owner or members of the relevant care team. The `accept_invite` RPC is `security definer` so a user can join a team without already having access.

## Compliance posture

- **PDPA**: data stays in Singapore region (Supabase + Vercel SG region). RLS enforces per-user scoping. No cross-border transfers without explicit consent.
- **HSA SaMD**: ALLY is positioned as a **care coordination tool**, not a medical device. Under HSA's 2025 SaMD/CDSS guidance, software that displays patient information or surfaces guideline-grounded recommendations is exempt from medical-device classification. Every AI output carries a disclaimer.
- **Emergency routing**: AI chat responses end with `⚕️ General info only, not medical advice. For emergencies call 995.`

## Adding a new language

1. Add the language code to `LANGS` in `src/lib/demo-data.ts`.
2. Add a new `Dict` to `src/lib/i18n.ts` (you can spread `en` as a fallback).
3. Add the language to the `language` enum in profile rows (no schema change needed — it's a free-text column).

Translation quality matters — please have a native speaker review medical or financial content before shipping.

## Roadmap

- Singpass / MyInfo identity verification (Year 2)
- HealthHub / NEHR integration via Synapxe HealthX Sandbox
- Hospital QR-code onboarding from discharge summary
- Push notifications (PWA service worker)
- Offline mode for cached content
- Calendar (Google / Outlook) sync for appointments

## License

Internal prototype — not yet publicly licensed.
