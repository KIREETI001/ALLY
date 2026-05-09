'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { CAREGIVER_ROLES, CARE_TYPES } from '@/lib/demo-data';
import { useApp } from '@/context/AppContext';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { CaregiverRole, CareType, Patient } from '@/lib/types';

interface Props {
  onComplete: (patient: Patient) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const supabase = createClient();
  const { user, profile, refreshProfile } = useApp();
  const t = useT();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.full_name || '');
  const [role, setRole] = useState<CaregiverRole>(profile?.role as CaregiverRole || 'daughter');
  const [ptName, setPtName] = useState('');
  const [ptAge, setPtAge] = useState('');
  const [ptCond, setPtCond] = useState('');
  const [careType, setCareType] = useState<CareType>('post-discharge');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!user) {
      setError('You must be signed in.');
      return;
    }
    setBusy(true);
    setError(null);

    // Save profile fields
    await supabase.from('profiles').update({ full_name: name, role }).eq('id', user.id);

    // Create patient
    const conditions = ptCond.split(',').map((c) => c.trim()).filter(Boolean);
    const { data: patient, error: pErr } = await supabase
      .from('patients')
      .insert({
        owner_id: user.id,
        name: ptName || 'My loved one',
        age: ptAge ? Number(ptAge) : null,
        conditions,
      })
      .select('*')
      .single();

    if (pErr || !patient) {
      setError(pErr?.message || 'Could not save patient details.');
      setBusy(false);
      return;
    }

    await refreshProfile();
    onComplete(patient as Patient);
    setBusy(false);
  };

  const back = () => step > 1 && setStep(step - 1);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '52px 24px 24px', color: 'white' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'white' : 'rgba(255,255,255,.3)' }} />
          ))}
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Step {step} of 3</div>
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>
          {step === 1 ? t('onboard.step1Title') : step === 2 ? t('onboard.step2Title') : t('onboard.step3Title')}
        </div>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {step === 1 && (
          <>
            <Field label={t('onboard.yourName')}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" style={inputStyle} />
            </Field>
            <Field label={t('onboard.relationship')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CAREGIVER_ROLES.map((r) => (
                  <div
                    key={r}
                    onClick={() => setRole(r as CaregiverRole)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${role === r ? C.pri : C.border}`,
                      background: role === r ? C.pale : C.card,
                      fontSize: 13,
                      fontWeight: role === r ? 700 : 400,
                      color: role === r ? C.pri : C.text,
                      cursor: 'pointer',
                      textAlign: 'center',
                      textTransform: 'capitalize',
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <Field label={t('onboard.patientName')}>
              <input value={ptName} onChange={(e) => setPtName(e.target.value)} placeholder="Mr. Chen Wei" style={inputStyle} />
            </Field>
            <Field label={t('onboard.age')}>
              <input type="number" value={ptAge} onChange={(e) => setPtAge(e.target.value)} placeholder="72" style={inputStyle} />
            </Field>
            <Field label={t('onboard.conditions')}>
              <input value={ptCond} onChange={(e) => setPtCond(e.target.value)} placeholder="Diabetes, Hypertension" style={inputStyle} />
            </Field>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>{t('onboard.careKind')}</div>
            {CARE_TYPES.map((ct) => (
              <div
                key={ct.id}
                onClick={() => setCareType(ct.id)}
                style={{
                  background: C.card,
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: `2px solid ${careType === ct.id ? C.pri : 'transparent'}`,
                }}
              >
                <span style={{ fontSize: 24 }}>{ct.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{ct.label}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{ct.sub}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ padding: '0 20px 28px', display: 'flex', gap: 10 }}>
        {step > 1 && (
          <button
            type="button"
            onClick={back}
            style={{ flex: 0.4, padding: '14px 0', borderRadius: 14, border: `1.5px solid ${C.border}`, textAlign: 'center', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'transparent', color: C.text }}
          >
            {t('common.back')}
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={busy}
          style={{
            flex: 1,
            background: busy ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`,
            color: 'white',
            padding: '14px 0',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 15,
            cursor: busy ? 'wait' : 'pointer',
            border: 'none',
          }}
        >
          {busy ? '…' : step < 3 ? t('common.continue') : 'Next: Discharge Summary'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 12,
  border: `1.5px solid ${C.border}`,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  color: C.text,
  fontFamily: 'inherit',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}
