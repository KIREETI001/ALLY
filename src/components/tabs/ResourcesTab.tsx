'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { RESOURCES, RESOURCE_CATS } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';

export default function ResourcesTab() {
  const t = useT();
  const { lang } = useApp();
  const [cat, setCat] = useState<string>('All');

  // Prefer resources available in the user's language; fall back to all.
  const filtered = RESOURCES.filter((r) => (cat === 'All' || r.cat === cat))
    .sort((a, b) => Number(b.langs.includes(lang)) - Number(a.langs.includes(lang)));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 14px', color: 'white' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{t('res.title')}</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{t('res.subtitle')}</div>
      </div>
      <div style={{ padding: '12px 16px 0', background: C.card, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12 }}>
          {RESOURCE_CATS.map((c) => (
            <div
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                background: cat === c ? C.pri : C.bg,
                color: cat === c ? 'white' : C.sub,
                fontSize: 12,
                fontWeight: cat === c ? 700 : 400,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px' }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{r.title}</div>
            {r.verified && <div style={{ fontSize: 11, color: C.ok, marginBottom: 6 }}>{t('res.verified')}</div>}
            <div style={{ display: 'flex', gap: 4 }}>
              {r.langs.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 10,
                    background: l === lang ? C.pale : C.bg,
                    color: l === lang ? C.pri : C.sub,
                    padding: '2px 7px',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
