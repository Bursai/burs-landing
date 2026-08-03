// tests/dist.ts
// Shared accessor for the built site. Not a *.smoke.ts file on purpose, so
// Vitest's `include` (see vitest.config.ts) does not collect it as a suite.
//
// WHY THIS EXISTS: the smoke suites assert invariants that only exist in the
// BUILT HTML, so they need dist/ — which is gitignored and therefore absent on
// a clean checkout. Calling walk('dist') at module scope, as they used to,
// throws ENOENT during test DISCOVERY, which aborts the whole Vitest run:
// links.test.ts, prices.test.ts and every other unrelated suite fail to
// execute too. `npm test` is now `pretest: astro build` → `vitest run`, so the
// build always exists; this module is the second line of defence for anyone
// invoking `npx vitest run` directly. It fails LOUDLY and specifically — a
// suite that silently skips when dist/ is missing would let a real regression
// in the shipped HTML pass unnoticed, which is worse than an error.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function walk(dir: string, files: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.html')) files.push(p);
  }
  return files;
}

/**
 * Every .html file in dist/. Throws — never returns empty — when the build is
 * missing, so the failure names its own fix instead of surfacing as ENOENT.
 * Call from `beforeAll`, not module scope: that scopes the failure to the
 * suites that actually need the build.
 */
export function walkDist(): string[] {
  if (!existsSync(DIST)) {
    throw new Error(
      `${DIST}/ not found. These suites assert against the built HTML — run \`npm run build\` first ` +
        `(\`npm test\` does it for you via the pretest script).`,
    );
  }
  const files = walk(DIST);
  if (files.length === 0) {
    throw new Error(`${DIST}/ contains no .html files — the build produced nothing to assert against.`);
  }
  return files;
}
