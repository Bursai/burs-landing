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
const SRC = 'src';

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
  assertBuildIsFresh(files);
  return files;
}

/** Newest mtime under a directory tree, or 0 if it can't be read. */
function newestMtime(dir: string): number {
  let newest = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const p = join(current, entry);
      try {
        const st = statSync(p);
        if (st.isDirectory()) stack.push(p);
        else if (st.mtimeMs > newest) newest = st.mtimeMs;
      } catch {
        /* raced with a rebuild — ignore this entry */
      }
    }
  }
  return newest;
}

/**
 * Refuse to assert against a build that predates the sources.
 *
 * `pretest`/`pretest:watch` run `astro build` ONCE, before Vitest starts. In
 * `npm run test:watch` that build is never repeated: editing a page or
 * component re-runs these suites against the PREVIOUS dist/, and reading files
 * establishes no dependency Vitest could invalidate. The suites would then
 * report that the shipped-HTML invariants still hold after the source has
 * already broken them — a green watch run asserting nothing about the code on
 * screen, which is worse than no watch coverage at all.
 *
 * A one-off `npm test` always passes this: `pretest` just built. Only a stale
 * artifact trips it, and the message names its own fix.
 */
function assertBuildIsFresh(files: string[]): void {
  const newestSrc = newestMtime(SRC);
  if (newestSrc === 0) return; // no readable src/ — nothing to compare against
  const oldestBuilt = files.reduce((min, f) => {
    try {
      return Math.min(min, statSync(f).mtimeMs);
    } catch {
      return min;
    }
  }, Number.POSITIVE_INFINITY);
  if (!Number.isFinite(oldestBuilt)) return;
  if (newestSrc > oldestBuilt) {
    throw new Error(
      `${DIST}/ is older than ${SRC}/ — these suites assert against the BUILT HTML, so they would ` +
        `be checking a previous build. Re-run \`npm run build\` (in watch mode, keep ` +
        `\`npx astro build --watch\` running alongside \`npm run test:watch\`).`,
    );
  }
}
