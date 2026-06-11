# Deliverables Checklist — Day-2 build (11 Jun 2026)

## Repo organisation
- [x] `docs/strategy/` — STRATEGY.md, COUNCIL-VERDICT.md, Strategy Bible, segmentation xlsx
- [x] `docs/product/` — REBUILD-BLUEPRINT.md, DEMO-SCRIPT.md (incl. E2E test)
- [x] `docs/compliance/` — PSA-READINESS.md (MAS-verified)
- [x] `docs/pitch/` — MB16-PITCH.md, ALLY_Landing.html
- [x] `ops/` — DEPLOY.md (deployment kept separate from documentation)
- [x] Code/comments + README repointed to new paths
- [ ] Delete empty root `strategy/` folder by hand (mount permission blocked rmdir)

## Payments demo layer (OTLRS constraints)
- [x] Migration `0003_payments_demo.sql` — expenses, expense_splits, helper_payroll, payroll_runs, team-scoped RLS, no custody fields anywhere
- [x] `/api/parse-receipt` — vision + text, transcribe-only, provenance, auth + rate limit
- [x] Wallet tab — payroll card (initiate → PayNow ref → confirm; 12-cycle framing), receipt snap → equal split → tap-settle, sibling name chips, month summary
- [x] HCG × payroll integration — "subsidy covers X% of helper salary" bar (the booth line)
- [x] PSA posture in product copy (no-custody strip, "pay in YOUR bank app", referral-only remit stub)
- [x] Claims prep visible as deliberate Phase-2 stub
- [x] Shared upload helper extracted (`lib/upload.ts`)

## Compliance
- [x] PSA: verified posture (technical-service-provider exclusion), tripwires ("arranging", holding-out) engineered around, phase map + posture statement
- [x] Health side unchanged: SaMD transcribe-only contract, PDPA floor (RLS, consent, export/delete)

## Pitch & demo
- [x] MB16 pitch one-pager (opener, 90-s arc, defended numbers incl. 316,900 MDWs, PSA answer, 3 questions, mission-drift defence)
- [x] Demo script + full E2E checklist (run once before sleeping)
- [x] Demo receipt sample (goes through the REAL parser)

## Phase 2 + 3 (built 11 Jun, late session)
- [x] Claim bundles E2E: migration `0004_claim_bundles.sql` (RLS, team-scoped) · `/api/claims` (server re-fetches under RLS; IDs in, verified rows out) · `lib/claims.ts` **deterministic — zero LLM in money/medical summaries** · WalletTab: per-expense selectors → destination → bundle → copy/mark-submitted
- [x] Resource Hub populated: 12 real destinations (AIC HCG/CTG, SupportGoWhere, CPF CareShield, CHAS, MOM levy, CDE, FAST, mindline, HealthHub) with verified-URL tags, working categories, language chips, external-link affordances
- [x] `/transparency` page: 6-step plain-language pipeline + "What ALLY never does" + regulatory footer; linked from Resource Hub
- [x] `docs/compliance/MEDICAL-DATA-PIPELINE.md`: stage-by-stage spec (S1–S10 with code anchors), regulatory mapping table, sub-processors, prompt change control, prompt-injection threat note, incident runbook, **12 enumerated pre-launch gaps**
- [x] Phase 3 stored-value wallet as watermarked SIMULATION (local state only — real stored value is a PSA-licensed activity; see PSA-READINESS phase map)

## Verification gates
- [x] TypeScript: clean (`tsc --noEmit`) — verified in sandbox
- [x] ESLint: clean (`next lint` → "✔ No ESLint warnings or errors") — verified in sandbox
- [ ] Production build: **run `npm run build` once on YOUR machine** (sandbox can't — Windows-only SWC binary in node_modules; tsc+lint already clean so failures are unlikely)
- [ ] Route smoke (2 min, during E2E): open `/api/digest` logged OUT → expect 401 JSON; logged IN → digest JSON
- [ ] Human E2E pass (you, tonight — docs/product/DEMO-SCRIPT.md, tick every box)
- [ ] Backup demo video recorded after E2E passes

## Deferred on purpose (don't get pulled into these tonight)
- WABA production sending (Meta verification pending) · Singpass/Myinfo · i18n for new wallet/subsidy strings · real remitter partner integration · `subsidy_rules` admin tooling
