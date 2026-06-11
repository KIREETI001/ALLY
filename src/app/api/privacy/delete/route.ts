// POST /api/privacy/delete — PDPA minimisation & erasure.
//
// Two scopes:
//   { scope: "raw_documents" } → wipes raw discharge text from all the user's
//     care plans while keeping the structured plan (data minimisation: the
//     transcription served its purpose; the source document need not persist).
//   { scope: "account_data" }  → deletes the user's care data (patients,
//     plans, tasks cascade). Auth account removal is a support flow for now.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`privdel:${user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Try again later.' }, { status: 429 });

  let scope: string;
  try {
    const body = await req.json();
    scope = body?.scope;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (scope === 'raw_documents') {
    const { error } = await supabase
      .from('care_plans')
      .update({ raw_discharge_text: null })
      .eq('owner_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from('consents').insert({
      user_id: user.id, purpose: 'erase_raw_documents', details: 'user-initiated',
    });
    return NextResponse.json({ ok: true, message: 'Original document text removed. Your structured care plans are kept.' });
  }

  if (scope === 'account_data') {
    // patients → care_plans → tasks/care_team/care_log cascade via FKs.
    const del1 = await supabase.from('patients').delete().eq('owner_id', user.id);
    const del2 = await supabase.from('mood_logs').delete().eq('user_id', user.id);
    if (del1.error || del2.error) {
      return NextResponse.json({ error: (del1.error || del2.error)!.message }, { status: 500 });
    }
    await supabase.from('consents').insert({
      user_id: user.id, purpose: 'erase_account_data', details: 'user-initiated',
    });
    return NextResponse.json({ ok: true, message: 'Your care data has been deleted.' });
  }

  return NextResponse.json({ error: 'scope must be "raw_documents" or "account_data".' }, { status: 400 });
}
