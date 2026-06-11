// POST /api/parse-receipt — receipt snap → structured expense.
//
// Same contract as the discharge parser: TRANSCRIBE ONLY, provenance,
// confidence flags, tool-enforced output, server-side re-validation,
// auth + rate limit, honest errors. Amounts are integer cents — the model
// is instructed never to compute or "fix" totals, only transcribe them.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/ratelimit';
import type { ParsedReceipt, ExpenseCategory } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6'; // money figures: accuracy over cost
const MAX_TEXT_CHARS = 10_000;
const MAX_FILE_BASE64_CHARS = 8_000_000;
const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const CATEGORIES: ExpenseCategory[] = ['Clinic', 'Pharmacy', 'Equipment', 'Groceries', 'Transport', 'Helper', 'Other'];

const RECEIPT_TOOL: Anthropic.Tool = {
  name: 'record_parsed_receipt',
  description: 'Record the structured transcription of a purchase receipt or bill.',
  input_schema: {
    type: 'object',
    properties: {
      merchant: { type: 'string', description: 'Merchant/clinic/pharmacy name as printed.' },
      expense_date: { type: 'string', description: 'Date as printed (YYYY-MM-DD if unambiguous, else as written). Empty if absent.' },
      total_cents: { type: 'integer', description: 'Final total payable, in cents, exactly as printed. Never recompute from line items.' },
      currency: { type: 'string', description: 'ISO code, e.g. SGD. Default SGD if not printed.' },
      category: { type: 'string', enum: CATEGORIES, description: 'Best-fit eldercare expense category.' },
      line_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            amount_cents: { type: 'integer' },
          },
          required: ['description', 'amount_cents'],
        },
        description: 'Up to 15 items as printed. Skip if illegible — never guess.',
      },
      source_quote: { type: 'string', description: 'Verbatim total line from the receipt, e.g. "TOTAL  $42.80".' },
      confidence: { type: 'string', enum: ['high', 'low'], description: '"low" if the total or merchant was hard to read.' },
    },
    required: ['merchant', 'expense_date', 'total_cents', 'currency', 'category', 'source_quote', 'confidence'],
  },
};

const SYSTEM = `You transcribe purchase receipts and bills for a Singapore family caregiving expense tracker.

IRON RULES:
1. Transcribe ONLY what the receipt shows. Never infer, recompute, or correct amounts — if the printed total disagrees with line items, transcribe the printed total and set confidence "low".
2. total_cents must be the FINAL payable amount (after GST/discounts) in cents.
3. source_quote must be the verbatim total line.
4. If the image is not a receipt/bill, set merchant to "" and confidence "low".
Call record_parsed_receipt exactly once.`;

function sanitize(raw: Record<string, unknown>): ParsedReceipt {
  const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
  const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);
  const cat = CATEGORIES.includes(raw.category as ExpenseCategory) ? (raw.category as ExpenseCategory) : 'Other';
  const items = Array.isArray(raw.line_items) ? raw.line_items : [];
  return {
    merchant: str(raw.merchant, 120),
    expense_date: str(raw.expense_date, 40),
    total_cents: int(raw.total_cents),
    currency: (str(raw.currency, 3) || 'SGD').toUpperCase(),
    category: cat,
    line_items: items.slice(0, 15).map((li) => {
      const o = li as Record<string, unknown>;
      return { description: str(o?.description, 120), amount_cents: int(o?.amount_cents) };
    }).filter((li) => li.description),
    source_quote: str(raw.source_quote, 200),
    confidence: raw.confidence === 'high' ? 'high' : 'low',
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const rl = rateLimit(`receipt:${user.id}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many receipt scans — try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: { text?: string; fileBase64?: string; fileMediaType?: (typeof ALLOWED_MEDIA)[number] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const hasText = typeof body.text === 'string' && body.text.trim().length > 0;
  const hasFile = typeof body.fileBase64 === 'string' && body.fileBase64.length > 0;
  if (!hasText && !hasFile) return NextResponse.json({ error: 'Provide receipt text or a photo.' }, { status: 400 });
  if (hasText && body.text!.length > MAX_TEXT_CHARS) return NextResponse.json({ error: 'Text too long.' }, { status: 400 });
  if (hasFile) {
    if (body.fileBase64!.length > MAX_FILE_BASE64_CHARS) return NextResponse.json({ error: 'File too large.' }, { status: 400 });
    if (!body.fileMediaType || !ALLOWED_MEDIA.includes(body.fileMediaType)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP or PDF.' }, { status: 400 });
    }
  }

  const content: Anthropic.ContentBlockParam[] = [];
  if (hasFile) {
    if (body.fileMediaType === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64! } });
    } else {
      content.push({ type: 'image', source: { type: 'base64', media_type: body.fileMediaType!, data: body.fileBase64! } });
    }
    content.push({ type: 'text', text: 'Transcribe this receipt. Transcribe only — never recompute amounts.' });
  } else {
    content.push({ type: 'text', text: `Transcribe this receipt:\n\n${body.text}` });
  }

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      tools: [RECEIPT_TOOL],
      tool_choice: { type: 'tool', name: 'record_parsed_receipt' },
      messages: [{ role: 'user', content }],
    });

    const toolUse = message.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Could not read this receipt. Try a clearer photo.' }, { status: 422 });
    }
    const parsed = sanitize(toolUse.input as Record<string, unknown>);
    if (!parsed.merchant || parsed.total_cents <= 0) {
      return NextResponse.json({ error: 'No merchant/total found — is this a receipt? Try again or enter manually.' }, { status: 422 });
    }
    return NextResponse.json({ parsed });
  } catch (err) {
    console.error('parse-receipt failed:', err);
    return NextResponse.json({ error: 'Receipt scanning is temporarily unavailable. Enter the expense manually.' }, { status: 503 });
  }
}
