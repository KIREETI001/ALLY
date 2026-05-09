'use client';

import { X } from 'lucide-react';
import { C } from '@/lib/theme';
import type { Task } from '@/lib/types';

interface TaskDetailModalProps {
  task: Task | null;
  fdwMode?: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
}

export default function TaskDetailModal({ task, fdwMode, onClose, onToggle }: TaskDetailModalProps) {
  if (!task) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: C.card, borderRadius: '22px 22px 0 0', maxHeight: '88%', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Task Detail</span>
          <X size={20} color={C.sub} onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: fdwMode ? 18 : 16, color: C.text, marginBottom: 12 }}>{task.title}</div>
          <div style={{ fontSize: fdwMode ? 14 : 12, color: C.sub, marginBottom: 14 }}>⏰ {task.scheduled_time}</div>

          {task.notes && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>Special Notes</div>
              <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.55 }}>{task.notes}</div>
            </div>
          )}

          {task.steps && task.steps.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, textTransform: 'uppercase' }}>Steps</div>
              {task.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: C.pri, color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: fdwMode ? 15 : 14, color: C.text, paddingTop: 3 }}>{s}</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              onToggle(task.id);
              onClose();
            }}
            style={{
              width: '100%',
              padding: '14px 0',
              background: C.pri,
              color: 'white',
              borderRadius: 14,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {task.done ? 'Mark Incomplete' : 'Mark Complete ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
