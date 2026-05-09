'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LangCode, Profile, Patient, CarePlan } from '@/lib/types';

interface AppState {
  loading: boolean;
  user: { id: string; email: string } | null;
  profile: Profile | null;
  lang: LangCode;
  fdwMode: boolean;
  currentPatient: Patient | null;
  currentCarePlan: CarePlan | null;

  setLang: (lang: LangCode) => Promise<void>;
  setFdwMode: (fdw: boolean) => Promise<void>;
  setCurrentPatient: (p: Patient | null) => void;
  setCurrentCarePlan: (cp: CarePlan | null) => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children, initialUser }: { children: ReactNode; initialUser: { id: string; email: string } | null }) {
  const supabase = createClient();
  const [user, setUser] = useState<AppState['user']>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lang, setLangState] = useState<LangCode>('en');
  const [fdwMode, setFdwModeState] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentCarePlan, setCurrentCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndContext = useCallback(async (uid: string) => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (prof) {
      setProfile(prof as Profile);
      setLangState((prof.language as LangCode) || 'en');
      setFdwModeState(!!prof.fdw_mode);
    }
    // Load latest patient + care plan (for now: most recent owned by this user).
    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false })
      .limit(1);
    if (patients && patients[0]) {
      setCurrentPatient(patients[0] as Patient);
      const { data: plans } = await supabase
        .from('care_plans')
        .select('*')
        .eq('patient_id', patients[0].id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (plans && plans[0]) setCurrentCarePlan(plans[0] as CarePlan);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (u) {
        setUser({ id: u.id, email: u.email || '' });
        await loadProfileAndContext(u.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [supabase, loadProfileAndContext]);

  // Subscribe to auth changes to keep state in sync (signout, signin)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        await loadProfileAndContext(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setCurrentPatient(null);
        setCurrentCarePlan(null);
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [supabase, loadProfileAndContext]);

  const setLang = useCallback(async (next: LangCode) => {
    setLangState(next);
    if (user) {
      await supabase.from('profiles').update({ language: next }).eq('id', user.id);
    }
  }, [supabase, user]);

  const setFdwMode = useCallback(async (next: boolean) => {
    setFdwModeState(next);
    if (user) {
      await supabase.from('profiles').update({ fdw_mode: next }).eq('id', user.id);
    }
  }, [supabase, user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfileAndContext(user.id);
  }, [user, loadProfileAndContext]);

  const value: AppState = {
    loading, user, profile,
    lang, fdwMode,
    currentPatient, currentCarePlan,
    setLang, setFdwMode,
    setCurrentPatient, setCurrentCarePlan,
    refreshProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
