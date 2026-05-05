import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { sendNextWave } from '@/lib/cascade';
import { sendQuoMessage } from '@/lib/quo';

export const runtime = 'nodejs';

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminClient();

  // 1) Cascade waves due
  const { data: settings } = await db.from('system_settings').select('*').eq('id', 1).single();
  const waitMin = settings?.wave_wait_minutes ?? 4;
  const cutoff = new Date(Date.now() - waitMin * 60 * 1000).toISOString();
  const { data: due } = await db
    .from('cascade_state')
    .select('id')
    .eq('status', 'active')
    .lt('last_wave_sent_at', cutoff);

  let waves = 0;
  for (const c of due ?? []) {
    try {
      const r = await sendNextWave(db, c.id);
      waves += r.sent;
    } catch (err) {
      console.error('[cron] cascade wave failed', err);
    }
  }

  // 2) Send approved outbound messages
  const { data: approved } = await db
    .from('outbound_messages')
    .select('id, to_phone, body')
    .eq('status', 'approved')
    .is('sent_at', null)
    .limit(50);

  let delivered = 0;
  for (const m of approved ?? []) {
    try {
      await sendQuoMessage(m.to_phone, m.body);
      await db
        .from('outbound_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', m.id);
      delivered++;
    } catch (err) {
      console.error('[cron] send failed', err);
      await db.from('outbound_messages').update({ status: 'failed' }).eq('id', m.id);
    }
  }

  return NextResponse.json({ ok: true, waves, delivered });
}
