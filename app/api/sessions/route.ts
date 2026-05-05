import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface Body {
  club_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_groups: string[];
  program_name: string;
  session_type: 'practice' | 'intramural' | 'tryout' | 'game' | 'camp' | 'clinic';
  required_cert_level?: string | null;
  notes?: string | null;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  for (const f of [
    'club_id',
    'date',
    'start_time',
    'end_time',
    'location',
    'program_name',
    'session_type',
  ] as const) {
    if (!body[f]) return NextResponse.json({ error: `${f} required` }, { status: 400 });
  }
  if (!Array.isArray(body.age_groups) || body.age_groups.length === 0) {
    return NextResponse.json({ error: 'age_groups required' }, { status: 400 });
  }
  if (body.start_time >= body.end_time) {
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
    .insert({
      club_id: body.club_id,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location,
      age_groups: body.age_groups,
      program_name: body.program_name,
      session_type: body.session_type,
      required_cert_level: body.required_cert_level ?? null,
      notes: body.notes ?? null,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, session: data });
}
