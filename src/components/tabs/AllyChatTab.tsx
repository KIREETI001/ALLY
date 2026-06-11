'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, Send } from 'lucide-react';
import { C } from '@/lib/theme';
import { QUICK_CHAT_PROMPTS } from '@/lib/demo-data';
import { useT } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/types';

export default function AllyChatTab() {
  const t = useT();
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('chat.intro') },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // v2: streaming responses. The server now derives care context (patient,
  // plan, language) from the session — the client sends only the messages.
  const send = async (override?: string) => {
    const msg = (override || input).trim();
    if (!msg || busy) return;
    setInput('');
    setMsgs((p) => [...p, { role: 'user', content: msg }]);
    setBusy(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...msgs.filter((m, i) => !(i === 0 && m.role === 'assistant')), { role: 'user', content: msg }]
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // Error paths return JSON; the happy path streams text/plain.
      const contentType = r.headers.get('content-type') || '';
      if (!r.ok || contentType.includes('application/json')) {
        const d = await r.json().catch(() => ({}));
        setMsgs((p) => [...p, { role: 'assistant', content: d.error || 'Sorry, please try again.' }]);
        setBusy(false);
        return;
      }

      // Append an empty assistant bubble and fill it as tokens arrive.
      setMsgs((p) => [...p, { role: 'assistant', content: '' }]);
      const reader = r.body?.getReader();
      if (!reader) throw new Error('no stream');
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMsgs((p) => {
          const next = [...p];
          next[next.length - 1] = { role: 'assistant', content: snapshot };
          return next;
        });
      }
      if (!acc.trim()) {
        setMsgs((p) => {
          const next = [...p];
          next[next.length - 1] = { role: 'assistant', content: 'Sorry, please try again.' };
          return next;
        });
      }
    } catch {
      setMsgs((p) => [...p, { role: 'assistant', content: 'Connection issue. Try again.' }]);
    }
    setBusy(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 16px', color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{t('chat.title')}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{t('chat.subtitle')}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 4px' }}>
        {msgs.length === 1 && (
          <div style={{ marginBottom: 14 }}>
            {QUICK_CHAT_PROMPTS.map((q, i) => (
              <div
                key={i}
                onClick={() => send(q.t)}
                style={{ background: C.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, fontSize: 14, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}
              >
                <span style={{ fontSize: 17 }}>{q.e}</span>{q.t}
              </div>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: 16, background: C.pri, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                <Heart size={15} color="white" />
              </div>
            )}
            <div
              style={{
                maxWidth: '76%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? C.pri : C.card,
                color: m.role === 'user' ? 'white' : C.text,
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: C.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={15} color="white" />
            </div>
            <div style={{ background: C.card, borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map((j) => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: 4, background: C.pri, opacity: 0.4 + j * 0.25 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '10px 16px 18px', background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: C.bg, borderRadius: 24, padding: '8px 14px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('chat.placeholder')}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: C.text }}
          />
          <div onClick={() => send()} style={{ width: 32, height: 32, borderRadius: 16, background: input.trim() ? C.pri : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={13} color="white" />
          </div>
        </div>
      </div>
    </div>
  );
}
