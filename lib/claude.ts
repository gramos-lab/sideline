import Anthropic from '@anthropic-ai/sdk';
import type { Assignment, OutboundMessage, Trainer } from './types';

const YES_RE = /^(yes|y|yep|yup|yeah|k|ok|okay|got it|sure|confirmed|👍)\.?$/i;
const NO_RE = /^(no|n|nope|can'?t|cannot|negative)\.?$/i;
const CALLOUT_RE = /\b(can'?t make|won'?t make|sick|stuck|emergency|out of town|covid|fever|family)\b/i;

export type Intent =
  | 'callout'
  | 'availability'
  | 'confirmation'
  | 'question'
  | 'unclear';

export interface ClassifyResult {
  intent: Intent;
  confidence: number;
  parsed: Record<string, unknown>;
}

export interface ClassifyContext {
  trainer: Trainer | null;
  recentOutbound: OutboundMessage | null;
  upcomingAssignments: Assignment[];
}

export async function classifyIntent(
  message: string,
  context: ClassifyContext,
): Promise<ClassifyResult> {
  const trimmed = message.trim();

  // 1) keyword fast-path
  if (YES_RE.test(trimmed) && context.recentOutbound) {
    return { intent: 'confirmation', confidence: 1, parsed: { value: 'yes' } };
  }
  if (NO_RE.test(trimmed) && context.recentOutbound) {
    return { intent: 'callout', confidence: 0.95, parsed: { value: 'no' } };
  }
  if (CALLOUT_RE.test(trimmed)) {
    return {
      intent: 'callout',
      confidence: 0.85,
      parsed: { reason: trimmed.slice(0, 200) },
    };
  }

  // 2) LLM fallback
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { intent: 'unclear', confidence: 0, parsed: {} };
  }

  const client = new Anthropic({ apiKey });

  const prompt = `Classify this text from a youth soccer trainer to the club's scheduling number.

Trainer: ${context.trainer?.full_name ?? 'unknown'}
Their assigned sessions in next 48h: ${JSON.stringify(context.upcomingAssignments.slice(0, 5))}
Recent outbound to them (if any): ${JSON.stringify(context.recentOutbound ?? null)}

Their message: "${trimmed}"

Return JSON only:
{
  "intent": "callout" | "availability" | "confirmation" | "question" | "unclear",
  "confidence": 0.0 to 1.0,
  "parsed": {
    "session_reference": string | null,
    "running_late": boolean,
    "reason": string | null,
    "availability_changes": []
  }
}`;

  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = resp.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('');
    const json = extractJson(text);
    if (!json) return { intent: 'unclear', confidence: 0.3, parsed: { raw: text } };
    return {
      intent: (json.intent as Intent) ?? 'unclear',
      confidence: typeof json.confidence === 'number' ? json.confidence : 0.5,
      parsed: (json.parsed as Record<string, unknown>) ?? {},
    };
  } catch (err) {
    console.error('[claude] classify failed', err);
    return { intent: 'unclear', confidence: 0, parsed: { error: String(err) } };
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
