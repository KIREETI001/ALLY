'use client';

// Slim dispatcher. Picks the right view based on auth + onboarding state.
//
// Pre-app: pre-auth users see the marketing/landing redirect to /login.
// Once authed: if no patient yet → onboarding flow (language → onboarding → discharge).
// Once patient + plan exist → main app (6-tab bottom nav).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useTasks } from '@/lib/hooks/useTasks';
import PhoneFrame from '@/components/PhoneFrame';
import BottomNav, { type TabId } from '@/components/BottomNav';
import TaskDetailModal from '@/components/TaskDetailModal';
import LanguageScreen from '@/components/screens/LanguageScreen';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import DischargeFlow from '@/components/screens/DischargeFlow';
import HomeTab from '@/components/tabs/HomeTab';
import TasksTab from '@/components/tabs/TasksTab';
import WalletTab from '@/components/tabs/WalletTab';
import AllyChatTab from '@/components/tabs/AllyChatTab';
import ResourcesTab from '@/components/tabs/ResourcesTab';
import ProfileTab from '@/components/tabs/ProfileTab';
import { C } from '@/lib/theme';
import type { Task, Patient, CarePlan } from '@/lib/types';

type PreAppStep = 'language' | 'onboarding' | 'discharge';

export default function ALLY() {
  const router = useRouter();
  const { loading, user, currentPatient, currentCarePlan, fdwMode, setCurrentPatient, setCurrentCarePlan } = useApp();

  // Redirect unauthenticated users to /login (middleware also enforces this server-side).
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Pre-app step state when onboarding
  const [preStep, setPreStep] = useState<PreAppStep>('language');
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // Main app state
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [openTask, setOpenTask] = useState<Task | null>(null);

  const { toggleDone } = useTasks(currentCarePlan?.id || null);

  if (loading || !user) {
    return (
      <PhoneFrame>
        <LoadingState />
      </PhoneFrame>
    );
  }

  // First-time onboarding flow: no patient yet
  const needsOnboarding = !currentPatient;
  const needsCarePlan = currentPatient && !currentCarePlan;

  if (needsOnboarding) {
    return (
      <PhoneFrame>
        {preStep === 'language' && <LanguageScreen onContinue={() => setPreStep('onboarding')} />}
        {preStep === 'onboarding' && (
          <OnboardingScreen
            onComplete={(patient) => {
              setActivePatient(patient);
              setCurrentPatient(patient);
              setPreStep('discharge');
            }}
          />
        )}
        {preStep === 'discharge' && (activePatient || currentPatient) && (
          <DischargeFlow
            patient={(activePatient || currentPatient) as Patient}
            onComplete={(plan: CarePlan) => {
              setCurrentCarePlan(plan);
              setActiveTab('home');
            }}
            onBack={() => setPreStep('onboarding')}
            onSkip={() => setActiveTab('home')}
          />
        )}
      </PhoneFrame>
    );
  }

  // Patient exists but no care plan yet (user skipped discharge upload during onboarding).
  // Let them complete it from the discharge flow on demand by going to Tasks tab; for now we just go to main app.
  if (needsCarePlan) {
    return (
      <PhoneFrame>
        <DischargeFlow
          patient={currentPatient as Patient}
          onComplete={(plan: CarePlan) => {
            setCurrentCarePlan(plan);
            setActiveTab('home');
          }}
          onBack={() => setActiveTab('home')}
          onSkip={() => setActiveTab('home')}
        />
      </PhoneFrame>
    );
  }

  // Main app
  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'home' && (
            <HomeTab
              onTaskTap={setOpenTask}
              onSubsidyTap={() => router.push('/subsidies')}
              onTasksTap={() => setActiveTab('tasks')}
            />
          )}
          {activeTab === 'tasks' && <TasksTab onTaskTap={setOpenTask} />}
          {activeTab === 'wallet' && <WalletTab />}
          {activeTab === 'chat' && <AllyChatTab />}
          {activeTab === 'resources' && <ResourcesTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} />

        <TaskDetailModal
          task={openTask}
          fdwMode={fdwMode}
          onClose={() => setOpenTask(null)}
          onToggle={toggleDone}
        />
      </div>
    </PhoneFrame>
  );
}

function LoadingState() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.sub, fontSize: 14 }}>
      Loading…
    </div>
  );
}
