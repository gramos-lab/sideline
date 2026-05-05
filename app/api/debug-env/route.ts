import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const svc = process.env.SUPABASE_SERVICE_KEY ?? '';

  const out: Record<string, unknown> = {
    url_len: url.length,
    url_head: url.slice(0, 30),
    anon_len: anon.length,
    anon_head: anon.slice(0, 12),
    svc_len: svc.length,
    svc_head: svc.slice(0, 12),
  };

  if (url && svc) {
    try {
      const db = createClient(url, svc, { auth: { persistSession: false } });
      const r = await db.from('clubs').select('id, name, slug').limit(5);
      out.svc_query = { error: r.error?.message ?? null, count: r.data?.length ?? 0, sample: r.data ?? [] };
    } catch (err) {
      out.svc_query_err = String(err);
    }
  } else {
    out.svc_query = 'skipped (missing url or svc)';
  }

  return NextResponse.json(out);
}
