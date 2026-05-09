'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { C } from '@/lib/theme';
import { signIn, signInWithGoogle } from './actions';
import PhoneFrame from '@/components/PhoneFrame';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(params.get('error'));
  const [pending, start] = useTransition();
  const [googlePending, startGoogle] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', pass);
    start(async () => {
      const res = await signIn(fd);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  const onGoogle = () => {
    setError(null);
    startGoogle(async () => {
      const res = await signInWithGoogle();
      if (res?.error) setError(res.error);
    });
  };

  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.card }}>
        <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '70px 24px 40px', color: 'white', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Heart size={30} color="white" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>ALLY</div>
          <div style={{ fontSize: 14, opacity: .8, marginTop: 4 }}>Your AI Caregiver Co-Pilot</div>
        </div>
        <form onSubmit={submit} style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Welcome Back</div>
          <div style={{ fontSize: 14, color: C.sub, marginBottom: 24 }}>Sign in to continue</div>

          {error && (
            <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <Field label="Email">
            <input
              type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              style={inputStyle}
            />
          </Field>

          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} autoComplete="current-password" required
                value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: C.sub, background: 'none', border: 'none' }}>
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 18 }}>
            <Link href="/forgot-password" style={{ fontSize: 12, color: C.pri, fontWeight: 600 }}>Forgot password?</Link>
          </div>

          <button
            type="submit" disabled={pending}
            style={{ background: pending ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', padding: '15px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 16, cursor: pending ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(27,107,123,.3)', border: 'none' }}>
            {pending ? 'Signing in…' : 'Sign In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <div style={{ fontSize: 12, color: C.sub }}>or</div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button
            type="button" onClick={onGoogle} disabled={googlePending}
            style={{ background: 'white', color: C.text, padding: '13px 0', borderRadius: 14, textAlign: 'center', fontWeight: 600, fontSize: 14, cursor: googlePending ? 'wait' : 'pointer', border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <GoogleIcon /> {googlePending ? 'Connecting…' : 'Continue with Google'}
          </button>
        </form>

        <div style={{ textAlign: 'center', padding: '0 0 28px', fontSize: 13, color: C.sub }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: C.pri, fontWeight: 700 }}>Sign Up</Link>
        </div>
      </div>
    </PhoneFrame>
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
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.61z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A8.99 8.99 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.97 10.7a5.41 5.41 0 0 1 0-3.4V4.97H.96a8.99 8.99 0 0 0 0 8.07l3.01-2.34z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0a8.99 8.99 0 0 0-8.04 4.97l3.01 2.34c.71-2.13 2.69-3.7 5.03-3.73z" fill="#EA4335" />
    </svg>
  );
}
