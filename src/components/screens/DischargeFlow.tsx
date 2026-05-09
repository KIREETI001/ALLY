'use client';

// DischargeFlow combines: upload screen → parsing → review/activate.
// Single component because the steps share state.

import { useState } from 'react';
import { ChevronLeft, FileText, Heart, Play, Shield } from 'lucide-react';
import { C, typeStyle } from '@/lib/theme';
import { SAMPLE_DISCHARGE, DEMO_PARSED } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase/client';
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
  const [step, setStep] = useState<Step>('upload');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedDischarge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const parse = async () => {
    if (!text.trim()) return;
    setError(null);
    setStep('parsing');
    try {
      const r = await fetch('/api/parse-discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      setParsed((d.parsed as ParsedDischarge) || DEMO_PARSED);
    } catch {
      setParsed(DEMO_PARSED);
    }
    setStep('confirm');
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
          warnings: parsed.warnings ?? [],
          medications: parsed.medications ?? [],
          raw_discharge_text: text,
          activated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (pErr || !plan) {
        setError(pErr?.message || 'Could not create care plan.');
        setActivating(false);
        return;
      }

      // Insert tasks
      const taskRows = (parsed.tasks ?? []).map((task) => ({
        care_plan_id: plan.id,
        title: task.title,
        type: task.type,
        scheduled_time: task.time,
        urgent: task.urgent,
        notes: task.notes ?? '',
        steps: [],
        done: false,
      }));
      if (taskRows.length > 0) await supabase.from('tasks').insert(taskRows);

      // Add the owner as a primary care team member
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
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t('confirm.title')}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{t('confirm.subtitle')}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          {parsed.diagnosis && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>{t('confirm.diagnosis')}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 4 }}>{parsed.diagnosis}</div>
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t('confirm.medications')}</div>
          {parsed.medications?.map((m, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{m.timing}{m.notes ? ` · ${m.notes}` : ''}</div>
            </div>
          ))}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, marginTop: 12 }}>{t('confirm.tasks')}</div>
          {parsed.tasks?.map((task, i) => {
            const ts = typeStyle(task.type);
            return (
              <div key={i} style={{ background: C.card, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Shield size={16} color={ts.tc} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{task.title}</div>
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
        </div>
      </div>
    );
  }

  // upload
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer', fontSize: 14, opacity: 0.85 }}>
          <ChevronLeft size={16} /> {t('common.back')}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{t('discharge.title')}</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{t('discharge.subtitle')}</div>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 14, border: `2px dashed #CBD5E1` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <FileText size={18} color={C.pri} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t('discharge.paste')}</div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('discharge.placeholder')}
            style={{ width: '100%', minHeight: 160, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>
        <div onClick={() => setText(SAMPLE_DISCHARGE)} style={{ background: C.pale, borderRadius: 12, padding: '12px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: `1.5px dashed ${C.light}` }}>
          <Play size={16} color={C.pri} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pri }}>{t('discharge.demo')}</div>
        </div>
        <div style={{ background: C.warnBg, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>⚠️ Human-in-the-Loop</div>
          <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>{t('discharge.disclaimer')}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 28px' }}>
        <button type="button" onClick={parse} disabled={!text.trim()}
          style={{ width: '100%', background: text.trim() ? `linear-gradient(135deg,${C.pri},${C.light})` : '#CBD5E1', color: 'white', padding: '15px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: text.trim() ? 'pointer' : 'default', border: 'none' }}>
          {t('discharge.parse')}
        </button>
        <div onClick={onSkip} style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: C.sub, cursor: 'pointer' }}>
          {t('discharge.skip')}
        </div>
      </div>
    </div>
  );
}
