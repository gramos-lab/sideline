// Quo (formerly OpenPhone) integration.
// API docs: https://www.openphone.com/docs/api-reference
// Auth: Authorization: <API_KEY>  (no "Bearer " prefix)
// Webhooks signed via `openphone-signature: hmac;1;<timestampMs>;<base64Signature>`.

export interface QuoSendResult {
  messageId: string;
}

export interface QuoInbound {
  fromPhone: string;
  body: string;
  receivedAt: Date;
}

const QUO_API_BASE = process.env.QUO_API_BASE ?? 'https://api.openphone.com/v1';

export async function sendQuoMessage(
  toPhone: string,
  body: string,
): Promise<QuoSendResult> {
  const apiKey = process.env.QUO_API_KEY;
  const fromPhone = process.env.QUO_FROM_NUMBER;

  if (!apiKey) {
    console.warn('[quo] QUO_API_KEY not set, stubbing send', { toPhone, body });
    return { messageId: `stub-${Date.now()}` };
  }
  if (!fromPhone) {
    throw new Error('QUO_FROM_NUMBER not set — required by OpenPhone API.');
  }

  const res = await fetch(`${QUO_API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: apiKey,
    },
    body: JSON.stringify({
      to: [toPhone],
      from: fromPhone,
      content: body,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Quo send failed ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as { data?: { id?: string }; id?: string };
  return { messageId: json.data?.id ?? json.id ?? `quo-${Date.now()}` };
}

export function parseQuoWebhook(payload: unknown): QuoInbound {
  const p = payload as
    | {
        type?: string;
        createdAt?: string;
        data?: {
          object?: { from?: string; text?: string; body?: string; createdAt?: string };
          from?: string;
          text?: string;
          body?: string;
          createdAt?: string;
        };
        from?: string;
        body?: string;
      }
    | null;
  if (!p) throw new Error('quo: empty webhook payload');

  // OpenPhone v3+ wraps the message under data.object; older wraps under data.
  const inner = p.data?.object ?? p.data ?? p;
  const fromPhone = inner.from ?? '';
  const text = inner.text ?? inner.body ?? '';
  const ts = inner.createdAt ?? p.createdAt ?? new Date().toISOString();

  if (!fromPhone || !text) {
    throw new Error('quo: missing from/text');
  }
  return { fromPhone, body: text, receivedAt: new Date(ts) };
}

// OpenPhone signature format: `hmac;1;<timestampMs>;<base64Signature>`
// Verify by HMAC-SHA256 over `<timestampMs>.<rawBody>` with the base64-decoded secret,
// then comparing base64.
export async function verifyQuoSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = process.env.QUO_WEBHOOK_SECRET;
  if (!secret) return true; // dev: allow if not configured
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(';');
  if (parts.length < 4 || parts[0] !== 'hmac') return false;
  const timestamp = parts[2];
  const provided = parts[3];

  const enc = new TextEncoder();
  const keyBytes = base64Decode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const computed = base64Encode(new Uint8Array(sig));
  return timingSafeEqual(computed, provided);
}

function base64Decode(s: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return Buffer.from(s, 'base64');
}

function base64Encode(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  return Buffer.from(bytes).toString('base64');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
