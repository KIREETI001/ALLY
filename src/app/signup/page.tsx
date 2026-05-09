'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { C } from '@/lib/theme';
import { signUp } from './actions';
import PhoneFrame from '@/components/PhoneFrame';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('full_name', name);
    fd.set('email', email);
    fd.set('password', pass);
    start(async () => {
      const res = await signUp(fd);
      if (res?.error) setError(res.error);
      else if (res?.needsConfirmation) setNeedsConfirmation(true);
      else router.refresh();
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
          <div style={{ fontSize: 14, opacity: .8, marginTop: 4 }}>Join Singapore caregivers</div>
        </div>

        {needsConfirmation ? (
          <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 }}>Check your email</div>
            <div style={{ fontSize: 14, color: C.sub, marginBottom: 28, lineHeight: 1.6 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to sign in.
            </div>
            <Link href="/login" style={{ background: C.pri, color: 'white', padding: '13px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Create Account</div>
            <div style={{ fontSize: 14, color: C.sub, marginBottom: 24 }}>Free tier — care for one. Upgrade later.</div>

            {error && (
              <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>
            )}

            <Field label="Your name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" autoComplete="name" style={inputStyle} required />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" autoComplete="email" style={inputStyle} required />
            </Field>
            <Field label="Password (8+ characters)">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password" required minLength={8}
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

            <button
              type="submit" disabled={pending}
              style={{ background: pending ? '#9CA3AF' : `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', padding: '15px 0', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 16, cursor: pending ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(27,107,123,.3)', border: 'none', marginTop: 6 }}>
              {pending ? 'Creating account…' : 'Sign Up'}
            </button>

            <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.55, marginTop: 14, textAlign: 'center' }}>
              By signing up you agree to ALLY&apos;s Terms and Privacy Notice.<br />
              ⚕️ ALLY provides general info only, not medical advice. For emergencies call 995.
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', padding: '0 0 28px', fontSize: 13, color: C.sub }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: C.pri, fontWeight: 700 }}>Sign In</Link>
        </div>
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
