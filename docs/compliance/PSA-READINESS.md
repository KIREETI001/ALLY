# PSA Readiness — Family Care Wallet (Singapore Payment Services Act)

**Verified 11 Jun 2026** against MAS primary sources + statute text (SSO). Confidence tags: [Certain] = primary source fetched · [Likely] = credible secondary, consistent.

## Posture statement (say this verbatim at the booth)

> "ALLY today is a caregiving record-keeping and payment-instruction tool, not a payment service provider — we never hold, receive, transmit or control money, and MAS expressly treats providers that process only payment instructions and data as outside PSA licensing. Sibling settlements happen entirely in each user's own banking app over PayNow; we just generate the reference and record the outcome. The helper-salary corridor will be executed end-to-end by a licensed Major Payment Institution remitter, with the customer contracting directly with that licensee and ALLY as the referral interface. When we add real money movement ourselves, we will need a Standard or Major Payment Institution licence — cross-border money transfer, plus account issuance and e-money if we add a stored-value wallet — and we have scoped that under MAS's PS-G01 guidelines."

## Why ALLY is outside PSA scope today

1. [Certain] PSA licenses 7 activities (account issuance, domestic transfer, cross-border transfer, merchant acquisition, e-money, DPT, money-changing); a licence attaches to "carrying on a business" of one. — mas.gov.sg/regulation/payments/licensing-for-payment-service-providers/types-of-payment-services
2. [Certain] Transfer definitions hinge on **accepting money** for transmission; account/e-money services require operating a **funded** account. ALLY's expense records, splits and PayNow references involve no fund flow. — sso.agc.gov.sg/Act/PSA2019 (First Schedule)
3. [Certain] First Schedule **Part 2 excludes technical service providers** that support payment services "but do[] not at any time enter into possession of any money," including "processing and storing data." This is ALLY's exact design. — sso.agc.gov.sg/Act/PSA2019?ProvIds=Sc1-
4. [Certain] MAS FAQ states verbatim that providers which "process only data (e.g. payment instructions) and not money" are unregulated. — mas.gov.sg payments FAQs (rev. 19 Apr 2024)
5. [Likely] No PSD2-style "payment initiation" category exists in Singapore — pay-by-link/reference generation without fund flow stays unregulated (absence claim).

## The two tripwires (engineered around, not ignored)

- **"Arranging" cross-border transfers** — since 4 Apr 2024, CBMT includes *arranging* transmission "whether as principal or agent," even with no money accepted in Singapore. [Certain] — mas.gov.sg media release, 2024. **Product rule:** the remitter referral must be a click-out where the customer contracts directly with the licensed MPI. ALLY never collects remittance instructions, never quotes a binding rate, never sits in the instruction chain. The in-app copy says "Compare rates →" and stops.
- **Holding out** — offering/advertising a payment service without a licence is a s.5 offence. **Product rule:** UI copy never says ALLY "pays," "transfers," or "remits." Implemented: the wallet's posture strip ("ALLY never holds money…"), "Pay in YOUR bank app via PayNow," and "licensed partner remitters."

## When licensing IS needed (phase map)

| Phase | Feature | PSA consequence |
|---|---|---|
| Now (demo/pilot) | Records, splits, PayNow references, referral stub | None — technical service provider [Certain] |
| Phase 2 | Embedded remittance with partner, ALLY in the flow | Either partner-of-record structure keeps ALLY out, or "arranging" → ALLY needs SPI/MPI (CBMT) [Likely] |
| Phase 3 | Stored-value family wallet, direct PayNow participation | E-money issuance + account issuance licence; non-bank PayNow/FAST access requires MPI [Certain] |

Thresholds: SPI caps S$3m/month (one service) / S$6m (two+); above → MPI. PS-G01 (rev. Oct 2025) now expects a **legal opinion mapping the business model to the PSA** at application — budget for it. [Certain]

## AML/CFT

[Certain] MAS Notice PSN01 binds **licensees**; the licensed partner performs KYC/screening on remittances. ALLY's duties today are PDPA-grade data protection (already engineered: RLS, consent, export/delete) — not AML. This flips the moment ALLY is licensed.

## Corridor economics (for the revenue slide)

- [Certain] SG→ID: 3.23% average total cost, ~0.98% average FX margin; cheapest surveyed ~0.61% all-in (World Bank Remittance Prices, Q3-2025).
- [Likely] SG→PH: ~2.3–2.6% average total (Q1-2025).
- Verdict on the "0.5–1% FX margin" line: **defensible as a partner-share revenue assumption**, but Wise's ~0.6% all-in caps pricing headroom — present it as "share of partner economics," not ALLY's own spread.

## Implemented guardrails (code, today)

`supabase/migrations/0003_payments_demo.sql` stores **records and statuses only** — no balances, no custody fields exist in the schema. `lib/wallet.ts` generates references; comments carry the posture. `WalletTab` shows the no-custody strip and bank-app instructions. The remitter CTA is a non-functional referral stub by design.
