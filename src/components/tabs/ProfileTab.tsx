'use client';

import { useState } from 'react';
import { LogOut, Plus, Check } from 'lucide-react';
import { C } from '@/lib/theme';
import { LANGS } from '@/lib/demo-data';
import { useApp } from '@/context/AppContext';
import { useT } from '@/lib/i18n';
import { useCareTeam } from '@/lib/hooks/useCareTeam';
import type { LangCode, TeamRole } from '@/lib/types';

export default function ProfileTab() {
  const { user, profile, currentPatient, currentCarePlan, lang, fdwMode, setLang, setFdwMode } = useApp();
  const t = useT();
  const { members, invites, invite, refresh } = useCareTeam(currentCarePlan?.id || null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('secondary');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const displayName = profile?.full_name || (user?.email?.split('@')[0]) || 'Caregiver';

  const submitInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteError(null);
    const res = await invite(inviteEmail, inviteRole);
    if (res.error) setInviteError(res.error);
    else {
      setInviteEmail('');
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        setShowInvite(false);
        refresh();
      }, 1600);
    }
    setInviteBusy(false);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 24px', color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('profile.title')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {profile?.role || 'caregiver'} of {currentPatient?.name || 'your loved one'}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 80px' }}>
        {/* Language */}
        <Section title={t('profile.language')}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {LANGS.map((l) => (
              <div
                key={l.code}
                onClick={() => setLang(l.code as LangCode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: lang === l.code ? C.pri : C.bg,
                  color: lang === l.code ? 'white' : C.sub,
                  fontSize: 12,
                  fontWeight: lang === l.code ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {l.flag} {l.native}
              </div>
            ))}
          </div>
        </Section>

        {/* FDW mode */}
        <Section title={t('profile.fdwMode')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{t('profile.fdwModeDesc')}</div>
            <Toggle on={fdwMode} onChange={setFdwMode} />
          </div>
        </Section>

        {/* Care team */}
        <Section title={t('profile.team')}>
          {members.length === 0 ? (
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>{t('team.empty')}</div>
          ) : (
            <>
              {members.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: m.display_color, color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.display_initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {m.full_name || m.email || 'Member'}
                      {m.user_id === user?.id && <span style={{ fontSize: 10, color: C.pri, marginLeft: 6, fontWeight: 700 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, textTransform: 'capitalize' }}>{m.role}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {invites.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.sub }}>
              {invites.length} pending invite{invites.length === 1 ? '' : 's'} ({invites.map((i) => i.email).join(', ')})
            </div>
          )}

          {!showInvite ? (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              style={{ marginTop: 14, width: '100%', padding: '11px', background: C.pale, color: C.pri, border: `1.5px dashed ${C.pri}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={15} /> {t('team.invite')}
            </button>
          ) : (
            <div style={{ marginTop: 14, padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 12 }}>
              {inviteSent ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.ok, fontWeight: 700, fontSize: 13, padding: 10 }}>
                  <Check size={16} /> {t('team.inviteSent')}
                </div>
              ) : (
                <>
                  {inviteError && <div style={{ background: C.errBg, color: C.err, padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 10 }}>{inviteError}</div>}
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>{t('team.inviteEmail')}</div>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="family@example.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>{t('team.inviteRole')}</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {(['secondary', 'fdw', 'observer'] as TeamRole[]).map((r) => (
                      <button key={r} type="button" onClick={() => setInviteRole(r)}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${inviteRole === r ? C.pri : C.border}`, background: inviteRole === r ? C.pale : 'white', color: inviteRole === r ? C.pri : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setShowInvite(false)}
                      style={{ flex: 0.4, padding: '10px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {t('common.cancel')}
                    </button>
                    <button type="button" onClick={submitInvite} disabled={inviteBusy || !inviteEmail.trim()}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, background: !inviteEmail.trim() ? '#CBD5E1' : C.pri, color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: inviteBusy ? 'wait' : 'pointer' }}>
                      {inviteBusy ? '…' : t('team.inviteBtn')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </Section>

        <form action="/auth/sign-out" method="post">
          <button type="submit" style={{ width: '100%', background: C.errBg, borderRadius: 12, padding: '12px 16px', textAlign: 'center', color: C.err, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={15} /> {t('common.signout')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: C.text }}>{title}</div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{ width: 46, height: 26, borderRadius: 13, background: on ? C.pri : '#CBD5E1', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: 10, background: 'white', transition: 'left 0.15s' }} />
    </button>
  );
}
