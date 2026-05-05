import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { resolveCascadeWithYes } from '@/lib/cascade';

export const runtime = 'nodejs';

interface Body {
  trainer_id: string;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { trainer_id } = (await req.json()) as Body;
  if (!trainer_id) {
    return NextResponse.json({ error: 'trainer_id required' }, { status: 400 });
  }

  const db = adminClient();
  const { data: cascade } = await db
    .from('cascade_state')
    .select('callout_id')
    .eq('id', params.id)
    .single();
  if (!cascade) return NextResponse.json({ error: 'cascade not found' }, { status: 404 });

  await resolveCascadeWithYes(db, { callout_id: cascade.callout_id, trainer_id });
  return NextResponse.json({ ok: true });
}
