# Demo Script + E2E Test (run once before sleeping)

## Setup (once, ~5 min)
1. Supabase SQL Editor → run `supabase/schema.sql` (idempotent, safe to re-run) → then `supabase/migrations/0002_v2_security_and_carelog.sql` → then `supabase/migrations/0003_payments_demo.sql`. Each should end "Success."
2. `.env.local` present (it is) → `npm run dev` → http://localhost:3000.
3. Have on your phone/desktop: a photo of any discharge-style document (or use the in-app demo text), and optionally a real pharmacy receipt photo.

## E2E pass (15 min — tick every box)

**Auth + onboarding**
- [ ] Sign up fresh account → language screen → onboarding (you + patient) completes.

**Job 1 — Discharge → plan (the wedge)**
- [ ] Discharge screen: tap "Use Demo SGH Document" → Parse → review shows diagnosis, 4 meds with *source quotes*, warnings, tasks.
- [ ] Deliberately upload a blurry/odd photo → expect an honest error or low-confidence ⚠ flags (NOT fake demo data). This is the parse-failure UX — it should feel trustworthy, not broken.
- [ ] Activate → lands on Home; Tasks tab shows tasks; mark one done (care_log row is written — proof-of-work).

**Job 2 — Subsidy navigator (the magnet)**
- [ ] Home → subsidy card → wizard: set PCHI band ≤ $1,500, ADL 3, age 78 → HCG shows **S$600/month Eligible**; CareShield, levy concession update live; every card has an official-source link + "verified 2026-06-10".

**Job 3 — Wallet (the OTLRS layer)**
- [ ] Wallet tab → posture strip visible ("ALLY never holds money…").
- [ ] Set up helper payroll: name "Maria", S$650, payday 28, corridor Philippines → card appears with next payday.
- [ ] "Initiate via PayNow" → reference `ALLY-SAL-…` shows with Copy → "Mark paid" → ✓ Paid 2026-06.
- [ ] HCG selector S$600 → coverage bar shows **92%** of S$650 salary.
- [ ] "Demo receipt" → Guardian S$192.80 parses with source quote → add a sibling name chip ("David") → Save & split → equal shares appear (sum reconciles exactly) → tap a chip → settles ✓ → tap again → back to pending.
- [ ] Snap a REAL receipt photo if you have one — this is the booth wow; verify the total matches the paper.

**Phase 2 — Claims + Resource Hub + Transparency**
- [ ] Wallet: tick 2 saved expenses (circle selectors) → destination "Insurer" → Prepare (2) → bundle renders with itemised lines, category subtotals, exact total, "assembled without AI" note.
- [ ] Copy bundle works → Mark submitted → green ✓ Submitted.
- [ ] Resources tab: categories filter; every card opens a real page (AIC/CPF/CHAS/MOM links) in a new tab; "How ALLY handles medical data" routes in-app.
- [ ] /transparency: all 6 steps render; "What ALLY never does" present; Back returns.

**Phase 3 — Wallet simulation (labeling is the test)**
- [ ] Wallet: Family Wallet card shows PHASE 3 · SIMULATION badge + dashed border.
- [ ] Open simulation → watermarked balance card, +S$100 top-up changes number, auto-pay preview computes paydays covered.
- [ ] Confirm NOTHING persists: refresh page → simulation resets (this is correct behaviour, not a bug).
- [ ] Say out loud at the booth before tapping it: "concept preview — ships only with a licence or licensed partner."

**Chat + digest + privacy**
- [ ] Chat: ask "what financial aid is available?" → streams, cites the verified figures, ends with the 995 disclaimer.
- [ ] Visit `/api/digest` (logged in) → JSON digest with tasks + warnings (WhatsApp-shaped).
- [ ] `/api/privacy/export` downloads your data JSON.

**Security spot-checks**
- [ ] Log out → `POST /api/chat` (or just reload `/api/digest`) → 401, not data.
- [ ] Second account cannot see the first account's plan (RLS).

## Booth demo order (90 s)
Demo text discharge → activate → Wallet: demo receipt → split → settle → payroll initiate → HCG bar → one chat question in Tagalog/Chinese. Phone in one hand, eye contact with the human, not the screen.

## Known demo-day caveats
- New wallet/subsidy UI strings are English-only (core tabs remain 5-language).
- Remitter "Compare rates" is a deliberate Phase-2 stub — say so before they tap it.
- If conference Wi-Fi dies mid-parse: the app shows an honest error; re-run on hotspot. Record a backup video of one successful pass tonight.
