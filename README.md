# Sideline

Coverage and scheduling for Royal Sporting Group. Single-page operations dashboard built on Next.js 14 + Supabase + Quo + Anthropic.

## Quick start (demo mode)

```bash
npm install
npm run dev
```

The page renders against `lib/dev-fixtures.ts` if the API isn't reachable. Header pill shows **Demo**.

## Going live

The app boots in **Demo** mode (in-memory fixtures). It will automatically promote to **Live** the moment `GET /api/bundle?club=...` returns a real response (i.e. once Supabase env vars are set). The header pill flips from `Demo` (gray) to `Live` (green).

### 1. Provision Supabase

1. Create a Supabase project.
2. In SQL editor, run in order:
   - [supabase/migrations/0001_initial.sql](supabase/migrations/0001_initial.sql) — schema, RLS, indexes, single-row settings.
   - [supabase/migrations/0002_clubs_short.sql](supabase/migrations/0002_clubs_short.sql) — adds the 4-char calendar code.
3. Optionally run [supabase/seed.sql](supabase/seed.sql) for staging data (mirrors the fixtures: 2 clubs, 5/3 trainers, 1 week of sessions, 1 active cascade).

### 2. Configure environment

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...           # used by API routes / cron
ANTHROPIC_API_KEY=sk-ant-...       # for inbound text intent
QUO_API_KEY=...                    # outbound SMS
QUO_WEBHOOK_SECRET=...             # HMAC verification
BASE44_WEBHOOK_SECRET=...          # bearer token for /api/webhooks/base44
CRON_SECRET=...                    # bearer token for /api/cron/*
ESCALATION_PHONE=+1...             # used when cascades exhaust or unknown senders text in
```

`NEXT_PUBLIC_USE_FIXTURES` is no longer required — the app always tries `/api/bundle` first and falls back gracefully.

### 3. Deploy to Vercel

1. Push the repo to GitHub.
2. Import in Vercel; framework auto-detected.
3. Paste the env vars from `.env.local` into the Vercel project (use the same names).
4. Deploy. The crons in [vercel.json](vercel.json) start firing automatically:
   - `* * * * *` → `/api/cron/cascade-tick`
   - `0 * * * *` → `/api/cron/send-reminders`

### 4. Hook up webhooks

- **Quo** → `POST https://<your-domain>/api/webhooks/quo` with `x-quo-signature` HMAC SHA-256 header.
- **Base44** → `POST https://<your-domain>/api/webhooks/base44` with `Authorization: Bearer ${BASE44_WEBHOOK_SECRET}`.

The Quo SDK call shapes are stubbed in [lib/quo.ts](lib/quo.ts) — confirm the endpoint URL and payload shape with Quo support and remove the `// TODO: confirm with Quo support` markers.

## Project shape

- `app/page.tsx` — the entire dashboard (client component).
- `app/api/bundle/route.ts` — single GET endpoint that returns the entire dashboard state for a slug or `__all`. Used by the live data path.
- `lib/bundle-loader.ts` — server-side joins. Called by the bundle endpoint.
- `lib/data-loader.ts` — client-side fetch + Map rehydration.
- `lib/dev-fixtures.ts` — demo-mode fallback data.
- `lib/quo.ts`, `lib/claude.ts`, `lib/cascade.ts`, `lib/eligibility.ts`, `lib/templates.ts`, `lib/safety.ts` — outbound + intent + cascade engine + safety rails.
- `app/api/{sessions,trainers,clubs,assignments,cascade,webhooks,cron}` — all real Supabase-backed endpoints. Each returns 503 with `supabase not configured` if env is missing.

## How Demo ↔ Live switching works

1. On mount, the page renders fixtures immediately.
2. It fires `GET /api/bundle?club=<slug>` in the background.
3. If the call returns 200 with `{ ok: true, bundle }`, the page replaces its bundle with the live data and the header pill flips to **Live**. Custom clubs you've added in localStorage are merged on top of the live club list.
4. If the call fails (503 / network error), the fixtures stay put — header pill stays **Demo**.
5. After every write (add/edit/delete session, trainer, club), the optimistic UI updates instantly. If the page is in **Live** mode, it then re-fetches the bundle so server-derived state (cascade triggers, hour totals, confirmed timestamps) reconciles.

## Acceptance check for "live"

You'll know everything is wired when:

- Header pill says **Live**.
- Refreshing the page (or opening in incognito) still shows your data — it's coming from Supabase, not localStorage.
- Adding a session via the UI inserts a row in `public.sessions` (visible in Supabase table editor).
- Hitting "Send week" produces rows in `outbound_messages` and (if `agent_enabled` + `approval_mode=false`) actual SMS.
- A trainer texting "yes" hits `/api/webhooks/quo` and flips the assignment to `initial_yes`.
