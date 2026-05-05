import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface Body {
  name: string;
  slug: string;
  short?: string;
  color?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.name?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
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
    .from('clubs')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim().toLowerCase(),
      color: body.color ?? '#1E40AF',
      short: body.short?.toUpperCase().slice(0, 4) ?? null,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, club: data });
}

export async function GET() {
  let db;
  try {
    db = adminClient();
  } catch (err) {
    return NextResponse.json(
      { error: 'supabase not configured', detail: String(err) },
      { status: 503 },
    );
  }
  const { data, error } = await db.from('clubs').select('*').eq('active', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, clubs: data });
}
