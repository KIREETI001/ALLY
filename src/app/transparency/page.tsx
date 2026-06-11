'use client';

// /transparency — plain-language walkthrough of how ALLY processes medical
// data, mirrored from docs/compliance/MEDICAL-DATA-PIPELINE.md. If this page
// and the code ever disagree, that is a release-blocking bug: transparency
// pages are promises.

import { useRouter } from 'next/navigation';
import { ChevronLeft, Eye, FileSearch, Lock, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { C } from '@/lib/theme';
import PhoneFrame from '@/components/PhoneFrame';

const STEPS: { Icon: typeof Eye; title: string; body: string }[] = [
  {
    Icon: FileSearch,
    title: '1 · You share a document — we record your consent',
    body: 'When you photograph or paste a discharge summary, ALLY records that you asked us to process it (date, purpose). Photos are shrunk on YOUR phone before upload — extra detail and photo metadata never leave your device.',
  },
  {
    Icon: Eye,
    title: '2 · The AI transcribes — it is forbidden to invent',
    body: 'Our AI reads the document and copies out what the hospital wrote: diagnosis, medications, warning signs, follow-ups. It is contractually instructed to never add dosages, never create schedules the document doesn’t contain, and never give medical advice. Every extracted item keeps a quote of the exact words it came from, so you can check it yourself.',
  },
  {
    Icon: ShieldCheck,
    title: '3 · A second, non-AI check',
    body: 'Before anything reaches your screen, our software re-validates the AI’s output: unknown fields are dropped, anything outside the allowed format is rejected, and items the AI was unsure about are flagged with a warning triangle instead of being silently guessed.',
  },
  {
    Icon: UserCheck,
    title: '4 · Nothing activates until a human confirms',
    body: 'You review every medication, task and warning — with the original wording beside it — and only your tap on “Activate” creates the care plan. ALLY never acts on a document by itself.',
  },
  {
    Icon: Lock,
    title: '5 · Stored encrypted, visible only to your care team',
    body: 'Care data lives encrypted in our Singapore-region database. Row-level security means each row is readable only by you and people you invited. Your helper sees tasks — not the raw medical document. We never use your data to train AI models.',
  },
  {
    Icon: Trash2,
    title: '6 · You can take it all back',
    body: 'Settings let you download everything we hold about you, delete the original document text while keeping your care plan, or erase your care data entirely. Deletion is honoured immediately.',
  },
];

export default function TransparencyPage() {
  const router = useRouter();
  return (
    <PhoneFrame>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: C.bg }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
          <div onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer', fontSize: 14, opacity: 0.85 }}>
            <ChevronLeft size={16} /> Back
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>How ALLY handles medical data</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            Every step between your photo and your care plan — and what never happens
          </div>
        </div>

        <div style={{ padding: 16, paddingBottom: 40 }}>
          {STEPS.map(({ Icon, title, body }) => (
            <div key={title} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.pale, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={C.pri} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{title}</div>
              </div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}

          <div style={{ background: C.warnBg, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#92400E', marginBottom: 6 }}>What ALLY never does</div>
            <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.65 }}>
              No diagnosis. No dose recommendations. No changing what your doctor prescribed.
              No selling or sharing your data. No training AI on your documents. No access to
              the National Electronic Health Record. If you describe an emergency, ALLY tells
              you to call 995 — it does not attempt to manage it.
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 6 }}>The rules we operate under</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.65 }}>
              Singapore PDPA (health data is treated as sensitive, with strict breach-notification duties) ·
              HSA software guidelines — ALLY stays a non-medical-device by only organising what clinicians
              already wrote · MOH AI in Healthcare Guidelines (AIHGle 2.0, 2026) for transparency and
              human oversight. Processing partners: our AI provider (Anthropic) and database host (Supabase),
              both under data-processing agreements; neither uses your data for advertising or model training.
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 10 }}>
              Questions or a data request? Email the team from your Profile tab — we answer
              within 3 working days. Full engineering documentation: docs/compliance/MEDICAL-DATA-PIPELINE.md.
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
