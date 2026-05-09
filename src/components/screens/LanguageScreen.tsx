'use client';

import { Globe, Check } from 'lucide-react';
import { C } from '@/lib/theme';
import { LANGS } from '@/lib/demo-data';
import { useApp } from '@/context/AppContext';
import { useT } from '@/lib/i18n';
import type { LangCode } from '@/lib/types';

export default function LanguageScreen({ onContinue }: { onContinue: () => void }) {
  const { lang, setLang } = useApp();
  const t = useT();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '60px 24px 28px', color: 'white', textAlign: 'center' }}>
        <Globe size={26} color="white" style={{ margin: '0 auto 14px' }} />
        <div style={{ fontSize: 20, fontWeight: 700 }}>{t('lang.title')}</div>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {LANGS.map((l) => (
          <div
            key={l.code}
            onClick={() => setLang(l.code as LangCode)}
            style={{
              background: C.card,
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              border: `2px solid ${lang === l.code ? C.pri : 'transparent'}`,
            }}
          >
            <div style={{ fontSize: 32 }}>{l.flag}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{l.native}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{l.name}</div>
            </div>
            {lang === l.code && <Check size={20} color={C.pri} strokeWidth={3} />}
          </div>
        ))}
      </div>
      <div style={{ padding: '0 20px 28px' }}>
        <button
          type="button"
          onClick={onContinue}
          style={{
            width: '100%',
            background: `linear-gradient(135deg,${C.pri},${C.light})`,
            color: 'white',
            padding: '15px 0',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}
