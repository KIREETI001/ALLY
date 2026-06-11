// Family Care Wallet helpers — pure functions, integer cents everywhere.
//
// PSA posture (docs/compliance/PSA-READINESS.md): these helpers generate
// payment INSTRUCTIONS (references, amounts, splits). Money moves only in
// each member's own banking app. ALLY never holds funds.

export interface SplitShare {
  member_label: string;
  member_user_id: string | null;
  share_cents: number;
}

/** Equal split with deterministic remainder distribution (first members get
 *  the extra cents — totals always reconcile exactly). */
export function equalSplit(
  totalCents: number,
  members: { label: string; userId?: string | null }[],
): SplitShare[] {
  if (members.length === 0 || totalCents <= 0) return [];
  const base = Math.floor(totalCents / members.length);
  let remainder = totalCents - base * members.length;
  return members.map((m) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { member_label: m.label, member_user_id: m.userId ?? null, share_cents: base + extra };
  });
}

/** Human-readable SGD amount from cents. */
export function fmtSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}

/** Short payment reference for PayNow transfers made in the user's own bank
 *  app. Reference only — not a transaction, not a payment rail. */
export function payNowRef(prefix: 'SAL' | 'SPL', seed: string): string {
  const tail = seed.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ALLY-${prefix}-${tail}`;
}

/** Current period label, e.g. '2026-06'. */
export function periodLabel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Next payday date for a 1–28 day-of-month, relative to now. */
export function nextPayday(paydayDom: number, now: Date): Date {
  const candidate = new Date(now.getFullYear(), now.getMonth(), paydayDom);
  if (candidate.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    return candidate;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, paydayDom);
}

/** HCG tier amounts (verified 2026-06-10 — see lib/subsidies.ts). Used for the
 *  "subsidy covers X% of helper salary" wallet line. */
export const HCG_TIERS_CENTS = [60000, 40000, 20000, 0] as const;

export function hcgCoverage(salaryCents: number, hcgCents: number): number {
  if (salaryCents <= 0) return 0;
  return Math.min(100, Math.round((hcgCents / salaryCents) * 100));
}

export const CORRIDOR_LABEL: Record<string, string> = {
  PH: 'Philippines', ID: 'Indonesia', MM: 'Myanmar', IN: 'India', LK: 'Sri Lanka', BD: 'Bangladesh', NONE: '—',
};
