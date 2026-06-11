// ALLY subsidy rules engine — Singapore module.
//
// DESIGN CONTRACT (docs/strategy/STRATEGY.md §3a):
// 1. Figures are DETERMINISTIC DATA, adversarially verified on primary
//    (.gov.sg / aic.sg) sources on `verified_on`. The LLM never computes
//    entitlements — it only explains the engine's output.
// 2. Every scheme carries `source` + `verified_on` and the UI shows
//    "as of <date> — confirm with AIC" microcopy. Schemes change every Budget;
//    a quarterly review of this file is a release-blocking chore.
// 3. This module is the v1 of the `subsidy_rules` DB table (see
//    supabase/migrations/0002). Code-versioned data is the smallest safe cut
//    until admin tooling exists; the shapes below match the table schema.
// 4. Expansion-ready: this is the SG country pack. MY/HK/TW packs implement
//    the same interface (docs/strategy/STRATEGY.md §5).

export const RULES_VERSION = '2026-06-10';

export interface HouseholdInput {
  /** Per-capita household income, S$/month. undefined = not provided. */
  pchi?: number;
  /** Number of the 6 ADLs the care recipient needs help with (0–6). */
  adlCount?: number;
  /** Care recipient age in years. */
  age?: number;
  /** Care recipient is a Singapore Citizen (vs PR/other). */
  citizen?: boolean;
  /** Household owns more than one property. */
  multiProperty?: boolean;
  /** Household employs (or plans to employ) a migrant domestic worker. */
  hasMdw?: boolean;
}

export type Verdict = 'eligible' | 'likely' | 'check' | 'not_eligible';

export interface SchemeResult {
  id: string;
  name: string;
  amount: string;          // human-readable, computed where tiered
  verdict: Verdict;
  reason: string;
  apply: string;           // where to apply / next step
  source: string;          // primary source URL
  verified_on: string;     // YYYY-MM-DD this figure was last verified
}

const V = RULES_VERSION;

export function computeEntitlements(h: HouseholdInput): SchemeResult[] {
  const results: SchemeResult[] = [];
  const adl3 = h.adlCount !== undefined ? h.adlCount >= 3 : undefined;
  const adl1 = h.adlCount !== undefined ? h.adlCount >= 1 : undefined;

  // ── Home Caregiving Grant (tiered, effective Apr 2026) ──────────────────
  {
    let amount = 'S$200–600/month';
    let verdict: Verdict = 'check';
    let reason = 'Tiered by per-capita household income; care recipient must permanently need help with ≥3 of 6 ADLs.';
    if (adl3 === false) {
      verdict = 'not_eligible';
      reason = 'Requires permanent assistance with at least 3 of the 6 Activities of Daily Living.';
    } else if (h.pchi !== undefined) {
      if (h.multiProperty) {
        amount = 'S$200/month';
        verdict = adl3 ? 'eligible' : 'likely';
        reason = 'Households with more than one property receive the S$200 tier regardless of income.';
      } else if (h.pchi <= 1500) {
        amount = 'S$600/month';
        verdict = adl3 ? 'eligible' : 'likely';
        reason = 'PCHI ≤ S$1,500 (or no income with Annual Value ≤ S$21,000) qualifies for the highest tier.';
      } else if (h.pchi <= 3600) {
        amount = 'S$400/month';
        verdict = adl3 ? 'eligible' : 'likely';
        reason = 'PCHI S$1,501–3,600 qualifies for the middle tier.';
      } else if (h.pchi <= 4800) {
        amount = 'S$200/month';
        verdict = adl3 ? 'eligible' : 'likely';
        reason = 'PCHI S$3,601–4,800 qualifies for the base tier.';
      } else {
        verdict = 'not_eligible';
        reason = 'PCHI above S$4,800 exceeds the qualifying threshold.';
      }
    }
    results.push({
      id: 'hcg', name: 'Home Caregiving Grant', amount, verdict, reason,
      apply: 'Apply via AIC (aic.sg) with a functional assessment report.',
      source: 'https://www.aic.sg/Financial-Assistance/Home-Caregiving-Grant', verified_on: V,
    });
  }

  // ── Caregivers Training Grant ────────────────────────────────────────────
  results.push({
    id: 'ctg', name: 'Caregivers Training Grant', amount: 'S$400 balance (+S$200 top-up each April, capped at S$400)',
    verdict: 'likely',
    reason: 'Available per care recipient for AIC-approved courses; family members and migrant domestic workers can attend.',
    apply: 'Book an approved course via AIC; subsidy applied at registration.',
    source: 'https://www.aic.sg/Financial-Assistance/Caregivers-Training-Grant', verified_on: V,
  });

  // ── MDW Levy Concession ──────────────────────────────────────────────────
  if (h.hasMdw !== false) {
    let verdict: Verdict = 'check';
    let reason = 'Concessionary S$60/month levy (vs S$300 standard) if a household member is a senior aged 67+, a child under 16, or needs help with ≥1 ADL.';
    if ((h.age !== undefined && h.age >= 67) || adl1) {
      verdict = 'eligible';
      reason = (h.age !== undefined && h.age >= 67)
        ? 'Care recipient is 67 or older — household qualifies for the concessionary levy.'
        : 'Care recipient needs help with at least 1 ADL — household qualifies for the concessionary levy.';
    }
    results.push({
      id: 'mdw_levy', name: 'Migrant Domestic Worker Levy Concession', amount: 'S$60/month levy (saves S$240/month)',
      verdict, reason,
      apply: 'Usually auto-applied; otherwise apply via MOM.',
      source: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/foreign-domestic-worker-levy/levy-concession', verified_on: V,
    });
  }

  // ── CareShield Life / ElderShield ────────────────────────────────────────
  results.push({
    id: 'careshield', name: 'CareShield Life claim', amount: 'S$689/month for claims made in 2026 (amount depends on claim year)',
    verdict: adl3 === undefined ? 'check' : adl3 ? 'likely' : 'not_eligible',
    reason: adl3
      ? 'Severe disability (unable to perform ≥3 of 6 ADLs) is the claim trigger; payouts continue while severely disabled.'
      : adl3 === false
        ? 'Claim requires inability to perform at least 3 of the 6 ADLs.'
        : 'Claimable if the care recipient cannot perform ≥3 of 6 ADLs (assessment required; first assessment free).',
    apply: 'Claim via CPF Board with a MOH-accredited severe-disability assessment.',
    source: 'https://www.cpf.gov.sg/member/healthcare-financing/careshield-life', verified_on: V,
  });

  // ── Seniors' Mobility & Enabling Fund ────────────────────────────────────
  {
    let verdict: Verdict = 'check';
    let amount = 'Up to 90% off assistive devices';
    let reason = 'Subsidises wheelchairs, hospital beds, hearing aids and more; tiered by PCHI (90% if ≤S$1,200; 75% if S$1,201–2,000), PCHI cap S$4,800.';
    if (h.pchi !== undefined) {
      if (h.pchi <= 1200) { verdict = 'eligible'; amount = '90% off assistive devices'; }
      else if (h.pchi <= 2000) { verdict = 'eligible'; amount = '75% off assistive devices'; }
      else if (h.pchi <= 4800) { verdict = 'likely'; amount = 'Partial device subsidy'; reason = 'PCHI within the S$4,800 cap; exact tier assessed by AIC.'; }
      else { verdict = 'not_eligible'; reason = 'PCHI above the S$4,800 cap.'; }
    }
    results.push({
      id: 'smf', name: "Seniors' Mobility & Enabling Fund", amount, verdict, reason,
      apply: 'Apply through the care professional/provider recommending the device.',
      source: 'https://www.aic.sg/Financial-Assistance/Seniors-Mobility-and-Enabling-Fund---Mobility-and-Assistive-Devices', verified_on: V,
    });
  }

  // ── ElderFund ────────────────────────────────────────────────────────────
  results.push({
    id: 'elderfund', name: 'ElderFund', amount: 'Up to S$250/month',
    verdict: 'check',
    reason: 'For severely disabled, lower-income Singapore Citizens aged 30+ with low MediSave balances and no other coverage.',
    apply: 'Apply via AIC.',
    source: 'https://www.aic.sg/financial-assistance/elderfund', verified_on: V,
  });

  // ── CHAS ─────────────────────────────────────────────────────────────────
  {
    let amount = 'Tiered GP/dental subsidies';
    let verdict: Verdict = 'check';
    const reason = 'CHAS Blue/Orange/Green tiers by household income; Merdeka & Pioneer Generation seniors get extra per-visit subsidies.';
    if (h.pchi !== undefined) {
      if (h.pchi <= 1500) { amount = 'CHAS Blue — up to S$125/visit (complex chronic), capped yearly'; verdict = 'likely'; }
      else if (h.pchi <= 2300) { amount = 'CHAS Orange — up to S$80/visit (complex chronic), capped yearly'; verdict = 'likely'; }
      else { amount = 'CHAS Green — up to S$40/visit (complex chronic), capped yearly'; verdict = 'likely'; }
    }
    results.push({
      id: 'chas', name: 'CHAS', amount, verdict, reason,
      apply: 'Apply at chas.sg; card is means-tested per household.',
      source: 'https://www.chas.sg/chas-subsidies', verified_on: V,
    });
  }

  // ── Non-residential Long-Term Care subsidies (enhanced Jul 2026) ─────────
  results.push({
    id: 'ltc', name: 'Home & Community Care Subsidies', amount: 'Up to 95% off services from July 2026',
    verdict: h.pchi !== undefined ? (h.pchi <= 4800 ? 'likely' : 'check') : 'check',
    reason: 'From July 2026: income threshold raised to PCHI S$4,800, subsidies up 10 percentage points, plus cohort top-ups for those born 1969 or earlier.',
    apply: 'Means-testing via the care provider / AIC referral.',
    source: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidy-framework-for-non-residential-long-term-care-services/', verified_on: V,
  });

  // ── MediFund (deliberately no amount — discretionary) ────────────────────
  results.push({
    id: 'medifund', name: 'MediFund / MediFund Silver', amount: 'Discretionary — assessed case by case',
    verdict: 'check',
    reason: 'Safety net for those who cannot afford remaining bills after subsidies, MediShield Life and MediSave. No fixed quantum exists — beware any app that shows one.',
    apply: 'Ask the medical social worker at the treating public institution.',
    source: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medifund/', verified_on: V,
  });

  return results;
}

/** Compact, language-agnostic summary used to ground the AI chat (the LLM
 *  explains these results; it never recalculates them). */
export function entitlementSummary(results: SchemeResult[]): string {
  return results
    .map((r) => `${r.name}: ${r.amount} — ${r.verdict.toUpperCase()} (${r.reason})`)
    .join('\n');
}

/** Static one-line facts for chat grounding when no wizard inputs exist yet. */
export function schemeFactSheet(): string {
  return [
    `Verified ${RULES_VERSION} on primary sources. Figures change every Budget — always confirm with AIC.`,
    'Home Caregiving Grant: S$600/S$400/S$200 per month by income tier (PCHI ≤1,500 / ≤3,600 / ≤4,800); needs ≥3 of 6 ADLs.',
    'Caregivers Training Grant: S$400 balance, +S$200 top-up each April (cap S$400); MDWs can attend.',
    'MDW levy concession: S$60/month (vs S$300) for senior 67+/child<16/≥1 ADL households.',
    'CareShield Life: S$689/month for 2026 claims while unable to do ≥3 of 6 ADLs.',
    "Seniors' Mobility & Enabling Fund: up to 90% off assistive devices (income-tiered).",
    'ElderFund: up to S$250/month for severely disabled lower-income citizens 30+.',
    'Home & community care subsidies: up to 95% from July 2026 (threshold PCHI S$4,800).',
    'MediFund: discretionary safety net, no fixed amount.',
    'The old FDW Grant no longer exists (merged into the Home Caregiving Grant in 2019).',
  ].join('\n');
}
