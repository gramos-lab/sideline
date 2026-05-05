import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import type { AssignmentStatus } from '@/lib/types';

export const runtime = 'nodejs';

interface Body {
  status?: AssignmentStatus;
  trainer_id?: string;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Body;
  const update: Record<string, string> = {};
  if (body.status) update.status = body.status;
  if (body.trainer_id) update.trainer_id = body.trainer_id;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await db
    .from('assignments')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, assignment: data });
}
