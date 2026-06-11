// POST /api/chat — Ally Chat v2 (streaming, context-grounded, language-aware).
//
// Changes from v1:
// - Streams tokens (no more 10-second blank waits).
// - Server fetches the user's real care context (profile language, patient,
//   active care plan, today's open tasks) instead of trusting the client.
// - Subsidy facts come from the verified rules module (single source of
//   truth, RULES_VERSION) — never hand-typed into the prompt again.
// - Safety contract: educate + signpost only; no diagnosis, no dosing —
//   the SaMD boundary applies to chat as much as to the parser.
// - Auth + rate limiting; cheaper Haiku tier (cost: see docs/strategy/STRATEGY.md §3c).

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import { schemeFactSheet, RULES_VERSION } from '@/lib/subsidies';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 4000;

const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  zh: 'Simplified Chinese (Mandarin)',
  ms: 'Bahasa Melayu',
  ta: 'Tamil',
  ph: 'Filipino (Tagalog)',
};

type InMsg = { role: 'user' | 'assistant'; content: string };

function validMessages(v: unknown): InMsg[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_MESSAGES) return null;
  const out: InMsg[] = [];
  for (const m of v) {
    const o = m as Record<string, unknown>;
    if ((o?.role !== 'user' && o?.role !== 'assistant') || typeof o?.content !== 'string') return null;
    const content = o.content.trim().slice(0, MAX_CONTENT_CHARS);
    if (!content) return null;
    out.push({ role: o.role, content });
  }
  if (out[out.length - 1].role !== 'user') return null;
  return out;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`chat:${user.id}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Message limit reached for now — please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const messages = validMessages((body as Record<string, unknown>)?.messages);
  if (!messages) return NextResponse.json({ error: 'Invalid messages.' }, { status: 400 });

  // ── Server-side context: never trust the client for care data ───────────
  const [{ data: profile }, { data: patients }] = await Promise.all([
    supabase.from('profiles').select('language, fdw_mode, full_name').eq('id', user.id).maybeSingle(),
    supabase.from('patients').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1),
  ]);
  const patient = patients?.[0] ?? null;

  let planContext = 'No active care plan yet.';
  if (patient) {
    const { data: plans } = await supabase
      .from('care_plans').select('id, diagnosis, diet, warnings, medications')
      .eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(1);
    const plan = plans?.[0];
    if (plan) {
      const { data: openTasks } = await supabase
        .from('tasks').select('title, type, scheduled_time, urgent')
        .eq('care_plan_id', plan.id).eq('done', false)
        .order('scheduled_time', { ascending: true }).limit(12);
      const meds = Array.isArray(plan.medications)
        ? (plan.medications as { name: string; timing: string }[]).map((m) => `${m.name} (${m.timing})`).join('; ')
        : 'none recorded';
      planContext = [
        `Diagnosis (as per discharge document): ${plan.diagnosis || 'not recorded'}`,
        `Diet: ${plan.diet || 'not recorded'}`,
        `Medications (transcribed from the document): ${meds}`,
        `Document warning signs: ${(plan.warnings as string[] | null)?.join(' | ') || 'none recorded'}`,
        `Open tasks today: ${openTasks?.map((t) => `${t.title} @ ${t.scheduled_time}${t.urgent ? ' (urgent)' : ''}`).join('; ') || 'none'}`,
      ].join('\n');
    }
  }

  const lang = LANGUAGE_NAME[profile?.language ?? 'en'] ?? 'English';
  const fdwMode = !!profile?.fdw_mode;

  const system = `You are Ally, the AI caregiving co-pilot for families in Singapore.

LANGUAGE: Respond in ${lang}.${fdwMode ? ' The user is a migrant domestic worker caregiver: use simple, step-by-step language and short sentences.' : ''}

SAFETY CONTRACT (non-negotiable — this product is regulated as a non-medical-device because it educates and signposts only):
- Never diagnose, never recommend or adjust medication doses or schedules, never override the discharge document.
- When asked about the care recipient's medications or instructions, refer to what THE DOCUMENT says (provided below) and remind the user to confirm changes with the clinic.
- Anything that sounds like an emergency or matches the document's warning signs → tell them to call 995 or go to A&E immediately, before anything else.
- For medical questions beyond general education: signpost to the polyclinic, the discharging hospital's helpline, or their GP.

CARE CONTEXT (server-verified, current):
Patient: ${patient ? `${patient.name}, ${patient.age ?? 'age unknown'}, conditions: ${(patient.conditions ?? []).join(', ') || 'not recorded'}` : 'not set up yet'}
${planContext}

SINGAPORE SUBSIDY FACTS (verified ${RULES_VERSION} — use ONLY these figures; for personalised amounts direct the user to the in-app Subsidy Navigator, and remind them to confirm with AIC):
${schemeFactSheet()}

STYLE: Warm, practical, concise (under 180 words unless steps are needed). Acknowledge caregiver stress when you hear it; suggest the mood check-in or a break when burnout shows. For local food questions, give hawker-realistic guidance consistent with the documented diet.

Always end with: "⚕️ General info only, not medical advice. For emergencies call 995."`;

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error('chat stream error:', err);
          controller.enqueue(encoder.encode('\n\n[Connection interrupted — please send that again.]'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('chat failed:', err);
    return NextResponse.json(
      { error: 'Ally is temporarily unavailable. For urgent help call 995 or your polyclinic.' },
      { status: 503 },
    );
  }
}
