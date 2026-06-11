// GET /api/privacy/export — PDPA data portability.
// Returns everything ALLY holds about the signed-in user as JSON.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`export:${user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Try again later.' }, { status: 429 });

  const [profile, patients, plans, moods, consents] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('patients').select('*').eq('owner_id', user.id),
    supabase.from('care_plans').select('*').eq('owner_id', user.id),
    supabase.from('mood_logs').select('*').eq('user_id', user.id),
    supabase.from('consents').select('*').eq('user_id', user.id),
  ]);

  // Tasks + care log per plan (RLS already scopes these to the user).
  const planIds = (plans.data ?? []).map((p) => p.id);
  const tasks = planIds.length
    ? await supabase.from('tasks').select('*').in('care_plan_id', planIds)
    : { data: [] };
  const careLog = planIds.length
    ? await supabase.from('care_log').select('*').in('care_plan_id', planIds)
    : { data: [] };

  return NextResponse.json(
    {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile: profile.data ?? null,
      patients: patients.data ?? [],
      care_plans: plans.data ?? [],
      tasks: tasks.data ?? [],
      care_log: careLog.data ?? [],
      mood_logs: moods.data ?? [],
      consents: consents.data ?? [],
    },
    { headers: { 'Content-Disposition': 'attachment; filename="ally-data-export.json"' } },
  );
}
