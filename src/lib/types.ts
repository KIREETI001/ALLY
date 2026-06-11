// Shared TypeScript types for ALLY.

export type LangCode = 'en' | 'zh' | 'ms' | 'ta' | 'ph';

export type CaregiverRole =
  | 'daughter' | 'son' | 'spouse' | 'sibling' | 'grandchild' | 'FDW' | 'other';

export type CareType = 'post-discharge' | 'chronic' | 'paediatric' | 'distance';

export type TeamRole = 'primary' | 'secondary' | 'fdw' | 'observer';

export type TaskType = 'Medication' | 'Wound Care' | 'Physio' | 'Monitoring' | 'Meals' | 'Other';

export interface Profile {
  id: string;          // matches auth.users.id
  email: string;
  full_name: string | null;
  role: CaregiverRole | null;
  language: LangCode;
  fdw_mode: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  owner_id: string;
  name: string;
  age: number | null;
  conditions: string[];
  created_at: string;
}

export interface CarePlan {
  id: string;
  patient_id: string;
  owner_id: string;
  diagnosis: string | null;
  diet: string | null;
  warnings: string[];
  medications: { name: string; timing: string; notes?: string }[];
  raw_discharge_text: string | null;
  activated_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;                 // UUID in DB; number in legacy demo data
  care_plan_id: string;
  title: string;
  type: TaskType;
  scheduled_time: string;     // text like "8:00 AM"
  done: boolean;
  assigned_to: string | null; // user_id of team member
  urgent: boolean;
  notes: string;
  steps: string[];
  created_at: string;
  done_at?: string | null;
}

export interface CareTeamMember {
  id: string;
  care_plan_id: string;
  user_id: string;
  role: TeamRole;
  display_initials: string;
  display_color: string;
  joined_at: string;
}

export interface CareTeamInvite {
  id: string;
  care_plan_id: string;
  email: string;
  role: TeamRole;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  recorded_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API contract for /api/parse-discharge (v2).
//
// SaMD boundary (HSA GL-07-R2, Jul 2025): the parser TRANSCRIBES AND ORGANISES
// what the discharge document already says. It never generates new clinical
// recommendations, dosages, or schedules beyond the document. Every extracted
// item carries provenance (`source_quote`) back to the original text and a
// confidence flag surfaced in the human-confirmation step.
export type ParseConfidence = 'high' | 'low';

export interface ParsedMedication {
  name: string;
  timing: string;          // as written in the document
  notes?: string;
  source_quote: string;    // verbatim snippet from the document this was extracted from
  confidence: ParseConfidence;
}

export interface ParsedTask {
  title: string;
  type: TaskType;
  time: string;            // as written or clearly implied by the document
  notes?: string;
  urgent: boolean;
  source_quote: string;
  confidence: ParseConfidence;
}

export interface ParsedWarning {
  text: string;
  source_quote: string;
  confidence: ParseConfidence;
}

export interface ParsedDischarge {
  diagnosis: string;
  diet: string;
  warnings: ParsedWarning[];
  medications: ParsedMedication[];
  tasks: ParsedTask[];
  /** Items the model could not confidently read — shown to the user for manual entry. */
  unreadable_sections?: string[];
}

// ── Family Care Wallet (payments demo layer) ────────────────────────────────
// PSA posture: records + payment INSTRUCTIONS only. ALLY never holds money.
// See docs/compliance/PSA-READINESS.md.

export type ExpenseCategory = 'Clinic' | 'Pharmacy' | 'Equipment' | 'Groceries' | 'Transport' | 'Helper' | 'Other';
export type SplitStatus = 'pending' | 'settled';
export type PayrollStatus = 'scheduled' | 'initiated' | 'confirmed';
export type RemitCorridor = 'PH' | 'ID' | 'MM' | 'IN' | 'LK' | 'BD' | 'NONE';

export interface Expense {
  id: string;
  care_plan_id: string;
  created_by: string;
  merchant: string;
  category: ExpenseCategory;
  amount_cents: number;
  currency: string;
  expense_date: string;       // YYYY-MM-DD
  source: 'receipt_snap' | 'manual';
  receipt_quote: string;
  notes: string;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_label: string;
  member_user_id: string | null;
  share_cents: number;
  status: SplitStatus;
  settle_method: 'paynow' | 'cash' | 'other' | null;
  paynow_ref: string | null;
  settled_at: string | null;
  created_at: string;
}

export interface HelperPayroll {
  id: string;
  care_plan_id: string;
  created_by: string;
  helper_name: string;
  helper_phone: string;
  salary_cents: number;
  currency: string;
  payday_dom: number;         // 1–28
  remit_corridor: RemitCorridor;
  remit_share_cents: number;
  created_at: string;
}

export interface PayrollRun {
  id: string;
  payroll_id: string;
  period_label: string;       // '2026-06'
  amount_cents: number;
  status: PayrollStatus;
  paynow_ref: string | null;
  idempotency_key: string;
  initiated_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

// API contract for /api/parse-receipt (transcribe-only, like the discharge parser).
export interface ParsedReceipt {
  merchant: string;
  expense_date: string;       // as written; empty if absent
  total_cents: number;
  currency: string;
  category: ExpenseCategory;
  line_items: { description: string; amount_cents: number }[];
  source_quote: string;       // verbatim total line from the receipt
  confidence: ParseConfidence;
}

// Legacy demo task shape used by DEFAULT_TASKS — kept for backward compatibility
// during the refactor. Will be removed once all callers consume DB-backed tasks.
export interface LegacyTask {
  id: number;
  title: string;
  type: string;
  time: string;
  done: boolean;
  who: string;
  urgent: boolean;
  notes: string;
  steps: string[];
}
