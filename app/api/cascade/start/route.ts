import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { startCascade } from '@/lib/cascade';

export const runtime = 'nodejs';

interface Body {
  assignment_id: string;
  reason?: string;
}

export async function POST(req: Request) {
  const { assignment_id, reason } = (await req.json()) as Body;
  if (!assignment_id) {
    return NextResponse.json({ error: 'assignment_id required' }, { status: 400 });
  }
  const db = adminClient();
  const result = await startCascade(db, {
    assignment_id,
    source: 'manual',
    reason: reason ?? null,
  });
  return NextResponse.json({ ok: true, ...result });
}
