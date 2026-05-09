'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { C } from '@/lib/theme';
import { sendReset } from './actions';
import PhoneFrame from '@/components/PhoneFrame';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('email', email);
    start(async () => {
      const res = await sendReset(fd);
      if (res?.error) setError(res.error);
      else setDone(true);
    });
  };

  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.card }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '70px 24px 40px', color: 'white', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Heart size={30} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Reset Password</div>
        </div>

        {done ? (
          <div style={{ flex: 1, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Check your email</div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a reset link.
            </div>
            <Link href="/login" style={{ display: 'inline-block', marginTop: 24, color: C.pri, fontWeight: 600 }}>← Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ flex: 1, padding: '32px 24px 24px' }}>
            <div style={{ fontSize: 14, color: C.sub, marginBottom: 18 }}>Enter your email and we&apos;ll send you a link to reset your password.</div>
            {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, fontWeight: 600 }}>Email</div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: C.text }} />
            </div>
            <button type="submit" disabled={pending}
              style={{ width: '100%', background: pending ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', padding: '14px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, border: 'none', cursor: pending ? 'wait' : 'pointer' }}>
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
              <Link href="/login" style={{ color: C.pri, fontWeight: 600 }}>← Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </PhoneFrame>
  );
}
