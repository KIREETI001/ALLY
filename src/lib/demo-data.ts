// Static reference data used across ALLY: languages, demo discharge,
// default tasks (used as seed when no real data yet), team mock,
// and resource catalogue.

import { C } from './theme';
import type { LegacyTask } from './types';

export const LANGS = [
  { code: 'en' as const, name: 'English',  native: 'English',         flag: '🇸🇬' },
  { code: 'zh' as const, name: 'Mandarin', native: '中文',             flag: '🇨🇳' },
  { code: 'ms' as const, name: 'Malay',    native: 'Bahasa Melayu',   flag: '🇲🇾' },
  { code: 'ta' as const, name: 'Tamil',    native: 'தமிழ்',           flag: '🇮🇳' },
  { code: 'ph' as const, name: 'Filipino', native: 'Filipino',        flag: '🇵🇭' },
];

export const SAMPLE_DISCHARGE = `SINGAPORE GENERAL HOSPITAL — DISCHARGE SUMMARY
Patient: Lee Ah Kow | MRN: S1234567A | DOB: 12/03/1953
Discharge: 22/04/2026

DIAGNOSIS: Left Total Knee Replacement + T2DM + Hypertension

MEDICATIONS:
1. Metformin 500mg — Twice daily with meals
2. Amlodipine 5mg — Once daily morning
3. Celecoxib 200mg — Twice daily for pain (7 days)
4. Pantoprazole 40mg — Once daily before breakfast

WOUND CARE: Dressing change every 2 days with sterile saline + Mepore. Keep dry.

DIET: Diabetic, low-sodium <1500mg/day, soft food for 2 weeks

MONITORING: BP daily target <130/80; Glucose twice daily

WARNING SIGNS — A&E IMMEDIATELY:
- Wound redness, discharge, opening
- Sudden calf pain or swelling
- Glucose <4.0 or >15.0 mmol/L
- BP systolic >180

FOLLOW-UP:
1. SGH Orthopaedic Clinic — 2 weeks
2. Queenstown Polyclinic — 1 week
3. SGH Physiotherapy — 3x/week for 6 weeks`;

// DEMO_PARSED removed in v2: parse failures now surface honest errors instead
// of silently substituting demo data (docs/product/REBUILD-BLUEPRINT.md §3, Seed 18).
// The demo path still works — the sample text above goes through the real parser.

// Demo receipt for the Family Care Wallet (goes through the REAL /api/parse-receipt).
export const SAMPLE_RECEIPT = `GUARDIAN HEALTH & BEAUTY
Blk 123 Toa Payoh Lor 1 #01-456, S310123
GST Reg: M9-0012345-6
Date: 11/06/2026 14:32  Receipt: 88412

1x Omron BP Monitor HEM-7156    $89.00
2x Hansaplast Sterile Gauze     $12.40
1x Glucerna 850g Vanilla        $52.90
1x Accu-Chek Test Strips x50    $38.50

Subtotal                       $192.80
GST 9% (incl)                   $15.92
TOTAL                          $192.80
VISA ****4021                  $192.80

Thank you for shopping with us`;

export const DEFAULT_TASKS: LegacyTask[] = [
  { id: 1, title: 'Metformin 500mg',           type: 'Medication',  time: '8:00 AM',  done: true,  who: 'SC', urgent: false, notes: 'Take with breakfast.',          steps: ['Wash hands', 'Retrieve tablet', 'Give with breakfast', 'Log completion'] },
  { id: 2, title: 'Physiotherapy exercises',   type: 'Physio',      time: '10:00 AM', done: true,  who: 'SC', urgent: false, notes: '3 sets of 10 reps.',             steps: ['Help to seated position', '10 knee extensions', 'Rest 1 min', 'Log completion'] },
  { id: 3, title: 'Amlodipine 5mg',            type: 'Medication',  time: '2:00 PM',  done: false, who: 'SC', urgent: false, notes: 'Check BP first.',                 steps: ['Check BP', 'If >180 hold dose', 'Otherwise administer', 'Log to HealthHub'] },
  { id: 4, title: 'Change wound dressing',     type: 'Wound Care',  time: '3:30 PM',  done: false, who: 'SC', urgent: true,  notes: 'Sterile saline only.',            steps: ['Prepare sterile field', 'Remove old dressing', 'Inspect wound', 'Apply new dressing', 'Photo wound'] },
  { id: 5, title: 'Low-sodium dinner',         type: 'Meals',       time: '6:30 PM',  done: false, who: 'AM', urgent: false, notes: 'Max 1500mg sodium.',              steps: ['Check sodium', 'Prepare soft food', 'No salt', 'Log intake'] },
  { id: 6, title: 'Blood pressure check',      type: 'Monitoring',  time: '7:00 PM',  done: false, who: 'DC', urgent: false, notes: 'Alert if >160/100.',              steps: ['Seat 5 min', 'Apply cuff', '2 readings', 'Log average'] },
];

export const TEAM_MOCK = [
  { id: 'SC', name: 'Sarah Chen',  role: 'Primary',   color: C.pri, tasks: 12, done: 7, online: true  },
  { id: 'DC', name: 'David Chen',  role: 'Secondary', color: C.pur, tasks: 4,  done: 2, online: true  },
  { id: 'AM', name: 'Auntie Mary', role: 'FDW',       color: C.ok,  tasks: 3,  done: 1, online: false },
];

// SUBSIDIES removed in v2: the static list shipped stale figures (single-tier
// HCG, defunct scheme names, wrong CTG amount). Subsidy data now lives in the
// verified, versioned rules engine: src/lib/subsidies.ts (RULES_VERSION).

// Resource Hub v2 — real destinations, not placeholder titles.
// `verified: true` = the URL was checked against the primary source during the
// June 2026 research pass (docs/strategy/STRATEGY.md). Re-verify quarterly.
// `internal` entries route inside the app (e.g. the transparency page).
export interface ResourceItem {
  id: number;
  title: string;
  desc: string;
  cat: string;
  type: 'guide' | 'tool' | 'community' | 'page';
  langs: string[];
  verified: boolean;
  url?: string;       // external, opens in new tab
  internal?: string;  // in-app route
}

export const RESOURCES: ResourceItem[] = [
  // ── Schemes & money ────────────────────────────────────────────────────
  { id: 1, title: 'Home Caregiving Grant (AIC)', desc: 'S$200–600/month by income tier for families caring for a loved one needing help with daily activities. Official eligibility + application.', cat: 'Schemes', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.aic.sg/Financial-Assistance/Home-Caregiving-Grant' },
  { id: 2, title: 'SupportGoWhere — Care Services Recommender', desc: 'Government tool that recommends schemes and services for your situation. Good second opinion to ALLY’s navigator.', cat: 'Schemes', type: 'tool', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://supportgowhere.life.gov.sg/caregiving/support-recommender' },
  { id: 3, title: 'CareShield Life — claims & payouts (CPF)', desc: 'Lifelong monthly payouts when a loved one can no longer manage 3 of 6 daily activities. How to assess and claim.', cat: 'Schemes', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.cpf.gov.sg/member/healthcare-financing/careshield-life' },
  { id: 4, title: 'CHAS subsidies', desc: 'Subsidised GP and dental visits — tier amounts and how to apply for the card.', cat: 'Schemes', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.chas.sg/chas-subsidies' },
  { id: 5, title: 'MDW levy concession (MOM)', desc: 'Pay S$60/month instead of S$300 when caring for a senior 67+ or someone needing daily-activity help.', cat: 'Schemes', type: 'guide', langs: ['en'], verified: true, url: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/foreign-domestic-worker-levy/levy-concession' },

  // ── Training ───────────────────────────────────────────────────────────
  { id: 6, title: 'Caregivers Training Grant courses (AIC)', desc: 'S$400 balance (+S$200/yr) for approved caregiving courses — family members AND helpers can attend.', cat: 'Training', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.aic.sg/Financial-Assistance/Caregivers-Training-Grant' },
  { id: 7, title: 'AIC Caregiving hub', desc: 'The national starting point: respite options, support groups, caregiver support action plan.', cat: 'Training', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.aic.sg/caregiving/' },

  // ── Helper (MDW) support ───────────────────────────────────────────────
  { id: 8, title: 'Centre for Domestic Employees (CDE)', desc: 'Free advice and support for domestic helpers — employment issues, wellbeing, helplines. Share with your helper.', cat: 'MDW Support', type: 'community', langs: ['en', 'ph'], verified: false, url: 'https://www.cde.org.sg' },
  { id: 9, title: 'FAST — Foreign Domestic Worker Association', desc: 'Skills training, social support and a helpline for migrant domestic workers.', cat: 'MDW Support', type: 'community', langs: ['en', 'ph'], verified: false, url: 'https://www.fast.org.sg' },

  // ── Mental health ──────────────────────────────────────────────────────
  { id: 10, title: 'mindline.sg', desc: 'Free, anonymous mental-health self-help and chat support, built by MOH Office for Healthcare Transformation. For the 1-in-4 caregivers running on empty.', cat: 'Mental Health', type: 'tool', langs: ['en'], verified: false, url: 'https://www.mindline.sg' },

  // ── Health library ─────────────────────────────────────────────────────
  { id: 11, title: 'HealthHub — national health library', desc: 'MOH’s verified articles on wound care, medications, diabetes, blood pressure and more. Your discharge summaries from public hospitals also live here.', cat: 'Health Library', type: 'guide', langs: ['en', 'zh', 'ms', 'ta'], verified: true, url: 'https://www.healthhub.sg' },

  // ── Transparency (in-app) ──────────────────────────────────────────────
  { id: 12, title: 'How ALLY handles medical data', desc: 'Plain-language walkthrough of exactly what happens to a discharge document from photo to care plan — and what never happens.', cat: 'Transparency', type: 'page', langs: ['en'], verified: true, internal: '/transparency' },
];

export const RESOURCE_CATS = ['All', 'Schemes', 'Training', 'MDW Support', 'Mental Health', 'Health Library', 'Transparency'] as const;

export const CAREGIVER_ROLES = ['daughter', 'son', 'spouse', 'sibling', 'grandchild', 'FDW', 'other'] as const;

export const CARE_TYPES = [
  { id: 'post-discharge' as const, label: 'Post-discharge',     sub: 'Just left hospital',         icon: '🏥' },
  { id: 'chronic' as const,        label: 'Long-term chronic',  sub: 'Diabetes, dementia, etc.',   icon: '❤️' },
  { id: 'paediatric' as const,     label: 'Paediatric',         sub: 'Caring for a child',         icon: '👶' },
  { id: 'distance' as const,       label: 'Distance caregiver', sub: 'I am overseas or away',      icon: '🌏' },
];

export const QUICK_CHAT_PROMPTS = [
  { e: '🩹', t: 'How do I change a wound dressing?' },
  { e: '💰', t: 'What financial aid is available?' },
  { e: '😮‍💨', t: "I'm burned out and exhausted" },
  { e: '🍜', t: 'What can my dad eat at hawker centre?' },
];
