// Daily care digest — the WhatsApp-shaped coordination message.
//
// Channel strategy (docs/strategy/STRATEGY.md §4): WhatsApp is the rail; ~80% of SG
// uses it and it's the only channel that reaches MDWs without app installs.
// v1: this text is share-sheet/copy friendly so families can post it into
// their existing group today. The WABA worker (notifications table) sends it
// automatically later — same generator, idempotent by (plan, date).

import type { Task } from './types';

export interface DigestInput {
  patientName: string;
  date: Date;
  tasks: Pick<Task, 'title' | 'type' | 'scheduled_time' | 'done' | 'urgent' | 'assigned_to'>[];
  warnings: string[];
  memberNames?: Record<string, string>; // user_id → display name/initials
}

export function buildDailyDigest(d: DigestInput): string {
  const dateStr = d.date.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'short' });
  const open = d.tasks.filter((t) => !t.done);
  const done = d.tasks.filter((t) => t.done);

  const lines: string[] = [];
  lines.push(`🩺 *${d.patientName} — Care Plan, ${dateStr}*`);
  lines.push('');

  if (open.length === 0 && done.length === 0) {
    lines.push('No tasks scheduled today.');
  } else {
    if (open.length > 0) {
      lines.push('*To do today:*');
      for (const t of open) {
        const who = t.assigned_to && d.memberNames?.[t.assigned_to] ? ` — ${d.memberNames[t.assigned_to]}` : '';
        lines.push(`${t.urgent ? '❗' : '◻️'} ${t.scheduled_time} ${t.title}${who}`);
      }
      lines.push('');
    }
    if (done.length > 0) {
      lines.push(`✅ Done: ${done.map((t) => t.title).join(', ')}`);
      lines.push('');
    }
  }

  if (d.warnings.length > 0) {
    lines.push('*Go to A&E / call 995 if:*');
    for (const w of d.warnings.slice(0, 4)) lines.push(`⚠️ ${w}`);
    lines.push('');
  }

  lines.push('_Sent via ALLY — reply DONE <task> after finishing._');
  return lines.join('\n');
}
