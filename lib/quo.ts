export interface QuoSendResult {
  messageId: string;
}

export interface QuoInbound {
  fromPhone: string;
  body: string;
  receivedAt: Date;
}

const QUO_API_BASE = process.env.QUO_API_BASE ?? 'https://api.quo.example/v1';

export async function sendQuoMessage(
  toPhone: string,
  body: string,
): Promise<QuoSendResult> {
  const apiKey = process.env.QUO_API_KEY;

  // TODO: confirm with Quo support — endpoint shape and auth header are stubbed
  // until the integration ticket comes back. We log and return a fake id so the
  // rest of the pipeline can be exercised end-to-end without live texts.
  if (!apiKey) {
    console.warn('[quo] QUO_API_KEY not set, stubbing send', { toPhone, body });
    return { messageId: `stub-${Date.now()}` };
  }

  try {
    const res = await fetch(`${QUO_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ to: toPhone, body }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Quo send failed ${res.status}: ${txt}`);
    }
    const json = (await res.json()) as { id?: string; message_id?: string };
    return { messageId: json.id ?? json.message_id ?? `quo-${Date.now()}` };
  } catch (err) {
    console.error('[quo] send error', err);
    throw err;
  }
}

export function parseQuoWebhook(payload: unknown): QuoInbound {
  // TODO: confirm with Quo support — accept both the documented shape and a
  // few likely variants until the schema is locked.
  const p = payload as Record<string, unknown> | null;
  if (!p || typeof p !== 'object') throw new Error('quo: empty webhook payload');

  const fromPhone =
    (p.from as string | undefined) ??
    (p.from_phone as string | undefined) ??
    (p.sender as string | undefined) ??
    '';
  const body =
    (p.body as string | undefined) ??
    (p.text as string | undefined) ??
    (p.message as string | undefined) ??
    '';
  const ts =
    (p.received_at as string | undefined) ??
    (p.timestamp as string | undefined) ??
    new Date().toISOString();

  if (!fromPhone || !body) {
    throw new Error('quo: missing from/body');
  }
  return { fromPhone, body, receivedAt: new Date(ts) };
}

export async function verifyQuoSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env.QUO_WEBHOOK_SECRET;
  if (!secret) return true; // dev: allow if not configured
  if (!signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return timingSafeEqual(hex, signature.replace(/^sha256=/, ''));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
