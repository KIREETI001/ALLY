# ALLY v2 — Rebuild Blueprint

**Inputs:** STRATEGY.md (cited research) · current codebase audit · domain-wisdom architecture seeds.
**Scope honesty:** this session rebuilds the core in-place (incremental — Seed 8: "the smallest cut heals fastest"), not a rewrite. Native mobile, WhatsApp production integration, and hospital pilot tooling are roadmap, designed-for now.

---

## 1. What the audit found (current state)

A hackathon-grade demo: browser phone-frame mockup; paste-text-only discharge parsing whose failures are silently masked by `DEMO_PARSED` fallback; subsidy figures hardcoded in a system prompt (incl. a wrong single-tier HCG and reliance on a scheme defunct since 2019); non-streaming chat with no care-plan context; one patient per user; no API auth/validation/rate-limiting visible; no PDPA posture; in-file i18n; outdated model string.

What's worth keeping: the data model skeleton (profiles/patients/care_plans/tasks/care_team/mood_logs), the human-confirmation step before plan activation (now a regulatory asset, not just UX), the 5-language ambition, FDW mode as a concept, Supabase + Next.js stack.

## 2. Product spec v2 — the three jobs

**Job 1: Discharge → executable family care plan (the wedge).**
- Input: photo/PDF/text of discharge summary (Claude vision) — not paste-only.
- **Transcribe-and-structure contract (SaMD-safe per HSA GL-07-R2):** the parser extracts and organises ONLY what the document says — diagnosis, medications (name/timing as written), warnings, follow-ups, diet. It never invents dosages, schedules beyond the document, or clinical advice. Every extracted item carries `source_quote` provenance back to the document text and a confidence flag; low-confidence items are visually flagged for the human-confirmation step.
- Output: care plan + task list, each task linked to its source line; tasks assignable to family members or the MDW.

**Job 2: Subsidy navigator (the magnet).**
- Deterministic, versioned rules engine in the database (NOT the LLM): June-2026-verified figures for HCG tiers ($600/$400/$200 by PCHI), CTG, MDW levy concession, CareShield (claim-year aware), SMF, ElderFund, CHAS tiers, LTC subsidies (Jul 2026 enhancement), with `last_verified` dates and "confirm with AIC" microcopy. MediFund shown as discretionary, no amount. FDW Grant removed.
- Eligibility wizard computes the household's entitlement stack from PCHI/ADL inputs; Singpass/Myinfo prefill is a designed-for integration (roadmap).
- LLM explains results in the user's language; it never computes amounts.

**Job 3: Care circle that includes the MDW (the moat).**
- MDW joins by invite without needing Singpass/HealthHub (which excludes FIN holders) — phone-based identity, Tagalog/Bahasa UI, task-level access only (no raw medical document access by default — PDPA minimisation).
- WhatsApp-shaped coordination: daily digest + task reminders modeled now (notification tables, digest generator), WABA send stubbed behind env flag until the business account exists.
- Burnout layer: mood check-ins trigger escalating support content; AI chat is care-plan-aware, multilingual, educates and signposts (995, polyclinics, AIC) — never diagnoses.

## 3. Architecture (domain-wisdom seeds applied)

- **Seed 1/13 — each organ has one job:** Postgres stores truth; reminder/digest dispatch is a scheduler+worker concern (pg_cron only for SQL maintenance; HTTP fan-out via external scheduler — QStash/Trigger.dev class — when WABA goes live). Never the DB as courier.
- **Seed 4/14 — projections over computation:** `entitlement_results` and `today_view` are computed projections; the home screen reads a projection, not live aggregation. Subsidy rules are versioned rows (`subsidy_schemes` + `subsidy_rules`), entitlements recomputed on input change, cached per household.
- **Seed 17 — idempotent jobs:** reminders carry deterministic keys (`task_id+date+channel`); safe to retry.
- **Seed 19 — jitter:** morning reminders spread over a window, not a synchronized 8:00 burst.
- **Seed 18 — graceful degradation:** if Claude is down, parsing queues with an honest status — no more silent demo-data substitution; chat degrades to cached FAQ + emergency signposting.
- **Multi-tenant locale packs (expansion-ready):** language packs + country subsidy modules + data-residency boundary per market (MY → HK → TW per STRATEGY §5), so Asia expansion is configuration + content, not re-architecture.
- **Security/PDPA:** every API route authenticates via Supabase session; zod validation; per-user rate limits; RLS on all tables (policies in `supabase/rls.sql`); raw discharge text deletable while structured plan persists (minimisation); consent recorded at upload; export/delete endpoints; no user data in model training; breach runbook documented.
- **Models:** Sonnet-tier for parsing (accuracy-critical, ~$0.02–0.05/parse), Haiku-tier for chat with prompt caching (~$0.05–0.30/user/mo). >85% gross margin at $9.90–14.90/mo Family+ tier.

## 4. Build plan (this session)

| # | Change | Why first |
|---|---|---|
| 1 | Parser v2: vision upload + transcribe-only prompt + provenance + zod + honest errors | The wedge; SaMD + liability posture |
| 2 | Subsidy rules engine + verified data + eligibility wizard + new /subsidies | Kills the stale-prompt liability; the B2C magnet |
| 3 | Chat v2: streaming, care-plan context, language-aware, safety contract | Table-stakes vs HealthHub AI |
| 4 | API hardening: auth, zod, rate-limit; RLS SQL | PDPA floor |
| 5 | Multi-patient + MDW task-scoped access model | Moat mechanics |
| 6 | Notification/digest schema + generator (WABA-stubbed) | Channel decision, de-risked |
| 7 | PDPA scaffolding: consent, export, delete | Venture-grade trust |

Roadmap (not this session): WABA production send, Singpass/Myinfo, PWA→native, hospital pilot dashboard, Synapxe HealthX sandbox application, MY locale pack.

## 5. KPIs that prove the strategy

Activation: % of new families with an activated plan in 48h (target >60%). Wedge: parses/week; % tasks with MDW assignee (MDW-inclusion proof). Magnet: navigator completions → signups conversion. Retention: 8-week family retention >35%; reminder response rate. B2B2C readiness: time-from-discharge to plan activation (<24h) — the number a transitional-care buyer cares about.
