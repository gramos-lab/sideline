import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface Body {
  club_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  cert_level?: string | null;
  age_groups: string[];
  priority_tier?: number;
  min_hours_week?: number;
  max_hours_week?: number;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.club_id || !body.full_name || !body.phone) {
    return NextResponse.json({ error: 'club_id, full_name, phone required' }, { status: 400 });
  }
  if (!Array.isArray(body.age_groups) || body.age_groups.length === 0) {
    return NextResponse.json({ error: 'age_groups required' }, { status: 400 });
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
    .insert({
      club_id: body.club_id,
      full_name: body.full_name,
      phone: body.phone,
      email: body.email ?? null,
      cert_level: body.cert_level ?? null,
      age_groups: body.age_groups,
      priority_tier: body.priority_tier ?? 2,
      min_hours_week: body.min_hours_week ?? 0,
      max_hours_week: body.max_hours_week ?? 20,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'phone already exists for this club' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, trainer: data });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const club_id = url.searchParams.get('club_id');
  if (!club_id) return NextResponse.json({ error: 'club_id required' }, { status: 400 });

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
    .select('*')
    .eq('club_id', club_id)
    .order('full_name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, trainers: data });
}
