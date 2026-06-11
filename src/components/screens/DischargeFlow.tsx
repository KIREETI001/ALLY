'use client';

// DischargeFlow v2: upload (photo/PDF/text) → parsing → review/activate.
//
// Changes from v1 (see docs/product/REBUILD-BLUEPRINT.md):
// - Photo/PDF upload with client-side image downscaling (cost + reliability).
// - The silent DEMO_PARSED fallback is GONE. Failures show an honest error —
//   graceful degradation over fake success (domain-wisdom Seed 18).
// - Review step surfaces per-item provenance (source_quote) and low-confidence
//   flags: the parse-failure UX is where trust is won (council verdict).

import { useRef, useState } from 'react';
import { AlertTriangle, Camera, ChevronLeft, FileText, Heart, Play, Shield } from 'lucide-react';
import { C, typeStyle } from '@/lib/theme';
import { SAMPLE_DISCHARGE } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase/client';
import { fileToUpload, type Upload } from '@/lib/upload';
import Pill from '@/components/Pill';
import type { ParsedDischarge, Patient, CarePlan } from '@/lib/types';

interface Props {
  patient: Patient;
  onComplete: (carePlan: CarePlan) => void;
  onBack: () => void;
  onSkip: () => void;
}

type Step = 'upload' | 'parsing' | 'confirm';

export default function DischargeFlow({ patient, onComplete, onBack, onSkip }: Props) {
  const supabase = createClient();
  const { user, refreshProfile } = useApp();
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [text, setText] = useState('');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [parsed, setParsed] = useState<ParsedDischarge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const canParse = !!text.trim() || !!upload;

  const onPickFile = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    try {
      setUpload(await fileToUpload(f));
    } catch {
      setError('Could not read that file. Try a JPG/PNG photo or a PDF.');
    }
  };

  const parse = async () => {
    if (!canParse) return;
    setError(null);
    setStep('parsing');
    try {
      const r = await fetch('/api/parse-discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          upload
            ? { fileBase64: upload.base64, fileMediaType: upload.mediaType }
            : { text },
        ),
      });
      const d = await r.json();
      if (!r.ok || !d.parsed) {
        // Honest failure. No demo-data substitution — ever.
        setError(d.error || 'Parsing failed. Please try again.');
        setStep('upload');
        return;
      }
      setParsed(d.parsed as ParsedDischarge);
      setStep('confirm');
    } catch {
      setError('Connection issue — your document was not saved. Please try again.');
      setStep('upload');
    }
  };

  const activate = async () => {
    if (!parsed || !user) return;
    setActivating(true);
    try {
      const { data: plan, error: pErr } = await supabase
        .from('care_plans')
        .insert({
          patient_id: patient.id,
          owner_id: user.id,
          diagnosis: parsed.diagnosis,
          diet: parsed.diet,
          warnings: (parsed.warnings ?? []).map((w) => w.text),
          medications: parsed.medications ?? [], // jsonb keeps provenance fields
          raw_discharge_text: upload ? `[uploaded ${upload.name}]` : text,
          activated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (pErr || !plan) {
        setError(pErr?.message || 'Could not create care plan.');
        setActivating(false);
        return;
      }

      const taskRows = (parsed.tasks ?? []).map((task) => ({
        care_plan_id: plan.id,
        title: task.title,
        type: task.type,
        scheduled_time: task.time,
        urgent: task.urgent,
        notes: task.notes ?? '',
        source_quote: task.source_quote ?? '',
        steps: [],
        done: false,
      }));
      if (taskRows.length > 0) {
        const { error: tErr } = await supabase.from('tasks').insert(taskRows);
        if (tErr) {
          // Fallback for environments missing the v2 column (migration 0002).
          const legacyRows = taskRows.map((row) => {
            const copy: Record<string, unknown> = { ...row };
            delete copy.source_quote;
            return copy;
          });
          await supabase.from('tasks').insert(legacyRows);
        }
      }

      const initials =
        ((user.email || '?').slice(0, 1).toUpperCase()) +
        ((user.email || '??').split('@')[0].slice(1, 2).toUpperCase());
      await supabase.from('care_team').insert({
        care_plan_id: plan.id,
        user_id: user.id,
        role: 'primary',
        display_initials: initials,
        display_color: C.pri,
      });

      await refreshProfile();
      onComplete(plan as CarePlan);
    } finally {
      setActivating(false);
    }
  };

  if (step === 'parsing') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: `linear-gradient(135deg,${C.dark},${C.pri})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Heart size={36} color="white" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center' }}>{t('parsing.title')}</div>
        <div style={{ fontSize: 14, color: C.sub, textAlign: 'center' }}>{t('parsing.subtitle')}</div>
      </div>
    );
  }

  if (step === 'confirm' && parsed) {
    const lowConfidence = [
      ...parsed.medications.filter((m) => m.confidence === 'low'),
      ...parsed.tasks.filter((task) => task.confidence === 'low'),
      ...parsed.warnings.filter((w) => w.confidence === 'low'),
    ].length;

    return (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t('confirm.title')}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{t('confirm.subtitle')}</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>}

          {(lowConfidence > 0 || (parsed.unreadable_sections?.length ?? 0) > 0) && (
            <div style={{ background: C.warnBg, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                <AlertTriangle size={15} /> Please double-check the flagged items
              </div>
              <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5, marginTop: 4 }}>
                {lowConfidence > 0 && `${lowConfidence} item${lowConfidence > 1 ? 's were' : ' was'} hard to read — compare against the original document. `}
                {(parsed.unreadable_sections?.length ?? 0) > 0 && `Could not read: ${parsed.unreadable_sections!.join('; ')}.`}
              </div>
            </div>
          )}

          {parsed.diagnosis && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>{t('confirm.diagnosis')}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 4 }}>{parsed.diagnosis}</div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t('confirm.medications')}</div>
          {parsed.medications?.map((m, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 10, padding: '10px 14px', marginBottom: 8, borderLeft: m.confidence === 'low' ? `3px solid ${C.warn}` : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</div>
                {m.confidence === 'low' && <AlertTriangle size={13} color={C.warn} />}
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>{m.timing}{m.notes ? ` · ${m.notes}` : ''}</div>
              {m.source_quote && (
                <div style={{ fontSize: 11, color: C.sub, fontStyle: 'italic', marginTop: 4, opacity: 0.8 }}>
                  “{m.source_quote.slice(0, 120)}{m.source_quote.length > 120 ? '…' : ''}”
                </div>
              )}
            </div>
          ))}

          {parsed.warnings?.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '12px 0 8px' }}>Warning signs (from the document)</div>
              {parsed.warnings.map((w, i) => (
                <div key={i} style={{ background: C.errBg, borderRadius: 10, padding: '8px 12px', marginBottom: 6, fontSize: 12.5, color: '#991B1B', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <AlertTriangle size={13} /> {w.text}
                </div>
              ))}
            </>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, marginTop: 12 }}>{t('confirm.tasks')}</div>
          {parsed.tasks?.map((task, i) => {
            const ts = typeStyle(task.type);
            return (
              <div key={i} style={{ background: C.card, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center', borderLeft: task.confidence === 'low' ? `3px solid ${C.warn}` : undefined }}>
                <Shield size={16} color={ts.tc} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {task.title}
                    {task.confidence === 'low' && <AlertTriangle size={12} color={C.warn} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, display: 'flex', gap: 5, marginTop: 2 }}>
                    <span>{task.time}</span>
                    <Pill label={task.type} bg={ts.bg} tc={ts.tc} sm />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '0 16px 28px' }}>
          <button type="button" onClick={activate} disabled={activating}
            style={{ width: '100%', background: activating ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', padding: '15px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: activating ? 'wait' : 'pointer', border: 'none' }}>
            {activating ? 'Activating…' : t('confirm.activate')}
          </button>
          <div onClick={() => { setStep('upload'); setParsed(null); }} style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: C.sub, cursor: 'pointer' }}>
            Something looks wrong — go back
          </div>
        </div>
      </div>
    );
  }

  // upload
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer', fontSize: 14, opacity: 0.85 }}>
          <ChevronLeft size={16} /> {t('common.back')}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{t('discharge.title')}</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Photograph the hospital papers — get a care plan your whole care team can follow</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 16, overflowY: 'auto' }}>
        {error && (
          <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {/* Photo / PDF upload — the primary path */}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
        <div
          onClick={() => fileInput.current?.click()}
          style={{ background: upload ? C.okBg : C.card, borderRadius: 14, padding: 18, marginBottom: 12, border: `2px dashed ${upload ? C.ok : '#CBD5E1'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <Camera size={22} color={upload ? C.ok : C.pri} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {upload ? `Ready: ${upload.name}` : 'Photograph or upload the discharge summary'}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              {upload ? 'Tap to choose a different file' : 'JPG, PNG or PDF — a clear phone photo works'}
            </div>
          </div>
        </div>

        {/* Paste-text alternative */}
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 14, border: `2px dashed #CBD5E1`, opacity: upload ? 0.5 : 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <FileText size={18} color={C.pri} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t('discharge.paste')}</div>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (e.target.value) setUpload(null); }}
            placeholder={t('discharge.placeholder')}
            style={{ width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>

        <div onClick={() => { setText(SAMPLE_DISCHARGE); setUpload(null); }} style={{ background: C.pale, borderRadius: 12, padding: '12px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: `1.5px dashed ${C.light}` }}>
          <Play size={16} color={C.pri} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pri }}>{t('discharge.demo')}</div>
        </div>

        <div style={{ background: C.warnBg, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>⚠️ You stay in control</div>
          <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
            ALLY only transcribes what the hospital wrote — it never invents medical advice. You review and confirm every item before anything is activated, and hard-to-read items are flagged for you.
          </div>
        </div>
      </div>
      <div style={{ padding: '0 16px 28px' }}>
        <button type="button" onClick={parse} disabled={!canParse}
          style={{ width: '100%', background: canParse ? `linear-gradient(135deg,${C.pri},${C.light})` : '#CBD5E1', color: 'white', padding: '15px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: canParse ? 'pointer' : 'default', border: 'none' }}>
          {t('discharge.parse')}
        </button>
        <div onClick={onSkip} style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: C.sub, cursor: 'pointer' }}>
          {t('discharge.skip')}
        </div>
      </div>
    </div>
  );
}
