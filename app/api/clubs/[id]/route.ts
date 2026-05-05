import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface PatchBody {
  name?: string;
  slug?: string;
  short?: string | null;
  color?: string;
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

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.slug !== undefined) update.slug = body.slug.trim().toLowerCase();
  if (body.short !== undefined) update.short = body.short?.toUpperCase().slice(0, 4) ?? null;
  if (body.color !== undefined) update.color = body.color;
  if (body.active !== undefined) update.active = body.active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data, error } = await db
    .from('clubs')
    .update(update)
    .eq('id', params.id)
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
  // Soft-delete: hide rather than cascade away sessions/trainers.
  const { error } = await db.from('clubs').update({ active: false }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
