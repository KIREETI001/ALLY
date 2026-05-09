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

// API contract for /api/parse-discharge
export interface ParsedDischarge {
  diagnosis: string;
  diet: string;
  warnings: string[];
  medications: { name: string; timing: string; notes?: string }[];
  tasks: { title: string; type: TaskType; time: string; notes?: string; urgent: boolean }[];
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
