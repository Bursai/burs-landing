// src/lib/links.test.ts
// Guards the paid-traffic install path, which is split across two files that
// cannot import each other:
//
//   - vercel.json  — an edge 302 for /go?utm_campaign=<c>, so a paid ad click
//                    reaches the App Store with zero extra taps.
//   - go.astro     — the interstitial organic visitors still get, whose CTA
//                    is rewritten client-side to carry the same ct token.
//
// If those two ever disagree, paid and organic installs land under DIFFERENT
// campaign tokens in App Store Connect and the ad spend becomes unreadable —
// silently, with nothing failing. That is exactly the bug this suite exists
// to prevent, so it asserts the two produce a byte-identical URL.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { APP_STORE_URL } from './links';

const root = new URL('../../', import.meta.url);
const readRepoFile = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), 'utf8');

interface Redirect {
  source: string;
  destination: string;
  statusCode?: number;
  has?: { type: string; key: string; value?: string }[];
}

const vercelConfig: { redirects: Redirect[] } = JSON.parse(readRepoFile('vercel.json'));
const goAstro = readRepoFile('src/pages/go.astro');

/** Re-implements go.astro's client-side token logic. Kept in lockstep by the
 *  final test in this file, which asserts the real script still matches. */
const ctaUrlFor = (campaign: string) => {
  const safe = campaign.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  const sep = APP_STORE_URL.indexOf('?') === -1 ? '?' : '&';
  return `${APP_STORE_URL}${sep}ct=${encodeURIComponent(safe)}&mt=8`;
};

const goRedirects = vercelConfig.redirects.filter((r) => r.source.replace(/\/$/, '') === '/go');

describe('paid /go redirect ↔ organic /go CTA', () => {
  it('defines an edge redirect for /go so paid clicks skip the interstitial', () => {
    expect(goRedirects.length).toBeGreaterThan(0);
  });

  it('covers both the bare and trailing-slash forms of /go', () => {
    const sources = goRedirects.map((r) => r.source).sort();
    expect(sources).toEqual(['/go', '/go/']);
  });

  it.each(goRedirects.map((r) => [r.source, r] as const))(
    '%s sends the exact URL the CTA button would have produced',
    (_source, rule) => {
      const campaign = rule.has?.find((h) => h.type === 'query' && h.key === 'utm_campaign')?.value;
      expect(campaign, 'rule must key off utm_campaign').toBeTruthy();
      // The whole point: identical token, identical destination, paid or organic.
      expect(rule.destination).toBe(ctaUrlFor(campaign!));
    },
  );

  it('only fires on a paid ad click, never on a bare or bio-link visit', () => {
    for (const rule of goRedirects) {
      // No `has` would 302 every visitor, deleting the bio landing page.
      expect(rule.has, `${rule.source} must be conditional`).toBeTruthy();
      const keys = rule.has!.map((h) => h.key);
      expect(keys).toContain('utm_campaign');
      // `src` is the TikTok/IG bio param — it must keep the interstitial.
      expect(keys).not.toContain('src');
    }
  });

  it('redirects with 302, not a client-cached 301/308', () => {
    // A cached permanent redirect would pin the campaign token in the
    // visitor's browser and misattribute every later visit.
    for (const rule of goRedirects) expect(rule.statusCode).toBe(302);
  });

  it('is deliberately absent from public/_redirects', () => {
    // /download appears in BOTH vercel.json and public/_redirects (the
    // Cloudflare-compatible mirror), so the obvious "consistency fix" here is
    // to add /go to _redirects as well. Do not: that format is a flat
    // source→destination list with NO conditional matching, so the entry
    // would fire for every visitor and delete the bio landing page — the
    // exact opposite of what this redirect is for. The condition is only
    // expressible in vercel.json's `has`, so /go lives there alone.
    const lines = readRepoFile('public/_redirects')
      .split('\n')
      .map((l) => l.trim().split(/\s+/)[0]);
    expect(lines).not.toContain('/go');
    expect(lines).not.toContain('/go/');
  });

  it('go.astro still derives its token the way ctaUrlFor assumes', () => {
    // If the inline script is rewritten, this test's model goes stale and the
    // equality checks above would pass while production drifts.
    expect(goAstro).toContain("params.get('src')");
    expect(goAstro).toContain("params.get('utm_campaign')");
    expect(goAstro).toContain("params.get('utm_source')");
    expect(goAstro).toContain("replace(/[^a-zA-Z0-9_-]/g, '')");
    expect(goAstro).toContain("'ct=' + encodeURIComponent(safe) + '&mt=8'");
  });
});
