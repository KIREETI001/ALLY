'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { C } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';
import PhoneFrame from '@/components/PhoneFrame';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pass.length < 8) return setError('Password must be at least 8 characters.');
    if (pass !== confirm) return setError('Passwords do not match.');
    start(async () => {
      const { error: err } = await supabase.auth.updateUser({ password: pass });
      if (err) setError(err.message);
      else {
        setDone(true);
        setTimeout(() => router.push('/'), 1500);
      }
    });
  };

  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.card }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '70px 24px 40px', color: 'white', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Heart size={30} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Set New Password</div>
        </div>
        {done ? (
          <div style={{ flex: 1, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ok, marginBottom: 12 }}>Password updated ✓</div>
            <div style={{ fontSize: 14, color: C.sub }}>Redirecting…</div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ flex: 1, padding: '32px 24px' }}>
            {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <Field label="New password (8+ chars)">
              <input type="password" required minLength={8} value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Confirm password">
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
            </Field>
            <button type="submit" disabled={pending}
              style={{ width: '100%', background: pending ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', padding: '14px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, border: 'none', cursor: pending ? 'wait' : 'pointer' }}>
              {pending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </PhoneFrame>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`,
  fontSize: 14, outline: 'none', boxSizing: 'border-box', color: C.text, fontFamily: 'inherit',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
