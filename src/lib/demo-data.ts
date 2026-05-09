// Static reference data used across ALLY: languages, demo discharge,
// default tasks (used as seed when no real data yet), team mock,
// subsidies database, and resource catalogue.

import { C } from './theme';
import type { LegacyTask, ParsedDischarge } from './types';

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

export const DEMO_PARSED: ParsedDischarge = {
  diagnosis: 'Left Total Knee Replacement + T2DM + Hypertension',
  diet: 'Diabetic, low-sodium <1500mg/day, soft food for 2 weeks',
  warnings: [
    'Wound: redness, discharge → A&E',
    'Sudden calf pain → A&E',
    'Glucose <4.0 or >15.0 → call doctor',
    'BP >180 → call doctor',
  ],
  medications: [
    { name: 'Metformin 500mg',   timing: 'Morning & Evening',  notes: 'With meals' },
    { name: 'Amlodipine 5mg',    timing: 'Morning',            notes: 'Blood pressure' },
    { name: 'Celecoxib 200mg',   timing: 'Morning & Evening',  notes: 'Pain — 7 days only' },
    { name: 'Pantoprazole 40mg', timing: 'Before breakfast',   notes: 'Stomach protection' },
  ],
  tasks: [
    { title: 'Metformin 500mg',          type: 'Medication',  time: '8:00 AM',  urgent: false },
    { title: 'Physiotherapy exercises',  type: 'Physio',      time: '10:00 AM', urgent: false },
    { title: 'BP check',                 type: 'Monitoring',  time: '12:00 PM', urgent: false },
    { title: 'Change wound dressing',    type: 'Wound Care',  time: '3:00 PM',  urgent: true  },
    { title: 'Amlodipine 5mg',           type: 'Medication',  time: '8:00 PM',  urgent: false },
  ],
};

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

export const SUBSIDIES = [
  { name: 'Home Caregiving Grant',     amt: 'S$600/month',         status: 'Eligible', desc: 'Monthly cash for caregivers of frail seniors. Enhanced from 1 April 2026.', col: C.ok   },
  { name: 'CHAS Blue Card',            amt: 'Up to S$360/year',    status: 'Active',   desc: 'Subsidised outpatient care at GPs and dental clinics.',                       col: C.pri  },
  { name: 'Pioneer Generation',        amt: 'Up to S$9,000/year',  status: 'Eligible', desc: 'MediShield Life subsidies, Medisave top-ups, outpatient subsidies.',          col: C.warn },
  { name: 'Senior Mobility Fund',      amt: 'Up to S$2,800',       status: 'Check',    desc: 'Wheelchair, grab bars, shower chair, hospital bed.',                          col: C.pur  },
  { name: 'MediFund Silver',           amt: 'Means-tested',        status: 'Check',    desc: 'Safety net for MediShield co-payments and hospitalisation costs.',            col: C.err  },
  { name: 'Caregiving Training Grant', amt: 'S$200 one-time',      status: 'Eligible', desc: 'AIC-approved caregiver training reimbursement.',                              col: C.ok   },
];

export const RESOURCES = [
  { id: 1, title: 'How to Change a Wound Dressing',     cat: 'Wound Care',    type: 'video',   langs: ['en', 'zh', 'ms', 'ph'],         verified: true  },
  { id: 2, title: 'Managing Multiple Medications',      cat: 'Medication',    type: 'video',   langs: ['en', 'zh', 'ms', 'ta', 'ph'],   verified: true  },
  { id: 3, title: 'Post-Surgery Leg Exercises',         cat: 'Exercises',     type: 'video',   langs: ['en', 'zh'],                     verified: true  },
  { id: 4, title: 'Low-Sodium Hawker Food Guide',       cat: 'Nutrition',     type: 'article', langs: ['en', 'zh', 'ms'],               verified: true  },
  { id: 5, title: 'Coping with Caregiver Burnout',      cat: 'Mental Health', type: 'article', langs: ['en', 'zh', 'ms', 'ta', 'ph'],   verified: false },
  { id: 6, title: 'Home Caregiving Grant Guide',        cat: 'Schemes',       type: 'guide',   langs: ['en', 'zh', 'ms', 'ta'],         verified: true  },
  { id: 7, title: 'Checking Blood Pressure at Home',    cat: 'Monitoring',    type: 'video',   langs: ['en', 'zh', 'ms', 'ta', 'ph'],   verified: true  },
  { id: 8, title: 'Managing Diabetes at Home',          cat: 'Medication',    type: 'guide',   langs: ['en', 'zh'],                     verified: true  },
];

export const RESOURCE_CATS = ['All', 'Wound Care', 'Medication', 'Exercises', 'Nutrition', 'Mental Health', 'Schemes', 'Monitoring'] as const;

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
