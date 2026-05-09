import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import PhoneFrame from '@/components/PhoneFrame';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not signed in → bounce to /login with the invite link preserved
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // Look up invite to display details (email and role) before accepting
  const { data: invite } = await supabase
    .from('care_team_invites')
    .select('email, role, accepted_at, expires_at, care_plan_id')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return (
      <PhoneFrame>
        <Centered>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Invite not found</div>
          <div style={{ fontSize: 14, color: C.sub, marginBottom: 18 }}>This invitation may have been deleted or used already.</div>
          <Link href="/" style={btn}>Go home</Link>
        </Centered>
      </PhoneFrame>
    );
  }

  if (invite.accepted_at) {
    return (
      <PhoneFrame>
        <Centered>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Already accepted</div>
          <div style={{ fontSize: 14, color: C.sub, marginBottom: 18 }}>You&apos;re already on this care team.</div>
          <Link href="/" style={btn}>Go to your dashboard</Link>
        </Centered>
      </PhoneFrame>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <PhoneFrame>
        <Centered>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Invite expired</div>
          <div style={{ fontSize: 14, color: C.sub, marginBottom: 18 }}>Ask the person who invited you to send a fresh one.</div>
          <Link href="/" style={btn}>Go home</Link>
        </Centered>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <Centered>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 6 }}>You&apos;re invited 💌</div>
        <div style={{ fontSize: 14, color: C.sub, marginBottom: 18, lineHeight: 1.55 }}>
          You&apos;ve been invited to join a care team as <strong>{invite.role}</strong>.
        </div>
        <form action={async () => {
          'use server';
          const sb = await createClient();
          await sb.rpc('accept_invite', { invite_token: token });
          redirect('/');
        }}>
          <button type="submit" style={{ ...btn, background: C.pri, color: 'white' }}>
            Accept invitation
          </button>
        </form>
        <Link href="/" style={{ ...btn, background: 'transparent', color: C.sub, marginTop: 10 }}>
          Decide later
        </Link>
      </Centered>
    </PhoneFrame>
  );
}

const btn: React.CSSProperties = {
  display: 'inline-block',
  padding: '13px 22px',
  borderRadius: 12,
  background: C.pale,
  color: C.pri,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  border: 'none',
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 32, textAlign: 'center' }}>
      {children}
    </div>
  );
}
