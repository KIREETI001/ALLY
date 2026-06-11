'use client';

// Subsidy Navigator v2 — deterministic eligibility wizard.
//
// Replaces the static (and stale) demo list. All figures come from the
// versioned rules engine in lib/subsidies.ts (verified on primary sources,
// see RULES_VERSION). The AI never computes these numbers.

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { C } from '@/lib/theme';
import PhoneFrame from '@/components/PhoneFrame';
import { computeEntitlements, RULES_VERSION, type HouseholdInput, type Verdict } from '@/lib/subsidies';

const VERDICT_STYLE: Record<Verdict, { bg: string; label: string }> = {
  eligible: { bg: C.ok, label: 'Eligible' },
  likely: { bg: C.pri, label: 'Likely' },
  check: { bg: C.warn, label: 'Check' },
  not_eligible: { bg: '#9CA3AF', label: 'Not eligible' },
};

const PCHI_BANDS = [
  { label: 'Prefer not to say', value: undefined },
  { label: 'S$0 – 1,200', value: 1200 },
  { label: 'S$1,201 – 1,500', value: 1500 },
  { label: 'S$1,501 – 2,300', value: 2300 },
  { label: 'S$2,301 – 3,600', value: 3600 },
  { label: 'S$3,601 – 4,800', value: 4800 },
  { label: 'Above S$4,800', value: 6000 },
] as const;

export default function SubsidiesPage() {
  const router = useRouter();
  const [pchiIdx, setPchiIdx] = useState(0);
  const [adl, setAdl] = useState<number | undefined>(undefined);
  const [age, setAge] = useState<string>('');
  const [hasMdw, setHasMdw] = useState(true);
  const [multiProperty, setMultiProperty] = useState(false);

  const input: HouseholdInput = useMemo(() => ({
    pchi: PCHI_BANDS[pchiIdx].value,
    adlCount: adl,
    age: age ? Number(age) : undefined,
    hasMdw,
    multiProperty,
  }), [pchiIdx, adl, age, hasMdw, multiProperty]);

  const results = useMemo(() => computeEntitlements(input), [input]);
  const eligibleCount = results.filter((r) => r.verdict === 'eligible' || r.verdict === 'likely').length;

  const selStyle: CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`,
    fontSize: 14, color: C.text, background: 'white', outline: 'none',
  };

  return (
    <PhoneFrame>
      <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
          <div onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer', fontSize: 14, opacity: 0.85 }}>
            <ChevronLeft size={16} /> Back
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Subsidy Navigator</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            Answer 3 questions — see your household&apos;s entitlement stack
          </div>
        </div>

        {/* Wizard */}
        <div style={{ padding: 16 }}>
          <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: 6 }}>
              Per-capita household income (monthly)
            </div>
            <select value={pchiIdx} onChange={(e) => setPchiIdx(Number(e.target.value))} style={selStyle}>
              {PCHI_BANDS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
            </select>

            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', margin: '14px 0 6px' }}>
              Daily activities needing help (of 6: washing, dressing, feeding, toileting, mobility, transferring)
            </div>
            <select
              value={adl === undefined ? '' : adl}
              onChange={(e) => setAdl(e.target.value === '' ? undefined : Number(e.target.value))}
              style={selStyle}
            >
              <option value="">Not sure yet</option>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} of 6</option>)}
            </select>

            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', margin: '14px 0 6px' }}>
              Care recipient&apos;s age
            </div>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="e.g. 78"
              inputMode="numeric"
              style={selStyle}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={hasMdw} onChange={(e) => setHasMdw(e.target.checked)} />
                Employs a helper (MDW)
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={multiProperty} onChange={(e) => setMultiProperty(e.target.checked)} />
                Owns &gt;1 property
              </label>
            </div>
          </div>

          {/* Trust strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.pale, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <ShieldCheck size={15} color={C.pri} />
            <div style={{ fontSize: 11.5, color: C.pri, lineHeight: 1.45 }}>
              Figures verified {RULES_VERSION} on official sources. Schemes change every Budget — always confirm with AIC before relying on an amount.
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
            {eligibleCount > 0 ? `${eligibleCount} scheme${eligibleCount > 1 ? 's' : ''} look applicable` : 'Your entitlement stack'}
          </div>

          {/* Results */}
          <div style={{ paddingBottom: 64 }}>
            {results.map((r) => {
              const vs = VERDICT_STYLE[r.verdict];
              return (
                <div key={r.id} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12, opacity: r.verdict === 'not_eligible' ? 0.62 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</div>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: vs.bg, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                      {vs.label}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: r.verdict === 'not_eligible' ? C.sub : C.pri, marginTop: 4 }}>{r.amount}</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.55, marginTop: 8 }}>{r.reason}</div>
                  <div style={{ fontSize: 12, color: C.text, marginTop: 8 }}>→ {r.apply}</div>
                  <a
                    href={r.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: C.pri, marginTop: 8, textDecoration: 'none', fontWeight: 600 }}
                  >
                    Official source <ExternalLink size={11} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
