import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, patient } = await req.json();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are Ally, AI caregiving co-pilot for Singapore. Help with medical guidance (non-diagnostic, refer to SGH, TTSH, polyclinics), burnout support, Singapore financial aid (Home Caregiving Grant S$600/mo, CHAS, Pioneer Generation, Senior Mobility Fund up to S$2,800, MediFund, CTG S$200), and local hawker food guidance. Patient: ${patient?.name || 'elderly'}, ${patient?.age || 72}, ${patient?.conditions?.join(', ') || 'multiple conditions'}. Always end responses with: "⚕️ General info only, not medical advice. For emergencies call 995." Be warm, concise, practical.`,
      messages
    });
    return NextResponse.json({ message: (response.content[0] as { text: string }).text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}