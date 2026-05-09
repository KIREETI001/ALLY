'use client';

import { Check, Clock } from 'lucide-react';
import { C, typeStyle } from '@/lib/theme';
import type { Task } from '@/lib/types';
import Pill from './Pill';
import Avatar from './Avatar';

interface TaskRowProps {
  task: Task;
  assigneeInitials?: string;
  assigneeColor?: string;
  fdwMode?: boolean;
  onToggle: (id: string) => void;
  onTap: () => void;
}

export default function TaskRow({ task, assigneeInitials = 'YOU', assigneeColor, fdwMode, onToggle, onTap }: TaskRowProps) {
  const ts = typeStyle(task.type);
  const titleSize = fdwMode ? 16 : 14;
  const metaSize = fdwMode ? 13 : 12;

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 13,
        padding: fdwMode ? '14px 16px' : '12px 14px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        cursor: 'pointer',
        opacity: task.done ? 0.65 : 1,
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        style={{
          width: fdwMode ? 32 : 27,
          height: fdwMode ? 32 : 27,
          borderRadius: 16,
          border: task.done ? 'none' : `2px solid ${C.pri}`,
          background: task.done ? C.pri : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {task.done && <Check size={fdwMode ? 16 : 13} color="white" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1 }} onClick={onTap}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            color: C.text,
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <Clock size={11} color={C.sub} />
          <span style={{ fontSize: metaSize, color: C.sub }}>{task.scheduled_time}</span>
          <Pill label={task.type} bg={ts.bg} tc={ts.tc} />
          {task.urgent && <Pill label="URGENT" bg={C.errBg} tc={C.err} />}
        </div>
      </div>
      <Avatar initials={assigneeInitials} color={assigneeColor} />
    </div>
  );
}
