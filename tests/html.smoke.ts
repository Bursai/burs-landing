// tests/html.smoke.ts
// Invariants that only exist in the BUILT output, so they cannot be asserted
// against source. `npm test` builds first (pretest); running Vitest directly
// against a clean checkout fails here with an explicit message — see
// tests/dist.ts for why this is loaded in beforeAll rather than at module
// scope.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { walkDist } from './dist';
import { CAMPAIGN_PARAM_KEYS, CAMPAIGN_RE_SOURCE } from '../src/lib/links';

let htmls: string[] = [];
beforeAll(() => {
  htmls = walkDist();
});

describe('the build under test', () => {
  it('produced the pages every other assertion loops over', () => {
    // Every check below is a `for (const p of htmls)` loop, which passes
    // VACUOUSLY on an empty list. This is the guard that a missing or broken
    // build fails loudly instead of reporting green.
    expect(htmls.length).toBeGreaterThan(0);
    const paths = htmls.map((p) => p.replace(/\\/g, '/'));
    expect(paths.some((p) => p.endsWith('/go/index.html'))).toBe(true);
  });
});

describe('robots directives in the shipped HTML', () => {
  it('only the /labs pages mention robots at all', () => {
    // Astro emits HTML comments verbatim, so prose in a layout comment lands
    // in all 31 pages that use it. A comment in Base.astro that spelled out a
    // literal `<meta name="robots" content="noindex,nofollow">` while
    // explaining why it gets relocated made the homepage — and every blog
    // post — look noindexed to anything that greps the built HTML, which is
    // how deploys are spot-checked in this repo. Real crawlers parse and
    // ignore comments; grep does not. Keep robots markup out of prose.
    const mentioning = htmls.filter((p) => readFileSync(p, 'utf8').includes('name="robots"'));
    expect(mentioning.every((p) => p.includes('/labs/'))).toBe(true);
  });

  it('the /labs pages really are noindexed, in <head>', () => {
    // The flip side: the comment above is about the placement of <Analytics />
    // pushing slot="head" content into the body. If that ever regresses, the
    // private lab pages become indexable.
    const labs = htmls.filter((p) => p.includes('/labs/'));
    expect(labs.length).toBeGreaterThan(0);
    for (const p of labs) {
      const html = readFileSync(p, 'utf8');
      const head = html.slice(0, html.indexOf('</head>'));
      expect(head, p).toContain('name="robots"');
    }
  });
});

describe('campaign token in the shipped HTML', () => {
  // src/lib/links.test.ts proves the SOURCE has one resolver; this proves the
  // build actually serialised links.ts into it. `define:vars` is a build-time
  // substitution, so a wrong or stale key list would only ever be visible
  // here — and a token that disagrees between the /go handoff and MetaPixel's
  // click listener is how a paid install gets filed as organic.
  it('every page defines the token before the pixel can read it', () => {
    for (const p of htmls) {
      const html = readFileSync(p, 'utf8');
      const token = html.indexOf('window.__bursCampaign =');
      const pixel = html.indexOf('facebook-domain-verification');
      expect(token, `${p}: no campaign resolver`).toBeGreaterThan(-1);
      expect(token, `${p}: resolver must precede the pixel`).toBeLessThan(pixel);
    }
  });

  it('serialises the real key list and charset from links.ts', () => {
    const go = readFileSync(
      htmls.find((p) => p.replace(/\\/g, '/').endsWith('/go/index.html'))!,
      'utf8',
    );
    expect(go).toContain(`const CAMPAIGN_KEYS = ${JSON.stringify(CAMPAIGN_PARAM_KEYS)}`);
    expect(go).toContain(`const CAMPAIGN_RE_SOURCE = ${JSON.stringify(CAMPAIGN_RE_SOURCE)}`);
  });
});

describe('Vercel Web Analytics wiring', () => {
  it('every page ships the beacon', () => {
    // /go declares its own <html> and never reaches Base.astro, so the two
    // placements are separate; this is what catches one of them being dropped.
    for (const p of htmls) {
      expect(readFileSync(p, 'utf8'), p).toContain('<vercel-analytics');
    }
  });

  it('every page defines the query-param allowlist before the beacon', () => {
    // Without this the beacon reports location.href verbatim, which on a paid
    // landing is /go?…&fbclid=… — a unique per-click identifier. The hook has
    // to be defined ahead of the <vercel-analytics> element, because the
    // component reads window.webAnalyticsBeforeSend in its constructor.
    for (const p of htmls) {
      const html = readFileSync(p, 'utf8');
      const hook = html.indexOf('window.webAnalyticsBeforeSend');
      const element = html.indexOf('<vercel-analytics');
      expect(hook, `${p}: no beforeSend hook`).toBeGreaterThan(-1);
      expect(hook, `${p}: hook must precede the element`).toBeLessThan(element);
      // fbclid must not be on the allowlist, however it grows.
      expect(html.slice(hook, element), p).not.toContain('fbclid');
    }
  });
});

describe('privacy + attribution invariants added in Codex round 4 (PR #49)', () => {
  it('the analytics hook validates campaign VALUES, not just their names', () => {
    // An allowlist of parameter NAMES does not sanitize what those parameters
    // carry: `?utm_content=user@example.com` has an allowlisted name and a
    // value that is exactly the personal data the hook exists to strip. The
    // shipped beacon must match each retained value WHOLE against the campaign
    // charset. Asserted on the built HTML because the guard lives in an
    // is:inline script — if it stops shipping, this fails.
    const withHook = htmls.filter((p) =>
      readFileSync(p, 'utf8').includes('webAnalyticsBeforeSend'),
    );
    expect(withHook.length).toBeGreaterThan(0);
    for (const p of withHook) {
      const html = readFileSync(p, 'utf8');
      expect(html, p).toContain('tokenRe.test(value)');
      // The charset is injected from links.ts, never hand-copied.
      expect(html, p).toContain(CAMPAIGN_RE_SOURCE.replace(/\\/g, '\\\\'));
    }
  });

  it('every page stamps its App Store links with the resolved campaign token', () => {
    // MetaPixel reports InitiateAppStore with the token from ANY page, so if
    // only /go rewrote its href the same conversion was campaign-attributed in
    // Meta and unattributed in App Store Connect. One resolver, one token, both
    // reports.
    // NOTE ON WHAT THIS PROVES: it asserts the STAMPER shipped on every page
    // that renders an App Store link — the selector it queries and the href it
    // rebuilds. It does not execute it; the runtime behaviour is a browser
    // concern (tests/a11y is the Playwright surface). The failure this guards
    // is a real one that already happened: a page carrying App Store CTAs
    // without the resolver, which is a silent attribution hole.
    const withLinks = htmls.filter((p) => readFileSync(p, 'utf8').includes('apps.apple.com'));
    expect(withLinks.length).toBeGreaterThan(1);
    for (const p of withLinks) {
      const html = readFileSync(p, 'utf8');
      expect(html, p).toContain('a[href*="apps.apple.com"]');
      // The rebuilt href shape, matching buildAppStoreUrl() in src/lib/links.ts.
      expect(html, p).toContain('"?l=en-GB&ct=" + encodeURIComponent(ct) + "&mt=8"');
    }
  });
});
