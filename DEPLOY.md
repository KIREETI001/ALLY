# Deploy ALLY in 10 minutes

You finished the build (1,000+ lines of new code, 44 TS files, type-check clean). Here's how to ship it.

## Step 1 — Apply the database schema (2 min)

Open your Supabase project → **SQL Editor** → **New query**. Open `supabase/schema.sql` from this repo and paste the entire contents into the editor. Click **Run**. You should see "Success. No rows returned." That's all the tables, RLS policies, and the `accept_invite` RPC.

While you're there, go to **Authentication → URL Configuration**:
- **Site URL**: leave as `http://localhost:3000` for now; you'll change it to your Vercel URL after step 4
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

If you want Google login, also enable it under **Authentication → Providers → Google** (optional — email/password works without it).

## Step 2 — Push to GitHub (3 min)

In a terminal in this folder:

```bash
# If you haven't set git identity yet:
git config user.email "kireeti696@gmail.com"
git config user.name "Kireeti"

# Stage and commit everything
git add -A
git commit -m "feat: real auth, Supabase persistence, care team, FDW mode, mood/burnout

- Refactor monolithic page.tsx into lib/ + components/screens + components/tabs
- Add Supabase Auth (email + Google OAuth) with login/signup/reset flows
- Add database schema with RLS, care team invites, mood logs
- Add real-time task sync via Supabase Realtime
- Add 5-language i18n (en, zh, ms, ta, ph)
- Add FDW simplified mode (large text, audio cues)
- Add mood log + burnout score
- Move Subsidies to its own route
- Update README and add DEPLOY guide"

# Connect to your GitHub repo (replace with your URL)
git remote add origin git@github.com:YOUR_USERNAME/ally-app.git
# OR using HTTPS:
# git remote add origin https://github.com/YOUR_USERNAME/ally-app.git

git branch -M main
git push -u origin main
```

If you've already created the repo on GitHub via `gh repo create`, the remote is already set — skip the `git remote add` step.

## Step 3 — Deploy to Vercel (3 min)

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `ally-app` GitHub repo
3. **Framework**: Next.js (auto-detected)
4. Open the **Environment Variables** section and add:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | (your key from console.anthropic.com) |
   | `NEXT_PUBLIC_SUPABASE_URL` | (from Supabase → Project Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key from same place) |
   | `NEXT_PUBLIC_SITE_URL` | leave blank for now, edit after first deploy |

5. Click **Deploy**. First build takes 2–3 minutes.

## Step 4 — Wire up the URLs (2 min)

After Vercel finishes:

1. Copy your live URL (e.g. `https://ally-app-abc123.vercel.app`)
2. **Vercel** → Project → Settings → Environment Variables → set `NEXT_PUBLIC_SITE_URL` to that URL → trigger a redeploy
3. **Supabase** → Authentication → URL Configuration:
   - **Site URL**: change to your Vercel URL
   - **Redirect URLs**: add `https://YOUR_URL/auth/callback`

## Step 5 — Smoke test

Open the live URL. You should see the login screen. Sign up with a real email, confirm via the link Supabase sends (check spam), come back and sign in. Run through:

- [ ] Language picker (try Mandarin or Tamil — UI translates instantly)
- [ ] Onboarding (3 steps: name & relationship → patient details → care kind)
- [ ] Discharge upload → tap "Use Demo SGH Document" → "Parse with AI" → "Activate Care Plan ✓"
- [ ] Home tab: see burnout banner, do a mood check-in, see today's tasks
- [ ] Tasks tab: tick a task off, see the progress bar move
- [ ] Open a task → see steps, mark complete from modal
- [ ] AI Ally tab: ask a quick question, get Claude's response with the disclaimer footer
- [ ] Profile: switch to Mandarin / Malay / Tamil / Filipino — UI labels change. Toggle FDW simplified mode — text gets larger.
- [ ] Profile → Care team → invite an email. The invite gets a unique URL. Open it in an incognito window with a different account → accept → you're now on the team. Tasks sync in real time.
- [ ] Subsidies route (`/subsidies`) — six SG schemes with current 2026 amounts
- [ ] Sign out → sign back in → all your data is still there

## What to do if something breaks

| Symptom | Most likely cause | Fix |
|---|---|---|
| "Invalid API key" on signup | Anthropic key not set in Vercel env | Re-check env vars and redeploy |
| Stuck on `/login` after signup | `NEXT_PUBLIC_SITE_URL` wrong | Set it to the Vercel URL exactly, redeploy |
| Email confirmation link goes nowhere | Supabase Site URL not updated | Update under Auth → URL Configuration |
| RLS error in console | Schema not applied | Re-run `supabase/schema.sql` in SQL Editor |
| Google sign-in fails | OAuth provider not configured | Either configure it under Auth → Providers, or use email/password |

## What's still on the roadmap (not in this build)

- Singpass / MyInfo identity verification
- HealthHub / NEHR integration via Synapxe HealthX Sandbox
- Hospital QR-code onboarding from discharge summary
- Push notifications (PWA service worker)
- Offline mode
- Calendar sync

These are Year 2 items per the Strategy Bible. Ship what's here first, get caregivers on it, iterate.

---

**That's it.** When the live URL is up, send it to two or three caregivers you know and ask them to spend 10 minutes walking through it. Their first impressions are worth more than any further code we could write tonight.
