// POST /api/parse-discharge — Parser v2.
//
// Accepts pasted text OR an uploaded photo/PDF of a discharge summary and
// returns a structured ParsedDischarge with per-item provenance + confidence.
//
// Regulatory contract (HSA GL-07-R2, Jul 2025 — see docs/strategy/STRATEGY.md §2):
// TRANSCRIBE AND ORGANISE ONLY. The model must never invent dosages, add
// schedules not in the document, or produce new clinical recommendations.
// Structured output is enforced via tool-use, then re-validated server-side.
//
// Security: authenticated users only, per-user rate limit, honest errors —
// the silent demo-data fallback is gone by design.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import type { ParsedDischarge, TaskType } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6'; // accuracy-critical path; chat uses the cheaper Haiku tier
const MAX_TEXT_CHARS = 30_000;
const MAX_FILE_BASE64_CHARS = 8_000_000; // ~6MB binary; client downscales photos first
const ALLOWED_MEDIA = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
const TASK_TYPES: TaskType[] = ['Medication', 'Wound Care', 'Physio', 'Monitoring', 'Meals', 'Other'];

const PARSE_TOOL: Anthropic.Tool = {
  name: 'record_parsed_discharge',
  description: 'Record the structured transcription of the discharge document.',
  input_schema: {
    type: 'object',
    properties: {
      diagnosis: { type: 'string', description: 'Diagnosis exactly as stated in the document. Empty string if absent.' },
      diet: { type: 'string', description: 'Diet instructions as stated. Empty string if absent.' },
      warnings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            source_quote: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'low'] },
          },
          required: ['text', 'source_quote', 'confidence'],
        },
      },
      medications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Drug name + strength exactly as written' },
            timing: { type: 'string', description: 'Timing exactly as written, e.g. "Twice daily with meals"' },
            notes: { type: 'string' },
            source_quote: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'low'] },
          },
          required: ['name', 'timing', 'source_quote', 'confidence'],
        },
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: { type: 'string', enum: TASK_TYPES },
            time: { type: 'string', description: 'Time as stated or clearly implied (e.g. "Morning"). Never invent clock times.' },
            notes: { type: 'string' },
            urgent: { type: 'boolean' },
            source_quote: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'low'] },
          },
          required: ['title', 'type', 'time', 'urgent', 'source_quote', 'confidence'],
        },
      },
      unreadable_sections: {
        type: 'array',
        items: { type: 'string' },
        description: 'Sections that exist but could not be read confidently (e.g. blurry photo region).',
      },
    },
    required: ['diagnosis', 'diet', 'warnings', 'medications', 'tasks'],
  },
};

const SYSTEM = `You transcribe Singapore hospital discharge documents into structured data for a family caregiving app.

IRON RULES — this tool is regulated as a non-medical-device because it only transcribes:
1. Extract ONLY information present in the document. Never add, infer, or adjust dosages, frequencies, or clinical advice.
2. Every warning, medication and task MUST include source_quote: the verbatim document snippet it came from.
3. If a detail is ambiguous, partially legible, or you are not certain, set confidence to "low" — never guess silently.
4. Do not convert vague timings into clock times. "Twice daily" stays "Twice daily"; use the document's words.
5. Tasks are the actionable items the document itself prescribes (medications to give, dressing changes, exercises, monitoring, follow-up appointments). Mark urgent=true only when the document marks something urgent/critical.
6. If parts of the document are unreadable, list them in unreadable_sections instead of guessing.
Call record_parsed_discharge exactly once.`;

type Body = {
  text?: string;
  fileBase64?: string;
  fileMediaType?: (typeof ALLOWED_MEDIA)[number];
};

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function validateBody(b: unknown): { ok: true; body: Body } | { ok: false; error: string } {
  if (typeof b !== 'object' || b === null) return { ok: false, error: 'Invalid JSON body.' };
  const body = b as Body;
  const hasText = typeof body.text === 'string' && body.text.trim().length > 0;
  const hasFile = typeof body.fileBase64 === 'string' && body.fileBase64.length > 0;
  if (!hasText && !hasFile) return { ok: false, error: 'Provide discharge text or an uploaded file.' };
  if (hasText && body.text!.length > MAX_TEXT_CHARS) return { ok: false, error: 'Text too long.' };
  if (hasFile) {
    if (body.fileBase64!.length > MAX_FILE_BASE64_CHARS) return { ok: false, error: 'File too large. Please upload a smaller photo or PDF.' };
    if (!body.fileMediaType || !ALLOWED_MEDIA.includes(body.fileMediaType)) return { ok: false, error: 'Unsupported file type. Use JPEG, PNG, WebP or PDF.' };
  }
  return { ok: true, body };
}

// Server-side re-validation of the model's tool output. Tool schemas constrain
// shape, not honesty — clamp everything defensively.
function sanitize(raw: Record<string, unknown>): ParsedDischarge {
  const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
  const conf = (v: unknown): 'high' | 'low' => (v === 'high' ? 'high' : 'low');
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);

  return {
    diagnosis: str(raw.diagnosis),
    diet: str(raw.diet),
    warnings: arr(raw.warnings).slice(0, 20).map((w) => ({
      text: str((w as Record<string, unknown>)?.text),
      source_quote: str((w as Record<string, unknown>)?.source_quote),
      confidence: conf((w as Record<string, unknown>)?.confidence),
    })).filter((w) => w.text),
    medications: arr(raw.medications).slice(0, 30).map((m) => {
      const o = m as Record<string, unknown>;
      return {
        name: str(o?.name, 200),
        timing: str(o?.timing, 200),
        notes: str(o?.notes, 300) || undefined,
        source_quote: str(o?.source_quote),
        confidence: conf(o?.confidence),
      };
    }).filter((m) => m.name),
    tasks: arr(raw.tasks).slice(0, 40).map((t) => {
      const o = t as Record<string, unknown>;
      const type = TASK_TYPES.includes(o?.type as TaskType) ? (o!.type as TaskType) : 'Other';
      return {
        title: str(o?.title, 200),
        type,
        time: str(o?.time, 100),
        notes: str(o?.notes, 300) || undefined,
        urgent: o?.urgent === true,
        source_quote: str(o?.source_quote),
        confidence: conf(o?.confidence),
      };
    }).filter((t) => t.title),
    unreadable_sections: arr(raw.unreadable_sections).slice(0, 10).map((s) => str(s, 200)).filter(Boolean),
  };
}

export async function POST(req: Request) {
  // 1. Auth — discharge documents are sensitive health data (PDPA).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  // 2. Rate limit: 10 parses/hour/user.
  const rl = rateLimit(`parse:${user.id}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many parse requests. Try again in ~${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  // 3. Validate input.
  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return badRequest('Invalid JSON.');
  }
  const v = validateBody(parsedBody);
  if (!v.ok) return badRequest(v.error);
  const { text, fileBase64, fileMediaType } = v.body;

  // 4. Record consent for processing this document (PDPA accountability).
  //    Best-effort: missing table must not block care.
  try {
    await supabase.from('consents').insert({
      user_id: user.id,
      purpose: 'parse_discharge_document',
      details: fileBase64 ? `file:${fileMediaType}` : 'pasted_text',
    });
  } catch { /* table may not exist yet in older environments */ }

  // 5. Build content blocks (text, image, or PDF document).
  const content: Anthropic.ContentBlockParam[] = [];
  if (fileBase64 && fileMediaType) {
    if (fileMediaType === 'application/pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
      });
    } else {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: fileMediaType, data: fileBase64 },
      });
    }
    content.push({ type: 'text', text: 'Transcribe this discharge document into the structured format. Remember: transcribe only, flag low confidence, never guess.' });
  } else {
    content.push({ type: 'text', text: `Transcribe this discharge summary into the structured format:\n\n${text}` });
  }

  // 6. Call Claude with forced tool use; honest errors — no demo fallback.
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      tools: [PARSE_TOOL],
      tool_choice: { type: 'tool', name: 'record_parsed_discharge' },
      messages: [{ role: 'user', content }],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'The document could not be parsed. Please try a clearer photo or paste the text.' }, { status: 422 });
    }

    const parsed = sanitize(toolUse.input as Record<string, unknown>);
    if (parsed.medications.length === 0 && parsed.tasks.length === 0 && !parsed.diagnosis) {
      return NextResponse.json(
        { error: 'No care instructions were found in this document. Is it a discharge summary?', unreadable: parsed.unreadable_sections ?? [] },
        { status: 422 },
      );
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    console.error('parse-discharge failed:', err);
    return NextResponse.json(
      { error: 'Parsing is temporarily unavailable. Your document was NOT saved. Please try again shortly.' },
      { status: 503 },
    );
  }
}
