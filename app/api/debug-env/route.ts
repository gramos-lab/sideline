import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const svc = process.env.SUPABASE_SERVICE_KEY ?? '';

  const db = createClient(url, svc, { auth: { persistSession: false } });

  const a = await db.from('clubs').select('*');
  const b = await db.from('clubs').select('*').eq('active', true);
  const c = await db.from('clubs').select('*').eq('active', true).order('name');

  return NextResponse.json({
    no_filter: { error: a.error?.message ?? null, count: a.data?.length ?? 0, rows: a.data ?? [] },
    active_only: { error: b.error?.message ?? null, count: b.data?.length ?? 0 },
    active_ordered: { error: c.error?.message ?? null, count: c.data?.length ?? 0 },
  });
}
