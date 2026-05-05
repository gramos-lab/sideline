import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface PatchBody {
  full_name?: string;
  phone?: string;
  email?: string | null;
  cert_level?: string | null;
  age_groups?: string[];
  priority_tier?: number;
  min_hours_week?: number;
  max_hours_week?: number;
  active?: boolean;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  let db;
  try {
    db = adminClient();
  } catch (err) {
    return NextResponse.json(
      { error: 'supabase not configured', detail: String(err) },
      { status: 503 },
    );
  }
  const { data, error } = await db
    .from('trainers')
    .update(body)
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, trainer: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let db;
  try {
    db = adminClient();
  } catch (err) {
    return NextResponse.json(
      { error: 'supabase not configured', detail: String(err) },
      { status: 503 },
    );
  }
  const { error } = await db
    .from('trainers')
    .update({ active: false })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
