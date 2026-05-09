'use client';

import { Bell, ChevronRight } from 'lucide-react';
import { C } from '@/lib/theme';
import { useApp } from '@/context/AppContext';
import { useT } from '@/lib/i18n';
import { useTasks } from '@/lib/hooks/useTasks';
import { useMood } from '@/lib/hooks/useMood';
import { useCareTeam } from '@/lib/hooks/useCareTeam';
import { computeBurnout } from '@/lib/burnout';
import BurnoutBanner from '@/components/BurnoutBanner';
import MoodCheckIn from '@/components/MoodCheckIn';
import TaskRow from '@/components/TaskRow';
import type { Task } from '@/lib/types';

interface Props {
  onTaskTap: (task: Task) => void;
  onSubsidyTap: () => void;
  onTasksTap: () => void;
}

export default function HomeTab({ onTaskTap, onSubsidyTap, onTasksTap }: Props) {
  const { user, profile, currentCarePlan, fdwMode } = useApp();
  const t = useT();
  const { tasks, toggleDone } = useTasks(currentCarePlan?.id || null);
  const { logs: moodLogs, todayMood, log: logMood } = useMood(user?.id || null);
  const { members } = useCareTeam(currentCarePlan?.id || null);

  const displayName = profile?.full_name || (user?.email?.split('@')[0]) || 'Caregiver';
  const done = tasks.filter((x) => x.done).length;
  const burn = computeBurnout({ recentMoods: moodLogs, totalTasks: tasks.length, doneTasks: done });

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '52px 20px 24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{t('home.goodMorning')}</div>
              <div style={{ fontSize: fdwMode ? 20 : 18, fontWeight: 700 }}>{displayName}</div>
            </div>
          </div>
          <Bell size={22} color="white" />
        </div>
      </div>
      <div style={{ padding: '0 16px 24px' }}>
        <BurnoutBanner score={burn.score} band={burn.band} reason={burn.reason} />
        <MoodCheckIn todayMood={todayMood} onLog={logMood} />

        <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{t('home.todayProgress')}</span>
            <span style={{ background: C.okBg, color: C.ok, fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>{done}/{tasks.length} done</span>
          </div>
          <div style={{ height: 6, background: '#EEF4F6', borderRadius: 3 }}>
            <div style={{ width: `${tasks.length > 0 ? (done / tasks.length) * 100 : 0}%`, height: '100%', background: `linear-gradient(90deg,${C.pri},${C.light})`, borderRadius: 3, transition: 'width 200ms ease' }} />
          </div>
          {members.length > 1 && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {members.slice(0, 4).map((m) => (
                <div key={m.id} style={{ width: 26, height: 26, borderRadius: 13, background: m.display_color, color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid white` }}>
                  {m.display_initials}
                </div>
              ))}
              <span style={{ fontSize: 11, color: C.sub, marginLeft: 4 }}>{members.length} on team</span>
            </div>
          )}
        </div>

        <div onClick={onSubsidyTap} style={{ background: `linear-gradient(135deg,${C.dark},${C.pri})`, borderRadius: 14, padding: '14px 16px', marginBottom: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>💰 S$1,100+/mo {t('home.subsidyHook')}</div>
            <div style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 }}>6 schemes for you</div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,.8)" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t('home.todayTasks')}</span>
          <span onClick={onTasksTap} style={{ fontSize: 13, color: C.pri, fontWeight: 600, cursor: 'pointer' }}>{t('home.seeAll')}</span>
        </div>
        {tasks.slice(0, 4).map((task) => {
          const m = members.find((x) => x.user_id === task.assigned_to);
          return (
            <TaskRow
              key={task.id}
              task={task}
              assigneeInitials={m?.display_initials || (user?.email?.slice(0, 2).toUpperCase() || 'YOU')}
              assigneeColor={m?.display_color}
              fdwMode={fdwMode}
              onToggle={toggleDone}
              onTap={() => onTaskTap(task)}
            />
          );
        })}
        {tasks.length === 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: 24, textAlign: 'center', color: C.sub, fontSize: 14 }}>
            No tasks yet. Add a discharge summary to get started.
          </div>
        )}
      </div>
    </div>
  );
}
