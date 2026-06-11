# Medical Data Processing Pipeline — Engineering & Compliance Specification

**Scope:** every byte of health information ALLY touches, from ingestion to erasure. **Audience:** engineers, auditors, hospital/insurer partners, regulators. **Plain-language mirror:** the in-app `/transparency` page — if this document and the code disagree, that is a release-blocking bug. **Verified:** regulatory citations from the adversarially-checked June 2026 research pass (docs/strategy/STRATEGY.md §2, docs/compliance/PSA-READINESS.md).

---

## 1. Data classification

| Class | Examples | Treatment |
|---|---|---|
| **Sensitive health data** (PDPA heightened category per PDPC Healthcare Sector AG 2023) | Discharge text/photos, diagnosis, medications, warnings, care tasks, mood logs | Everything in §2–§9 |
| Financial-adjacent | Receipts, expenses, payroll records | Same storage/RLS controls; never enters any LLM prompt except receipt transcription |
| Account data | Email, name, language | Standard PDPA |

Mood logs are deliberately scoped to the individual caregiver only (not the care team): burnout data about the carer is sensitive in its own right.

## 2. Pipeline — stage by stage (with code anchors)

**S1. Ingestion** — `DischargeFlow.tsx`, `lib/upload.ts`. Photo/PDF/text. Images are downscaled client-side to 1600px JPEG via canvas, which also strips EXIF/GPS metadata before anything leaves the device. Size caps enforced client- and server-side.

**S2. Consent** — `api/parse-discharge` inserts a `consents` row (user, purpose `parse_discharge_document`, timestamp) before processing. Erasure actions are also recorded as consent events (PDPA accountability trail).

**S3. Transport & auth** — HTTPS only; every route authenticates the Supabase session server-side and rate-limits per user (`lib/ratelimit.ts`). Unauthenticated calls receive 401 JSON with no data.

**S4. AI transcription under a constrained contract** — `api/parse-discharge`, `api/parse-receipt`. Model: `claude-sonnet-4-6` (accuracy-critical tier). The system prompt enforces TRANSCRIBE-ONLY (no invented dosages, no schedules beyond the document, no clinical advice; vague timings stay vague). Output is **forced through a typed tool schema** — the model cannot reply in free text. Every extracted item must carry `source_quote` (verbatim provenance) and a `confidence` flag; illegible regions go to `unreadable_sections` instead of guesses. **This is the HSA GL-07-R2 line:** organising existing information ≠ medical device; generating recommendations = SaMD. The contract is enforced in three layers: prompt, schema, and S5.

**S5. Deterministic server-side re-validation** — `sanitize()` in both parse routes. Tool schemas constrain shape, not honesty, so the server clamps lengths, whitelists enums (task types, categories), drops unknown fields, coerces confidence to `low` on anything irregular, and rejects outputs with no clinical content (422). *Threat note — prompt injection via document:* a photographed document could contain adversarial text ("ignore your instructions…"). Mitigations: forced tool schema (no free-text channel), transcribe-only prompt, S5 whitelisting, and S6 human review. Residual risk: a manipulated `source_quote`/title — visible to the reviewing human by design.

**S6. Human-in-the-loop gate** — nothing becomes a care plan without explicit user confirmation on a screen that shows each item beside its provenance quote, with low-confidence items visually flagged. The AI cannot activate anything.

**S7. Storage** — Supabase Postgres, `ap-southeast-1` (Singapore) region per deployment guide; encryption at rest is provider-standard [Likely — verify in DPA, §10]. Row-Level Security on every table (`schema.sql`, migrations 0002–0004): care data readable only by the plan owner and invited care-team members; the helper's access is task-scoped — raw discharge text is not exposed in her views. The `care_log` is append-only.

**S8. Downstream AI use (chat)** — `api/chat`. Context is fetched server-side under the user's own session (never trusted from the client), summarised into the prompt, and governed by a safety contract: educate/signpost only, never diagnose or dose, emergencies → 995 first. Subsidy figures are injected from the deterministic rules module (`lib/subsidies.ts`) — the model explains, never computes. Cheaper model tier (`claude-haiku-4-5`), 800-token cap.

**S9. Deterministic outputs (no-AI zones)** — claim bundles (`lib/claims.ts`) and the daily digest (`lib/digest.ts`) are assembled from stored rows with zero LLM involvement: money + medical summaries are exactly where hallucination is least acceptable. Entitlement math is likewise rules-engine-only.

**S10. Retention & erasure** — `api/privacy/export` (full JSON export); `api/privacy/delete` scope `raw_documents` (deletes original discharge text while keeping the confirmed structured plan — data minimisation: the source served its purpose) or `account_data` (cascading deletion of patients → plans → tasks/care_log/expenses). Erasures take effect immediately and are logged as consent events.

**Model-provider handling:** API traffic to Anthropic is not used to train models per commercial terms [Likely — execute DPA and confirm retention tier, §10]. No PHI is sent to any analytics service (none is installed).

## 3. Regulatory mapping

| Obligation | Source | Control |
|---|---|---|
| Sensitive-data protection standard | PDPA + PDPC Healthcare AG (2023) | S3 auth, S7 RLS+region, §1 classification |
| Consent & accountability | PDPA | S2 consent rows; export/delete endpoints |
| Breach notification (3 days, health data prescribed) | PDPA Br. Notif. Regs | §9 runbook |
| AI transparency to users | PDPC AI AG (Mar 2024); AIHGle 2.0 §8.2/8.3 (Mar 2026) | `/transparency` page; in-flow disclaimers; provenance UI |
| Not a medical device | HSA GL-07-R2 (Jul 2025) | S4 transcribe-only contract + S5 + S6; chat safety contract |
| No NEHR access for consumer apps | Health Information Act (2026) | User-mediated data only (S1); no NEHR integration exists |
| Human oversight of AI | AIHGle 2.0 | S6 gate; nothing auto-activates |
| No liability disclaimers for negligence re injury | UCTA | Disclaimers inform, controls protect (S4–S6); E&O insurance planned (§10) |

## 4. Sub-processors

| Processor | Role | Data | Status |
|---|---|---|---|
| Supabase | Database, auth | All stored data (SG region) | DPA to execute before public launch |
| Anthropic | LLM transcription/chat | Document content at parse time; chat context | DPA + retention tier to confirm |
| Vercel | Hosting | Transit only | Standard terms; confirm SG/edge config |

## 5. Logging rule

Application logs carry error classes and request metadata — never document content, never parsed clinical fields. `console.error` in routes logs provider error objects only. CI grep for accidental payload logging is a planned control (§10).

## 6. Prompt & model change control

The system prompts in `api/parse-discharge`, `api/parse-receipt`, `api/chat` are regulatory controls, not copy. Any change requires: PR review against GL-07-R2 wording, re-run of the 20-document accuracy benchmark (council verdict metric), and a changelog entry. Model version strings are pinned in code; upgrades follow the same gate.

## 7. Access model summary

Owner: full CRUD on their patients/plans. Care-team member: read plan, read/update tasks, append care_log, wallet records of their plan. Helper (MDW role): same as member in v1 — task-scoped UI; raw document text not surfaced in her flows [UI-enforced today; column-level RLS is a §10 hardening item]. No ALLY staff dashboard exists; production DB access is owner-only via Supabase console with 2FA [to formalise, §10].

## 8. The "never" list (product law)

No diagnosis · no dose recommendations or schedule generation · no overriding clinician instructions · no NEHR access · no sale or sharing of personal data · no model training on user data · no AI in money or claims math · no auto-activation of any plan · no emergency handling beyond directing to 995.

## 9. Incident response (PDPA)

Detect → contain (revoke keys, isolate) → assess scope within 72h (health data = prescribed category; ≥1 affected person can be notifiable on significant-harm test) → notify PDPC within 3 calendar days of assessing notifiability; notify affected users without unreasonable delay → post-mortem appended here. Contact: founder (interim DPO — see §10).

## 10. Open gaps — required before public launch (none are blockers for tomorrow's supervised demo)

1. **DPIA** (PDPC-format) — half-day exercise once flows freeze.
2. **DPO appointment** (PDPA s.11(3) requires one; founder interim, must be formalised + published).
3. **Anthropic DPA + retention tier** — confirm zero/limited-retention option for parse traffic.
4. **Supabase DPA + region/SOC2 evidence** — confirm `ap-southeast-1` pinning in the live project.
5. **Read-access audit logging** — care_log records actions; row *reads* are not audited yet.
6. **Column-level protection** for `raw_discharge_text` (today: UI-scoped for MDW role; target: RLS column privilege or separate table).
7. **Penetration test + dependency audit** before any institutional pilot.
8. **Clinical advisor co-sign** of task-type templates and safety copy (council verdict: converts compliance into trust).
9. **Parser accuracy benchmark** — the 20-real-documents protocol with % parsed-without-edits, re-run on every prompt/model change.
10. **Privacy policy + ToS** lawyer pass; publish DPO contact.
11. **Safety copy i18n** — disclaimers and warning flags currently English-first; the moat languages (Tagalog/Bahasa) must ship before MDW-facing launch.
12. **Tech E&O / cyber insurance** quote.
