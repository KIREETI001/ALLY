// POST /api/claims — build a deterministic claim bundle from selected expenses.
//
// No LLM in this path (see lib/claims.ts header). Server re-fetches every row
// under RLS — the client supplies only IDs and a destination, never amounts.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import { buildClaimBundle } from '@/lib/claims';
import type { Expense } from '@/lib/types';

const DESTINATIONS = ['insurer', 'medisave', 'employer', 'other'] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`claims:${user.id}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });

  let body: { expenseIds?: unknown; destination?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const expenseIds = Array.isArray(body.expenseIds)
    ? body.expenseIds.filter((v): v is string => typeof v === 'string').slice(0, 50)
    : [];
  if (expenseIds.length === 0) return NextResponse.json({ error: 'Select at least one expense.' }, { status: 400 });
  const destination = DESTINATIONS.includes(body.destination as (typeof DESTINATIONS)[number])
    ? (body.destination as (typeof DESTINATIONS)[number])
    : 'insurer';

  // Re-fetch everything server-side under RLS — IDs in, verified rows out.
  const { data: expenses, error: eErr } = await supabase
    .from('expenses').select('*').in('id', expenseIds);
  if (eErr || !expenses || expenses.length === 0) {
    return NextResponse.json({ error: 'Those expenses could not be loaded.' }, { status: 404 });
  }
  const planIds = Array.from(new Set((expenses as Expense[]).map((e) => e.care_plan_id)));
  if (planIds.length !== 1) {
    return NextResponse.json({ error: 'All expenses in a bundle must belong to one care plan.' }, { status: 400 });
  }

  const [{ data: plan }, { data: profile }] = await Promise.all([
    supabase.from('care_plans').select('id, diagnosis, patient_id').eq('id', planIds[0]).maybeSingle(),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
  ]);
  if (!plan) return NextResponse.json({ error: 'Care plan not found.' }, { status: 404 });
  const { data: patient } = await supabase
    .from('patients').select('name').eq('id', plan.patient_id).maybeSingle();

  const { text, totalCents } = buildClaimBundle({
    patientName: patient?.name ?? 'Care recipient',
    diagnosis: (plan.diagnosis as string | null) ?? null,
    destination,
    expenses: expenses as Expense[],
    preparedBy: profile?.full_name || profile?.email || user.email || 'Caregiver',
    generatedAt: new Date(),
  });

  const { data: bundle, error: bErr } = await supabase
    .from('claim_bundles')
    .insert({
      care_plan_id: planIds[0],
      created_by: user.id,
      destination,
      expense_ids: expenseIds,
      total_cents: totalCents,
      bundle_text: text,
    })
    .select('id, status, created_at')
    .single();
  if (bErr || !bundle) return NextResponse.json({ error: bErr?.message || 'Could not save the bundle.' }, { status: 500 });

  return NextResponse.json({ bundle: { ...bundle, bundle_text: text, total_cents: totalCents } });
}
