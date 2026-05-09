'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { C } from '@/lib/theme';
import { SUBSIDIES } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import PhoneFrame from '@/components/PhoneFrame';

export default function SubsidiesPage() {
  const router = useRouter();
  const t = useT();

  return (
    <PhoneFrame>
      <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
          <div onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer', fontSize: 14, opacity: 0.85 }}>
            <ChevronLeft size={16} /> {t('common.back')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{t('subsidy.title')}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Updated for 1 April 2026 enhancements</div>
        </div>
        <div style={{ padding: '16px 16px 80px' }}>
          {SUBSIDIES.map((s, i) => {
            const statusKey = s.status === 'Eligible' ? 'subsidy.eligible' : s.status === 'Active' ? 'subsidy.active' : 'subsidy.check';
            const statusLabel = t(statusKey as 'subsidy.eligible' | 'subsidy.active' | 'subsidy.check');
            return (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.name}</div>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: s.col, color: 'white', fontWeight: 700, flexShrink: 0 }}>{statusLabel}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: s.col, marginTop: 4 }}>{s.amt}</div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.55, marginTop: 8 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}
