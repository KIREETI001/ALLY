'use client';

// Resource Hub v2: real, openable destinations (verified URLs from the June
// 2026 research pass) + in-app pages (transparency). Sorted to prefer the
// user's language; external links open in a new tab.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { C } from '@/lib/theme';
import { RESOURCES, RESOURCE_CATS } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';

export default function ResourcesTab() {
  const t = useT();
  const router = useRouter();
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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px 80px' }}>
        {filtered.map((r) => {
          const open = () => {
            if (r.internal) router.push(r.internal);
            else if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
          };
          return (
            <div
              key={r.id}
              onClick={open}
              style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{r.title}</div>
                  {r.verified && <div style={{ fontSize: 11, color: C.ok, marginBottom: 6 }}>{t('res.verified')}</div>}
                  <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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
                    {r.url && (
                      <span style={{ fontSize: 10, color: C.sub, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {new URL(r.url).hostname.replace('www.', '')} <ExternalLink size={10} />
                      </span>
                    )}
                  </div>
                </div>
                {r.internal && <ChevronRight size={17} color={C.sub} style={{ flexShrink: 0, marginTop: 2 }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
