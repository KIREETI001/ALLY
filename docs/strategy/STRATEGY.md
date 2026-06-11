# ALLY — Market, Regulatory & Financial Strategy (Singapore-first, Asia-next)

**Date:** 10 June 2026 · **Method:** 5-angle parallel research fan-out, 15 adversarially verified load-bearing claims, primary (.gov.sg) sources preferred · **Confidence tags:** [Certain] = verified on primary source · [Likely] = credible secondary, consistent · [Guessing] = inference, labeled.

---

## 0. The verdict in four sentences

The demand is venture-grade, but the competitor is not Homage — it is the free government stack (HealthHub AI, SupportGoWhere, AIC), which already does multilingual health chat and subsidy Q&A. ALLY survives only where the state structurally cannot go: operationalising the discharge-to-home transition into an executable family care plan, and including the 316,900 migrant domestic workers who deliver most hands-on care hours yet are formally locked out of HealthHub caregiver access. The primary revenue driver should be B2B2C (hospitals/transitional-care programmes and insurers distributing ALLY at the discharge moment), with B2C freemium as the acquisition funnel and an MDW-ecosystem layer as secondary revenue. Regulations do not block this product — but PDPA (health data) and HSA's SaMD boundary dictate exactly how the parser must be designed: transcribe and organise what clinicians wrote; never generate new clinical recommendations.

---

## 1. Market: demand and competition (Singapore)

### Demand — [Certain] unless noted
- 20.7% of citizens were 65+ in 2025; ~1 in 4 by 2030; the 80+ cohort grew ~60% in a decade to 145,000. ([Population in Brief 2025](https://www.population.gov.sg/files/media-centre/publications/Population_in_Brief_2025.pdf))
- ~14% of residents aged 48–79 are caregivers; 45% also work full-time; 1 in 3 has chronic illness themselves. ([SMU ROSA, 2025](https://news.smu.edu.sg/news/2025/04/09/smu-report-nearly-14-older-adults-are-caregivers-over-half-aged-60-and-above))
- 316,900 MDWs held work permits in Dec 2025; roughly half of families caring for frail seniors engage an MDW, and MDWs average ~42 caregiving hours/week vs 33 for primary family caregivers [Likely]. ([MOM](https://www.mom.gov.sg/foreign-workforce-numbers); [HOME, 2024](https://www.home.org.sg/our-updates/2024/11/19/migrant-domestic-workers-making-them-count))
- Caregiver depression ~23.4% vs 9.2% non-caregivers [Likely]; informal caregiving valued at S$1.28B/yr (Duke-NUS) [Likely]; only ~5% of caregivers have attended training.
- 30-day readmission for 65+ is ~18.6–19% [Likely, 2019–21 data] — the discharge transition is measurably broken. ([MOH](https://www.moh.gov.sg/newsroom/hospital-readmission-rates/))

### Competition — the real map
| Player | What they are | What they are not |
|---|---|---|
| **HealthHub AI** (Synapxe, beta Apr 2025) | Free multilingual (EN/ZH/MS/TA) text+voice health assistant [Certain] | Not a caregiver workflow; doesn't operationalise discharge summaries; no Tagalog; no MDW access |
| **SupportGoWhere** (LifeSG) | Free scheme/subsidy recommender [Certain] | Doesn't compute a household's full entitlement stack against a live care plan |
| **Homage** | Care marketplace, ~S$23–28/hr; US$45M raised, no round since 2021 [Certain/Likely] | Not software-first; no AI co-pilot; a referral partner, not a threat |
| **CaregiverAsia** | Freelance care marketplace [Likely] | No coordination/AI layer |
| **Jaga-Me** | Acquired by Alliance Healthcare (2019), B2B home-medical [Certain] | Not consumer caregiving software |
| **NUHS RUSSELL-GPT** | Clinician-side LLM that *writes* discharge summaries, 1,000+ clinicians [Certain] | Clinician-facing only — validates the tech, doesn't serve families |

**Deadpool note:** no prominent SG caregiver app death 2023–26; the pattern is stagnation and consolidation, i.e. nobody has cracked software-only caregiving revenue [Likely]. Nearest analog failure: GenWise (India, 2025) died selling apps *to seniors* — ALLY sells to working-age caregivers, a materially different buyer.

### The whitespace (verified)
1. **Consumer-side discharge operationalisation** — patients can *view* public-hospital discharge summaries in HealthHub (past 3 years; private hospitals absent) [Certain], but nothing turns them into an executable, multilingual, shared care plan. RUSSELL-GPT proves LLM discharge processing works institutionally.
2. **MDW-inclusive coordination** — HealthHub caregiver access requires BOTH parties to be Citizens/PRs; FIN holders (all MDWs) are explicitly ineligible [Certain — adversarially verified]. ([HealthHub support](https://support.healthhub.sg/hc/en-us/articles/15755809046425)) The state has structurally excluded the person doing 42 hrs/week of care. This is ALLY's moat against the free stack.
3. **Unified workflow** — schemes (SupportGoWhere), training (AIC), services (Homage) are siloed; no product unifies the daily loop.

---

## 2. Regulatory map (Singapore) — what bites, what doesn't

| Regime | Verdict for ALLY | Design consequence |
|---|---|---|
| **PDPA** (+ Healthcare Sector AG 2023, AI AG Mar 2024) | **Bites hardest, immediately** [Certain] | Health data = heightened protection. Breach notification within 3 days of assessment if significant harm likely (health data is a prescribed category) or ≥500 affected; penalties up to 10% of SG turnover or S$1M. Need: consent flows, minimisation, retention policy, breach runbook, AI transparency notices, no training on user data. |
| **HSA SaMD — GL-07-R2 (Jul 2025)** | **The product-design constraint** [Certain — verified] | Software that *displays/organises existing* medical information, or outputs *solely based on established guidelines with no new/modified clinical recommendations*, is NOT a medical device. Generating patient-specific recommendations IS SaMD. → Parser must **transcribe-and-structure** the clinician's instructions with provenance; AI chat must educate and signpost, never dose or diagnose. ([GL-07-R2](https://isomer-user-content.by.gov.sg/409/ae814059-a3ff-4ce3-8192-4534a43ddc6f/gl-07-r2-guidelines-risk-classification-samd-cdss-(2025-jul)-pub.pdf)) |
| **HCSA** | Out of scope while non-clinical [Certain] | Care-coordination/information apps aren't licensable. **Tripwire:** adding teleconsults or nursing services triggers licensing (Outpatient Medical Service). Keep clinical services as partner referrals. |
| **Health Information Act** (passed 12 Jan 2026; phased from early 2027) | Indirect [Certain] | No NEHR read path for consumer apps — ever, under current design. Data comes user-mediated (uploads, photos, HealthHub PDFs) or via institutional partnership. Batch 1 providers contribute by Sep 2027 — partnership data quality improves over time. |
| **AIHGle 2.0** (MOH+HSA, 10 Mar 2026) | Non-binding but reputationally binding [Certain] | §8.2 GenAI + §8.3 direct-to-consumer AI: follow it to be partnership-eligible (Synapxe, hospitals). Includes sandbox concepts — but the Feb 2026 HSA AI-SaMD sandbox covers public entities only. |
| **MOM / EA Act** | No licence for ALLY's software [Certain, with caveat] | Task-assignment for an *already-employed* MDW isn't placement. **Caveat [Guessing]:** MOM has never explicitly addressed care-coordination software; get a confirmation letter before the agency-channel play. MDW may only work at employer's registered address — don't build features implying deployment elsewhere. |
| **Liability** | Standard [Certain] | UCTA: cannot disclaim death/personal-injury negligence. Human-confirmation step on every parsed plan (already in product) + provenance + tech E&O insurance. |

**The three that bite:** PDPA (now), SaMD boundary (product design), HCSA (only if you drift into clinical services).

---

## 3. Financials

### 3a. Verified subsidy data (ship this, not the hardcoded prompt)
All adversarially verified on aic.sg / mom.gov.sg / cpf.gov.sg, June 2026. The app currently hardcodes "HCG S$600/mo" — **that is only the lowest-income tier** and the old FDW Grant the demo-era design assumed is **defunct since Oct 2019**.

| Scheme | Current value (Jun 2026) | Notes |
|---|---|---|
| Home Caregiving Grant | **S$600 / S$400 / S$200 per month** by PCHI tier ($0–1,500 or AV≤$21k / $1,501–3,600 / $3,601–4,800) | ≥3 of 6 ADLs; multi-property → $200 tier; effective Apr 2026 |
| Caregivers Training Grant | $400 start + $200/yr top-up, balance capped $400 | MDW training eligible |
| MDW Levy Concession | $60/mo (vs $300 standard) | Senior ≥67 / child <16 / ≥1 ADL |
| CareShield Life | **$689/mo for 2026 claims**, while severely disabled (≥3 ADLs) | Amount depends on claim year — display dynamically |
| Seniors' Mobility & Enabling Fund | Up to 90% of device cost | PCHI-tiered |
| ElderFund | Up to $250/mo | Severely disabled, lower-income, ≥30 |
| CHAS (chronic) | Blue $80–125/visit; Orange $50–80; Green $28–40; MG/PG $85–90 | Tier-dependent caps |
| Non-residential LTC subsidies | Up to **95%** from **Jul 2026** (threshold raised to PCHI $4,800; cohort top-ups) | Major enhancement — a marketing moment |
| MediFund | Discretionary — **no fixed quantum**; do not hardcode | Institution-assessed |
| ~~FDW Grant~~ | **Defunct** (subsumed into HCG, Oct 2019) | Remove |

**Product rule derived:** subsidy figures live in a versioned database with `last_verified` dates and "as of June 2026 — confirm with AIC" microcopy; a deterministic rules engine computes entitlements; the LLM only explains. Never let the model do means-testing arithmetic.

### 3b. Non-dilutive funding path
- **Startup SG Founder:** S$50k grant, 1:1 co-match, first-time founder, ≥51% SC/PR, <6-month-old company [Likely — official page JS-blocked, multi-source consistent].
- **Startup SG Tech:** POC up to **S$250k** / POV up to **S$500k** [Certain — the "$400k/$800k" figure circulating on blogs was refuted].
- Synapxe **HealthX Innovation Sandbox 2.0** (2,300+ FHIR APIs, synthetic data) — credibility + partnership channel, not funding [Certain].
- SEA agetech VC is thin (Homage flat since 2021) [Likely] — plan for grants + angels to seed; institutional money follows the hospital pilot, not the idea.

### 3c. Unit economics (order-of-magnitude, [Likely])
- COGS: Claude Sonnet 4.6 $3/$15 per MTok, Haiku 4.5 $1/$5 (parse on Sonnet ≈ $0.02–0.05/discharge; chat on Haiku-blend ≈ $0.05–0.30/user/mo with caching); Supabase $25–75/mo; WhatsApp utility ~US$0.011/msg SG (Apr 2026 card — verified correction) → a reminder-heavy family ≈ S$0.50–1.50/mo.
- B2C price point $9.90–14.90/mo (Family+ tier) → **>85% gross margin** at modest scale.
- B2B2C: per-discharge fee (S$15–40 one-time activation) or per-enrolled-family/mo (S$5–10) against a hospital's readmission economics; ACTION programme halved unplanned rehospitalisation odds (OR 0.5) [Certain — published], MIC@Home mainstreamed Apr 2024 — buyers are already paid to push care home.
- Insurer layer: GE's GREAT CareShield already pays a **+60% monthly-benefit caregiver top-up** [Certain] — insurers monetise caregiving and will fund retention tools.

### 3d. Sizing [Guessing, transparent arithmetic]
~210k–250k family caregivers of seniors needing ADL help (from 14% of 48–79 cohort + HCG-eligibility proxies); beachhead = ~70k annual senior discharges with care needs (proxy from readmission base rates); SOM yr-2 ≈ 2 hospital clusters × ~8k discharges + 5–10k B2C subs → S$1.5–3M ARR potential. Treat as hypothesis to validate in pilot, not a pitch fact.

---

## 4. GTM — multi-layer, evidence-ranked

**Layer 1 — PRIMARY: B2B2C at the discharge moment.** Hospitals/transitional-care teams (ACTION-style programmes, MIC@Home cohorts) hand ALLY to families at discharge; insurer co-distribution (CareShield riders). Why primary: the wedge IS the distribution point; buyers have readmission economics and mainstreamed home-care mandates; the free government stack cannot follow into family workflow. Path: Synapxe HealthX sandbox → one cluster pilot (NUHS or SingHealth community hospital) → CHISEL/InnoMatch procurement.
**Layer 2 — FUNNEL: B2C freemium.** Free: subsidy navigator with Singpass/Myinfo prefill (open to SG-registered companies [Certain]) + basic care plan. Paid Family+ ($9.90–14.90/mo): multi-member coordination, WhatsApp reminders, AI chat, MDW mode. Free navigator is the SEO/word-of-mouth magnet — and it's the one feature the July 2026 LTC subsidy enhancement makes newsworthy.
**Layer 3 — SECONDARY REVENUE: MDW ecosystem + referrals.** White-label/co-brand for maid agencies (caveat: MOM confirmation letter first), CTG-fundable training content, referral fees from vetted services (Homage, CaregiverAsia, equipment under SMF). Keeps ALLY neutral infrastructure rather than a marketplace competitor.

**Channel decision [Certain on penetration]:** WhatsApp (~80% of SG population) is the coordination rail — especially for MDWs who cannot use HealthHub. The app is the caregiver's deep-work surface; WhatsApp is where tasks, reminders and digests live.

---

## 5. Asia expansion sequence (post-SG proof)

| Rank | Market | Why | Watch-outs |
|---|---|---|---|
| 1 | **Malaysia** (6–12 mo after SG traction) | Proven SG→MY corridor (Homage, Speedoc, Doctor Anywhere); EN/ZH/MS assets reusable day one; private-hospital discharge wedge (IHH/KPJ); PDPA 2024 amendments manageable, no health-data localisation [Certain] | Smaller eldercare wallet; 7.5% 65+ — sell to urban middle class + medical-tourism hospitals |
| 2 | **Hong Kong** (12–18 mo) | 22.7% 65+; ~360k FDWs — ALLY's MDW mode is uniquely differentiating [Certain]; HK$2B gerontech I&T Fund now covers household products — a subsidised adoption channel [Certain] | Needs Cantonese + Traditional Chinese; PDPO + voluntary GenAI guidelines |
| 3 | **Taiwan** (18–30 mo) | Super-aged (20.06%); ~218k migrant caregivers (largely Indonesian-speaking — Bahasa asset!); LTC 3.0 from 2026 with ~NT$100B/yr and explicit family-caregiver support [Certain] | Mandarin localisation, local partner, tightening cross-border health-data rules — plan local hosting |
| — | Japan/Korea | Deferred: JP requires Japanese-law data hosting for medical data + reimbursement flows to licensed kaigo providers; KR has no FDW system and Korean-only | Series A+ problems |

**Architecture consequence:** multi-tenant, locale-pack design (language, subsidy rules engine, data residency) from day one of the rebuild — the subsidy rules engine must be a swappable country module, not SG-hardcoded.

---

## 6. Risks the research surfaced (ranked)

1. **The state expands into your wedge** — HealthHub AI adds caregiver features or Tagalog. Mitigation: move faster on workflow depth; position as complement (deep-link HealthHub, never scrape); pursue Synapxe partnership so you're inside the tent. Probability: moderate; the Citizens/PR-only design and all-or-nothing access model are structural, slow-to-change choices [Likely].
2. **B2B2C sales cycle starves the company** — hospital procurement is slow. Mitigation: B2C freemium launches first (it funds nothing but proves engagement); grants ($50k + $250k) bridge; insurer route as parallel shot.
3. **SaMD drift** — a well-meaning feature (e.g., "AI adjusts the schedule when symptoms worsen") reclassifies the product. Mitigation: SaMD design review gate in the PR checklist; the parser's transcribe-only contract is enforced in the system prompt AND post-validation.
4. **PDPA breach** — one leak of discharge data ends a trust business. Mitigation: minimisation (parse → structured plan → offer raw-text deletion), RLS, encryption, breach runbook, no model training on user data.
5. **Subsidy data staleness** — figures change every Budget. Mitigation: versioned rules DB with `last_verified`, quarterly review job, in-app "verify with AIC" microcopy. (This research already caught one stale figure baked into the current build.)

---

## 7. Sources (load-bearing)

Population in Brief 2025 · MOM foreign workforce numbers (Mar 2026) · SMU ROSA caregiver brief (2025) · Duke-NUS caregiving valuation (2024) · MOH readmission statement · AIC: HCG / CTG / SMF / ElderFund pages (fetched Jun 2026) · CHAS.sg subsidy tables · CPF CareShield Life page · MOF Budget 2026 Annex F-3 (LTC enhancements) · MOH press: HCG replaces FDW Grant (2019) · gov.sg explainer + MOH press: Health Information Bill (Jan 2026) · healthinfo.gov.sg implementation timelines · HSA GL-07-R2 (Jul 2025) + digital-health page (Apr 2026) · MOH-MHC-0024-2026 AIHGle 2.0 circular · PDPC Healthcare Sector AG (2023) + AI AG (2024) · MOM EA licensing + MDW employment rules · HealthHub support: discharge summaries / caregiver access (Nov 2025) · Synapxe AI Accelerate 2025 (HealthHub AI) · Lancet Western Pacific: RUSSELL-GPT discharge pilot (2024) · ACTION programme (PubMed) · MOHT MIC@Home · Meta WhatsApp pricing (Apr 2026 card) · Anthropic pricing (Jun 2026) · Homage/CaregiverAsia/Jaga-Me public pages · HK LegCo FDH brief (2025) · HK SWD I&T Fund · Taiwan Executive Yuan LTC 3.0 · Taipei Times migrant-caregiver rules (2025) · Mayer Brown: MY PDPA amendments (2025) · TechCrunch: Cera (2025) · Birdie SmartPlans (2025) · startupsg.gov.sg programme pages.
