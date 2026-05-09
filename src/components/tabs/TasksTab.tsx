'use client';

import { C } from '@/lib/theme';
import { useApp } from '@/context/AppContext';
import { useT } from '@/lib/i18n';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCareTeam } from '@/lib/hooks/useCareTeam';
import TaskRow from '@/components/TaskRow';
import type { Task } from '@/lib/types';

export default function TasksTab({ onTaskTap }: { onTaskTap: (t: Task) => void }) {
  const { user, currentCarePlan, fdwMode } = useApp();
  const t = useT();
  const { tasks, toggleDone } = useTasks(currentCarePlan?.id || null);
  const { members } = useCareTeam(currentCarePlan?.id || null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 20px', color: 'white' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{t('tasks.title')}</div>
      </div>
      <div style={{ padding: '14px 16px 80px' }}>
        {tasks.length === 0 ? (
          <div style={{ background: C.card, borderRadius: 14, padding: 24, textAlign: 'center', color: C.sub, fontSize: 14 }}>
            No tasks yet.
          </div>
        ) : (
          tasks.map((task) => {
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
          })
        )}
      </div>
    </div>
  );
}
