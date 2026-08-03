// src/lib/links.test.ts
// Guards the paid-traffic install path.
//
// HISTORY — read this before "restoring" the redirect this suite now forbids.
// Until 2026-08-03 `vercel.json` held an edge 302 for /go?utm_campaign=<c>
// that sent paid ad clicks straight to the App Store, so an ad click cost
// zero extra taps. This suite existed to keep that redirect's destination
// byte-identical to what go.astro's CTA produced, because a mismatch would
// have split paid and organic installs across different ct tokens in App
// Store Connect — silently, with nothing failing.
//
// That redirect fired BEFORE Astro, the Meta pixel, or any analytics beacon
// ever ran, which made every paid click unmeasurable: 906 SEK of Meta spend
// from 2026-07-26 onward left no trace anywhere but Meta's own click count.
// It is now deleted. /go renders for everyone, fires its beacons, and hands
// off to the App Store from the client (see src/pages/go.astro). The
// invariant this suite protects is therefore inverted: there must be NO edge
// redirect for /go, and the client-side token logic must agree with
// `buildAppStoreUrl`, which is now the single source of truth for the URL
// shape and the campaign-token validation.
//
// 2026-08-02 (kept for context): the old rule originally hardcoded
// `meta-m1-se`, so the first ad shipped with a different utm_campaign (M3)
// silently fell through to the interstitial. Worse, an M3 ad pointed straight
// at apps.apple.com to dodge the interstitial entirely — and Meta hard-rejects
// an App Store URL under a Traffic objective ("App-url stöds enbart av
// målsättningen Appinstallationer"), so that ad never served one impression.
// Paid traffic must keep routing through burs.me/go.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { APP_STORE_URL, CAMPAIGN_PARAM_KEYS, buildAppStoreUrl, resolveCampaign } from './links';

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

const goRedirects = vercelConfig.redirects.filter((r) => r.source.replace(/\/$/, '') === '/go');

describe('/go must render, not redirect at the edge', () => {
  it('has no vercel.json redirect for /go, in any form', () => {
    // THE regression guard for this whole task. An edge redirect here runs
    // before the page exists, so the Meta pixel and the analytics beacon
    // never fire and paid spend becomes unmeasurable again. If a future
    // change wants zero-tap paid clicks back, it has to solve measurement
    // some other way first — not by re-adding this.
    expect(goRedirects).toEqual([]);
  });

  it('leaves the /download redirects alone', () => {
    // /download is the bio-link shortcut and is NOT a measurement surface —
    // it stays a plain edge 302. Deleting it while removing /go would break
    // every printed/bio link.
    const downloads = vercelConfig.redirects.filter(
      (r) => r.source.replace(/\/$/, '') === '/download',
    );
    expect(downloads.map((r) => r.source).sort()).toEqual(['/download', '/download/']);
    for (const rule of downloads) expect(rule.statusCode).toBe(302);
  });

  it('is deliberately absent from public/_redirects', () => {
    // /download appears in BOTH vercel.json and public/_redirects (the
    // Cloudflare-compatible mirror), so the obvious "consistency fix" here is
    // to add /go to _redirects as well. Do not: that format is a flat
    // source→destination list with NO conditional matching, so the entry
    // would fire for every visitor at the edge — the exact failure this task
    // just removed from vercel.json.
    const lines = readRepoFile('public/_redirects')
      .split('\n')
      .map((l) => l.trim().split(/\s+/)[0]);
    expect(lines).not.toContain('/go');
    expect(lines).not.toContain('/go/');
  });
});

describe('go.astro client script ↔ links.ts', () => {
  // The script is `is:inline` and cannot import from src/lib, so it mirrors
  // resolveCampaign + buildAppStoreUrl by hand. These assertions keep the copy
  // honest; if you rewrite the script, update them deliberately.
  it('reads every campaign param an ad platform might send, in the same order', () => {
    // `src` = TikTok/IG bio links. `utm_campaign` = the Meta campaign token
    // (it carries the campaign-scoped value). `utm_source` = last resort.
    // Dropping utm_campaign is the 2026-07-26 bug that silently discarded
    // every paid click's token.
    expect(CAMPAIGN_PARAM_KEYS).toEqual(['src', 'utm_campaign', 'utm_source']);
    const literal = CAMPAIGN_PARAM_KEYS.map((k) => `'${k}'`).join(', ');
    expect(goAstro).toContain(`var CAMPAIGN_KEYS = [${literal}];`);
  });

  it('validates the whole token and falls back, never strips characters', () => {
    // Reject-whole-value semantics, identical to CAMPAIGN_RE in links.ts. The
    // old script stripped invalid characters instead, which turned a hostile
    // value into a plausible-looking partial token rather than rejecting it.
    expect(goAstro).toContain('/^[a-zA-Z0-9_-]{1,32}$/');
    expect(goAstro).toContain('CAMPAIGN_RE.test(candidate)');
    expect(goAstro).toContain("var ct = 'direct';");
  });

  it('takes the first VALID param, not merely the first present', () => {
    // The mirror of resolveCampaign's fall-through loop. A `break` only on a
    // passing candidate is what stops one malformed value (Meta's
    // {{campaign.name}} macro with a space in it) from burying a good token
    // in a later param and reporting the click as organic.
    expect(goAstro).toMatch(
      /for \(var i = 0; i < CAMPAIGN_KEYS\.length; i\+\+\) \{[\s\S]*?CAMPAIGN_RE\.test\(candidate\)[\s\S]*?break;/,
    );
  });

  it('builds the same URL shape buildAppStoreUrl produces', () => {
    // buildAppStoreUrl(null) is what the server rendered into `target`; the
    // script rebuilds from its origin+path, so the query shape must match.
    expect(buildAppStoreUrl(null)).toContain('?l=en-GB&ct=direct&mt=8');
    expect(goAstro).toContain("'?l=en-GB&ct=' + encodeURIComponent(ct) + '&mt=8'");
  });

  it('delays the App Store handoff so the beacons get a chance to fire', () => {
    // A synchronous location.replace would reproduce the edge-redirect bug in
    // JavaScript: the page would render but leave before anything reported.
    expect(goAstro).toContain('window.location.replace(dest)');
    expect(goAstro).toMatch(/setTimeout\(function \(\) \{[\s\S]*?\}, 700\);/);
  });

  it('fires InitiateAppStore in the handoff, since it pre-empts the click', () => {
    // MetaPixel.astro emits this custom event ONLY from a delegated click
    // listener on apps.apple.com links. The timed handoff is a
    // location.replace, which produces no click — so on /go the signal would
    // silently drop to zero unless the handoff fires it itself.
    expect(goAstro).toContain("window.fbq('trackCustom', 'InitiateAppStore'");
    // Must stay inside the consent gate: fbq only exists after consent.
    expect(goAstro).toContain("typeof window.fbq === 'function'");
  });

  it('cancels the handoff when the visitor navigates first', () => {
    // Otherwise the timer overrides the link the visitor actually tapped, and
    // InitiateAppStore fires twice (once from MetaPixel's click listener).
    expect(goAstro).toContain('clearTimeout(handoff)');
  });

  it('keeps a visible CTA and a no-JS fallback', () => {
    // If the timed handoff is blocked (no JS, a popup blocker, a slow device)
    // the visitor must still be able to reach the App Store.
    expect(goAstro).toContain('id="go-cta"');
    expect(goAstro).toContain('<noscript>');
  });
});

describe('resolveCampaign', () => {
  it('reads the bio-link param', () => {
    expect(resolveCampaign('?src=tt')).toBe('tt');
  });

  it('reads the Meta campaign token', () => {
    expect(resolveCampaign('?utm_source=meta&utm_medium=paid-social&utm_campaign=meta-m3-se')).toBe(
      'meta-m3-se',
    );
  });

  it('falls through a malformed value to the next VALID param', () => {
    // Meta's {{campaign.name}} macro on a campaign called "BURS M4 SE".
    // First-present would return null here and bucket a paid click as
    // ct=direct — the same App Store Connect bucket as organic traffic.
    expect(resolveCampaign('?utm_source=meta&utm_campaign=BURS%20M4%20SE')).toBe('meta');
    expect(resolveCampaign('?src=ig%20story&utm_campaign=meta-m4-se')).toBe('meta-m4-se');
  });

  it('returns null when nothing valid is present', () => {
    expect(resolveCampaign('')).toBeNull();
    expect(resolveCampaign('?utm_campaign=')).toBeNull();
    expect(resolveCampaign('?utm_campaign=BURS%20M4%20SE')).toBeNull();
  });

  it('never yields a partial token from a hostile value', () => {
    for (const hostile of ['evil&ct=stolen', 'evil#frag', 'a'.repeat(33), '../../etc']) {
      const params = new URLSearchParams();
      params.set('utm_campaign', hostile);
      expect(resolveCampaign(`?${params.toString()}`), hostile).toBeNull();
    }
  });

  it('composes with buildAppStoreUrl into a clean App Store URL', () => {
    expect(buildAppStoreUrl(resolveCampaign('?utm_campaign=meta-m4-se'))).toBe(
      'https://apps.apple.com/se/app/burs-ai/id6772630210?l=en-GB&ct=meta-m4-se&mt=8',
    );
    expect(buildAppStoreUrl(resolveCampaign('?utm_campaign=BURS%20M4%20SE'))).toContain(
      'ct=direct',
    );
  });
});

describe('buildAppStoreUrl', () => {
  it('stays on the same App Store listing as every other CTA on the site', () => {
    // links.ts holds both APP_STORE_URL (used by Nav, PriceCard, WeekReel,
    // MarkSeal, PricingTeaser) and the base buildAppStoreUrl composes from.
    // They must not drift onto different app IDs or storefronts.
    expect(buildAppStoreUrl(null).startsWith(`${APP_STORE_URL}&ct=`)).toBe(true);
  });

  it('embeds a valid campaign as the ct token', () => {
    expect(buildAppStoreUrl('meta-m4-se')).toBe(
      'https://apps.apple.com/se/app/burs-ai/id6772630210?l=en-GB&ct=meta-m4-se&mt=8',
    );
  });

  it('falls back to ct=direct when campaign is null', () => {
    expect(buildAppStoreUrl(null)).toContain('ct=direct');
  });

  it.each(['evil&ct=stolen', 'evil#frag', 'a'.repeat(33), '../../etc'])(
    'rejects hostile value %s and falls back',
    (bad) => {
      expect(buildAppStoreUrl(bad)).toContain('ct=direct');
      // Nothing from the hostile value may survive into Apple's URL.
      expect(buildAppStoreUrl(bad)).toMatch(
        /^https:\/\/apps\.apple\.com\/se\/app\/burs-ai\/id6772630210\?l=en-GB&ct=direct&mt=8$/,
      );
    },
  );
});
