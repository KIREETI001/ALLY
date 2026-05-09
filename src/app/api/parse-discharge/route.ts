import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Singapore hospital discharge parser. Return ONLY valid JSON, no markdown:
{"diagnosis":"string","diet":"string","warnings":["string"],"medications":[{"name":"string","timing":"string","notes":"string"}],"tasks":[{"title":"string","type":"Medication|Wound Care|Physio|Monitoring|Meals","time":"string","notes":"string","urgent":false}]}`,
      messages: [{ role: 'user', content: `Parse this discharge summary:\n\n${text}` }]
    });
    const raw = (message.content[0] as { text: string }).text;
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
  }
}