// JUICEBOX creator dashboard — the ONLY server-side piece.
//
// Borna, 2026-08-23: Juicebox logs in with a code and sees how many paying
// customers he has brought in. Registrations are deliberately NOT shown — see
// "WHAT THIS DELIBERATELY DOES NOT RETURN" below.
//
// ─────────────────────────────────────────────────────────────────────────
// WHY THIS IS A SERVER FUNCTION AND NOT PAGE JAVASCRIPT
//
// The gate protects real customers' payment data. A code compared in the
// browser is not a gate at all — it ships the answer to whoever opens
// devtools, and the Supabase key that fetches the rows would ship with it.
// So the code lives in an env var, the service-role key never leaves this
// function, and the browser only ever receives NUMBERS.
// ─────────────────────────────────────────────────────────────────────────
//
// WHAT THIS DELIBERATELY DOES NOT RETURN: no email, no user id, no name, no
// city, no per-person row of any kind. Juicebox is a third party; the people
// who redeemed his code did not agree to have their identities handed to him,
// and the campaign does not need it. Counts only. If a future change adds a
// per-user list here, that is a GDPR decision, not a UI decision.

export const config = { runtime: 'nodejs' };

/** Public project URL — not a secret, it is in every app bundle already. */
const SUPABASE_URL = 'https://khvkwojtlkcvxjxztduj.supabase.co';

/**
 * The ASC offer we attribute to Juicebox.
 *
 * ⚠️ PREFIX MATCH, NEVER EQUALITY. App Store Connect stores an offer's
 * REFERENCE NAME separately from its customer-facing custom code, and Apple
 * reports the REFERENCE NAME in `offer_code`. Production payloads look like
 *   "JUICEBOX50 - 1 month free then 50 percent off for 3 months"
 * so `=== 'JUICEBOX50'` would match nothing and the dashboard would read a
 * flat zero forever while the campaign actually converted. The sibling
 * Discord notifier (supabase/functions/revenuecat_webhook/offer-code-notify.ts)
 * documents the same trap.
 */
const OFFER_PREFIX = 'JUICEBOX50';

/** RevenueCat event types that mean money actually moved. */
const PAYING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
]);

/** Event types that mean the customer is gone. */
const LOST_EVENTS = new Set(['EXPIRATION']);

type RcRow = {
  app_user_id: string | null;
  event_type: string | null;
  processed_at: string | null;
  payload: Record<string, unknown> | null;
};

/**
 * Fold whatever the user typed onto the stored code.
 *
 * The code is Swedish (`juiceboxärbäst`), so this has to survive the two ways
 * a keyboard can produce "ä": precomposed U+00E4, or "a" + U+0308. NFC makes
 * them the same string. Spaces go too — the code was handed over verbally and
 * arrives typed as "juicebox är bäst" about as often as not.
 */
function fold(value: string): string {
  return value.normalize('NFC').toLowerCase().replace(/\s+/g, '');
}

/** Length-independent comparison so the response time leaks nothing. */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  // Hash both to a fixed width first: timingSafeEqual throws on length
  // mismatch, and the throw itself would be the leak.
  const { createHash, timingSafeEqual } = require('node:crypto') as typeof import('node:crypto');
  const ah = createHash('sha256').update(ab).digest();
  const bh = createHash('sha256').update(bb).digest();
  return timingSafeEqual(ah, bh);
}

/**
 * Best-effort brute-force brake.
 *
 * Serverless instances are recycled and requests fan out across them, so this
 * is a speed bump, not a wall — which is honest and enough: the code guards
 * aggregate counts, not an account, and the real protection is that the code
 * is not in the client bundle. Do not mistake this for a rate limiter.
 */
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { n: 1, first: now });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_ATTEMPTS;
}

async function fetchOfferRows(serviceKey: string): Promise<RcRow[]> {
  // Filter server-side on the jsonb field, then re-check in JS below — the
  // filter is an optimisation, the JS check is the correctness boundary.
  const url =
    `${SUPABASE_URL}/rest/v1/revenuecat_events` +
    `?select=app_user_id,event_type,processed_at,payload` +
    `&payload->>offer_code=ilike.${encodeURIComponent(OFFER_PREFIX + '*')}` +
    `&order=processed_at.desc&limit=5000`;

  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return (await res.json()) as RcRow[];
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const expected = process.env.JUICEBOX_ACCESS_CODE;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || !serviceKey) {
    // Fail CLOSED and say so plainly — a dashboard that silently shows zeros
    // because an env var is missing is worse than one that admits it is down.
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || 'unknown';
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: 'too_many_attempts' });
    return;
  }

  let body: { code?: unknown } = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    res.status(400).json({ error: 'bad_request' });
    return;
  }

  const supplied = typeof body.code === 'string' ? body.code : '';
  if (!supplied || !constantTimeEqual(fold(supplied), fold(expected))) {
    res.status(401).json({ error: 'wrong_code' });
    return;
  }

  let rows: RcRow[];
  try {
    rows = await fetchOfferRows(serviceKey);
  } catch {
    res.status(502).json({ error: 'upstream' });
    return;
  }

  // Re-verify the prefix in JS. If the PostgREST filter is ever changed or
  // silently stops matching, this is what stops another creator's redemptions
  // being counted as Juicebox's.
  const mine = rows.filter((r) => {
    const code = r.payload && typeof r.payload.offer_code === 'string' ? r.payload.offer_code : '';
    return code.toUpperCase().startsWith(OFFER_PREFIX);
  });

  // One customer can produce many events (purchase → renewals → expiration),
  // so everything below is per-PERSON, keyed on app_user_id. Counting events
  // would let a single loyal subscriber read as a dozen conversions.
  const byUser = new Map<string, { paid: boolean; lost: boolean; first: string | null }>();
  for (const r of mine) {
    const id = r.app_user_id;
    if (!id) continue;
    const cur = byUser.get(id) ?? { paid: false, lost: false, first: null };
    if (r.event_type && PAYING_EVENTS.has(r.event_type)) cur.paid = true;
    if (r.event_type && LOST_EVENTS.has(r.event_type)) cur.lost = true;
    if (r.processed_at && (!cur.first || r.processed_at < cur.first)) cur.first = r.processed_at;
    byUser.set(id, cur);
  }

  const all = [...byUser.values()].filter((u) => u.paid);
  const active = all.filter((u) => !u.lost);

  const dayKey = (iso: string) => iso.slice(0, 10);
  const perDay = new Map<string, number>();
  for (const u of all) if (u.first) perDay.set(dayKey(u.first), (perDay.get(dayKey(u.first)) ?? 0) + 1);

  res.status(200).json({
    ok: true,
    // Counts only. See the header — no per-person data leaves this function.
    paying_total: all.length,
    paying_active: active.length,
    churned: all.length - active.length,
    first_redemption: all.reduce<string | null>(
      (min, u) => (u.first && (!min || u.first < min) ? u.first : min),
      null,
    ),
    per_day: [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, n]) => ({ day, n })),
    generated_at: new Date().toISOString(),
  });
}
