// GET /api/digest — today's WhatsApp-shaped care digest for the user's
// active care plan. v1 is pull-based (copy/share into the family group);
// the WABA worker will push the identical payload later (idempotent by
// plan+date via the notifications table).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import { buildDailyDigest } from '@/lib/digest';
import type { Task } from '@/lib/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`digest:${user.id}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Try again later.' }, { status: 429 });

  const { data: patients } = await supabase
    .from('patients').select('id, name')
    .eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1);
  const patient = patients?.[0];
  if (!patient) return NextResponse.json({ error: 'No patient set up yet.' }, { status: 404 });

  const { data: plans } = await supabase
    .from('care_plans').select('id, warnings')
    .eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(1);
  const plan = plans?.[0];
  if (!plan) return NextResponse.json({ error: 'No care plan yet.' }, { status: 404 });

  const [{ data: tasks }, { data: team }] = await Promise.all([
    supabase.from('tasks')
      .select('title, type, scheduled_time, done, urgent, assigned_to')
      .eq('care_plan_id', plan.id).order('scheduled_time', { ascending: true }),
    supabase.from('care_team')
      .select('user_id, display_initials')
      .eq('care_plan_id', plan.id),
  ]);

  const memberNames: Record<string, string> = {};
  for (const m of team ?? []) memberNames[m.user_id] = m.display_initials;

  const digest = buildDailyDigest({
    patientName: patient.name,
    date: new Date(),
    tasks: (tasks ?? []) as Pick<Task, 'title' | 'type' | 'scheduled_time' | 'done' | 'urgent' | 'assigned_to'>[],
    warnings: (plan.warnings as string[] | null) ?? [],
    memberNames,
  });

  return NextResponse.json({ digest });
}
