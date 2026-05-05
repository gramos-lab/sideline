import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface PatchBody {
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  age_groups?: string[];
  program_name?: string;
  session_type?: 'practice' | 'intramural' | 'tryout' | 'game' | 'camp' | 'clinic';
  required_cert_level?: string | null;
  notes?: string | null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (
    body.start_time &&
    body.end_time &&
    body.start_time >= body.end_time
  ) {
    return NextResponse.json({ error: 'start must be before end' }, { status: 400 });
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
    .from('sessions')
    .update(body)
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, session: data });
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
  const { error } = await db.from('sessions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
