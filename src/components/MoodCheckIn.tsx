'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { useT } from '@/lib/i18n';

const MOODS = [
  { v: 1, e: '😔', l: 'Drained' },
  { v: 2, e: '😟', l: 'Tired' },
  { v: 3, e: '😐', l: 'OK' },
  { v: 4, e: '🙂', l: 'Good' },
  { v: 5, e: '😊', l: 'Great' },
];

interface MoodCheckInProps {
  todayMood: number | null;
  onLog: (mood: 1 | 2 | 3 | 4 | 5, note?: string) => Promise<void>;
}

export default function MoodCheckIn({ todayMood, onLog }: MoodCheckInProps) {
  const t = useT();
  const [selected, setSelected] = useState<number | null>(todayMood);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(todayMood != null);

  const submit = async () => {
    if (selected == null || busy) return;
    setBusy(true);
    try {
      await onLog(selected as 1 | 2 | 3 | 4 | 5);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>{t('home.moodPrompt')}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: done ? 0 : 12 }}>
        {MOODS.map((m) => {
          const isSel = selected === m.v;
          return (
            <button
              key={m.v}
              type="button"
              disabled={done}
              onClick={() => setSelected(m.v)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 4px', borderRadius: 12,
                background: isSel ? C.pale : 'transparent',
                border: isSel ? `1.5px solid ${C.pri}` : `1.5px solid transparent`,
                cursor: done ? 'default' : 'pointer',
              }}
            >
              <span style={{ fontSize: 24 }}>{m.e}</span>
              <span style={{ fontSize: 10, color: isSel ? C.pri : C.sub, fontWeight: isSel ? 700 : 500 }}>{m.l}</span>
            </button>
          );
        })}
      </div>
      {!done && (
        <button onClick={submit} disabled={selected == null || busy}
          style={{
            width: '100%', marginTop: 12, padding: '10px', borderRadius: 10,
            background: selected == null ? '#CBD5E1' : C.pri, color: 'white',
            border: 'none', fontWeight: 700, fontSize: 13,
            cursor: selected == null ? 'default' : busy ? 'wait' : 'pointer',
          }}>
          {busy ? 'Saving…' : t('home.moodSubmit')}
        </button>
      )}
      {done && (
        <div style={{ marginTop: 8, fontSize: 12, color: C.ok, fontWeight: 600, textAlign: 'center' }}>Logged for today ✓</div>
      )}
    </div>
  );
}
