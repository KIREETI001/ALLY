'use client';

import { Home, CheckSquare, MessageCircle, BookOpen, User } from 'lucide-react';
import { C } from '@/lib/theme';

export type TabId = 'home' | 'tasks' | 'chat' | 'resources' | 'profile';

const TABS: { id: TabId; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquare },
  { id: 'chat', label: 'AI Ally', Icon: MessageCircle },
  { id: 'resources', label: 'Resources', Icon: BookOpen },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div style={{ height: 68, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {TABS.map(({ id, label, Icon }) => (
        <div
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            cursor: 'pointer',
            color: active === id ? C.pri : '#9CA3AF',
          }}
        >
          <Icon size={21} />
          <span style={{ fontSize: 10, fontWeight: active === id ? 700 : 400 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
