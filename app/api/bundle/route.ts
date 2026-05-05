import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { buildAllClubsBundle, buildClubBundle } from '@/lib/bundle-loader';
import { ALL_CLUBS_SLUG } from '@/lib/dev-fixtures';
import type { Club } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('club');
  if (!slug) return NextResponse.json({ error: 'club required' }, { status: 400 });

  let db;
  try {
    db = adminClient();
  } catch (err) {
    return NextResponse.json(
      { error: 'supabase not configured', detail: String(err) },
      { status: 503 },
    );
  }

  const { data: clubsRaw, error } = await db
    .from('clubs')
    .select('*')
    .eq('active', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allClubs = (clubsRaw ?? []) as Club[];

  if (slug === ALL_CLUBS_SLUG) {
    const bundle = await buildAllClubsBundle(db, allClubs);
    return NextResponse.json({ ok: true, bundle });
  }

  const club = allClubs.find((c) => c.slug === slug);
  if (!club) return NextResponse.json({ error: 'club not found' }, { status: 404 });

  const bundle = await buildClubBundle(db, club.id, allClubs);
  return NextResponse.json({ ok: true, bundle });
}
