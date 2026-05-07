# BURS Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild burs.me as a manifesto-led, editorial Astro static site with 10 routes, schema.org-everywhere, and AI-citation-friendly content scaffolding — while preserving the two existing hero/reprise videos exactly.

**Architecture:** Astro 4.x in SSG mode, deployed to Cloudflare Pages. Hand-written CSS, vanilla JS, self-hosted fonts. Content as MDX collections. Single `Schema.astro` component injects typed JSON-LD per page from a `src/lib/schema.ts` source of truth. New site lives on the `redesign` branch alongside the current static site on `main`; merged on launch day.

**Tech Stack:** Astro 4.x · TypeScript · MDX · Vitest (for `lib/`) · Playwright + axe-core (a11y smoke) · Lighthouse CI · Cloudflare Pages

**Spec:** `docs/superpowers/specs/2026-05-06-burs-landing-redesign.md`

---

## Plan map

| Phase | What | Tasks |
|---|---|---|
| 0 | Repo + branch + Astro scaffold | T01–T04 |
| 1 | Tokens, fonts, base layout, nav, footer, cursor | T05–T13 |
| 2 | AI/SEO infrastructure (schema, seo, robots, llms.txt, sitemap) | T14–T20 |
| 3 | Components (HeroVideo, ActSection, PullQuote, ComparisonTable, etc.) | T21–T29 |
| 4 | Static pages (privacy, terms, press, faq, pricing, method, manifesto, answers) | T30–T37 |
| 5 | Home page (13 sections) | T38–T44 |
| 6 | Blog system + content migration + 6 new posts | T45–T52 |
| 7 | Cross-cutting: redirects, 404, OG images, RSS | T53–T56 |
| 8 | Quality gates: a11y, Lighthouse, schema validation | T57–T60 |
| 9 | Launch | T61–T62 |

Total: **62 tasks**.

---

## Phase 0 — Repo setup

### Task 01: Initialize git and create the `redesign` branch

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Init git in the project root**

```bash
cd 'C:\Users\borna\OneDrive\Desktop\BZ\Burs\burs-landing-main'
git init
git checkout -b main
```

- [ ] **Step 2: Add .gitignore**

```
# .gitignore
node_modules/
dist/
.astro/
.DS_Store
.env
.env.*
!.env.example
.superpowers/
.vscode/
.idea/
*.log
.cache/
```

- [ ] **Step 3: Initial commit of the existing static site**

```bash
git add -A
git commit -m "chore: snapshot existing static site before redesign"
```

- [ ] **Step 4: Create the redesign branch**

```bash
git checkout -b redesign
```

- [ ] **Step 5: Verify**

Run: `git status && git branch --show-current`
Expected: `redesign` branch, clean tree.

---

### Task 02: Scaffold Astro into the redesign branch

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "burs-landing",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:a11y": "playwright test",
    "test:lh": "lhci autorun"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/mdx": "^3.1.0",
    "@astrojs/sitemap": "^3.2.0",
    "@astrojs/rss": "^4.0.0",
    "astro-og-canvas": "^0.5.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.10.0",
    "@lhci/cli": "^0.14.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: zero errors. `node_modules/` populated.

- [ ] **Step 3: Create astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://burs.me',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto'
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/draft/')
    })
  ],
  vite: {
    server: { fs: { strict: false } }
  }
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Move static files to public/**

```bash
mkdir -p public
git mv _redirects manifest.json llms.txt sitemap.xml robots.txt favicon.ico favicon.png favicon-16.png favicon-32.png apple-touch-icon.png logo-128.png logo-256.png logo-48.png logo-512.png burs-logo-256-2.png og-image.png public/
git mv assets public/assets
git mv icons public/icons 2>/dev/null || true
```

(Old `index.html` and the per-route folders stay in repo root for now — they get deleted in T61 at launch.)

- [ ] **Step 6: Verify scaffold builds**

```bash
mkdir -p src/pages
echo '---
---
<h1>Hello</h1>' > src/pages/index.astro
npm run build
```

Expected: `dist/` produced, no errors. Then delete the placeholder: `rm src/pages/index.astro`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 4.x with MDX + sitemap"
```

---

### Task 03: Wire Vitest, Playwright, and Lighthouse CI configs

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `lighthouserc.json`

- [ ] **Step 1: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default']
  }
});
```

- [ ] **Step 2: Create playwright.config.ts**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/a11y',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI
  }
});
```

- [ ] **Step 3: Create lighthouserc.json**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/",
        "http://localhost/manifesto",
        "http://localhost/method",
        "http://localhost/pricing",
        "http://localhost/faq",
        "http://localhost/blog"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 1.0 }]
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts playwright.config.ts lighthouserc.json
git commit -m "chore: add Vitest, Playwright, and Lighthouse configs"
```

---

### Task 04: Self-host fonts

**Files:**
- Create: `public/fonts/fraunces-variable.woff2`, `public/fonts/inter-tight-variable.woff2`, `public/fonts/spectral-italic.woff2`, `public/fonts/jetbrains-mono.woff2`

- [ ] **Step 1: Download subsetted woff2 files**

Fetch from Google Fonts Helper (https://gwfh.mranftl.com) the **latin** subset for: Fraunces (variable), Inter Tight (variable), Spectral italic 300/400, JetBrains Mono 400/500. Place each `.woff2` in `public/fonts/`.

- [ ] **Step 2: Verify file presence**

```bash
ls public/fonts/
```

Expected: 4 woff2 files.

- [ ] **Step 3: Commit**

```bash
git add public/fonts
git commit -m "chore: self-host Fraunces, Inter Tight, Spectral, JetBrains Mono"
```

---

## Phase 1 — Foundation

### Task 05: Design tokens CSS

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Write tokens.css**

```css
/* src/styles/tokens.css */
:root{
  /* Color */
  --ink: #0E0D0C;
  --charcoal: #1C1917;
  --charcoal-2: #2A2724;
  --charcoal-3: #3A3633;
  --cream: #F5F0E8;
  --cream-paper: #FAF6EE;
  --cream-warm: #EDE5D6;
  --cream-deep: #E4D9C3;
  --gold: #C9A86C;
  --gold-bright: #E0BD7D;
  --gold-deep: #A8884F;

  /* Layout */
  --max: 1440px;
  --gutter: clamp(20px, 4vw, 56px);

  /* Type */
  --display: "Fraunces", "Times New Roman", serif;
  --body: "Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif;
  --serif: "Spectral", Georgia, serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;

  /* Type sizes */
  --t-hero: clamp(56px, 11vw, 168px);
  --t-section: clamp(40px, 6vw, 88px);
  --t-h2: clamp(28px, 3.6vw, 48px);
  --t-h3: clamp(20px, 2.2vw, 28px);
  --t-body: 16px;
  --t-lede: clamp(17px, 1.6vw, 20px);
  --t-label: 11px;

  /* Motion */
  --eo: cubic-bezier(.2,.7,.2,1);
  --eio: cubic-bezier(.7,0,.2,1);
  --grain: .055;
}

@media (prefers-reduced-motion: reduce) {
  :root { --grain: 0; }
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(styles): design tokens"
```

---

### Task 06: Reset and base typography CSS

**Files:**
- Create: `src/styles/reset.css`, `src/styles/typography.css`

- [ ] **Step 1: Write reset.css**

```css
/* src/styles/reset.css */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
html,body{background:var(--cream);color:var(--charcoal);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{font-family:var(--body);font-weight:400;font-size:var(--t-body);line-height:1.55;overflow-x:hidden}
img,svg,video{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
button{font:inherit;background:none;border:0;color:inherit;cursor:pointer}
::selection{background:var(--gold);color:var(--charcoal)}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
```

- [ ] **Step 2: Write typography.css (with @font-face)**

```css
/* src/styles/typography.css */
@font-face{
  font-family:"Fraunces";
  src:url("/fonts/fraunces-variable.woff2") format("woff2-variations");
  font-weight:200 600;
  font-style:normal;
  font-display:swap;
}
@font-face{
  font-family:"Inter Tight";
  src:url("/fonts/inter-tight-variable.woff2") format("woff2-variations");
  font-weight:300 600;
  font-style:normal;
  font-display:swap;
}
@font-face{
  font-family:"Spectral";
  src:url("/fonts/spectral-italic.woff2") format("woff2");
  font-weight:300 400;
  font-style:italic;
  font-display:swap;
}
@font-face{
  font-family:"JetBrains Mono";
  src:url("/fonts/jetbrains-mono.woff2") format("woff2");
  font-weight:400 500;
  font-style:normal;
  font-display:swap;
}

h1,h2,h3{font-family:var(--display);font-weight:300;letter-spacing:-.025em;line-height:1}
h1{font-size:var(--t-hero);font-weight:200;letter-spacing:-.04em;line-height:.88}
h2{font-size:var(--t-section)}
h3{font-size:var(--t-h2)}
em{font-style:italic;color:var(--gold);font-weight:300}

.eyebrow{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.24em;text-transform:uppercase;color:var(--charcoal);opacity:.7}
.lede{font-family:var(--serif);font-style:italic;font-size:var(--t-lede);line-height:1.45;color:var(--charcoal-2)}
.label{font-family:var(--mono);font-size:10px;letter-spacing:.25em;text-transform:uppercase;opacity:.6}
.dropcap::first-letter{font-family:var(--display);font-style:italic;font-size:6em;float:left;line-height:.8;margin:.05em .08em 0 0;color:var(--gold);font-weight:300}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/reset.css src/styles/typography.css
git commit -m "feat(styles): reset + typography with self-hosted fonts"
```

---

### Task 07: Utilities CSS (grain, wrap, sections, ctas)

**Files:**
- Create: `src/styles/utilities.css`

- [ ] **Step 1: Write utilities.css**

```css
/* src/styles/utilities.css */
.wrap{max-width:var(--max);margin:0 auto;padding:0 var(--gutter);position:relative}
.section{padding-block:clamp(80px, 12vh, 160px)}
.section--dark{background:var(--charcoal);color:var(--cream)}
.section--ink{background:var(--ink);color:var(--cream)}
.section--paper{background:var(--cream-paper)}

/* Grain layer */
.grain{position:fixed;inset:0;pointer-events:none;z-index:9999;mix-blend-mode:multiply;opacity:var(--grain);background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}

/* CTA */
.cta{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;background:var(--charcoal);color:var(--cream);border:1px solid var(--charcoal);font-family:var(--body);font-size:13px;font-weight:500;letter-spacing:.02em;border-radius:2px;transition:background .4s var(--eo),color .4s var(--eo),border-color .4s var(--eo);white-space:nowrap}
.cta:hover{background:var(--gold);color:var(--charcoal);border-color:var(--gold)}
.cta--ghost{background:transparent;color:var(--charcoal)}
.cta--ghost:hover{background:var(--charcoal);color:var(--cream)}
.cta--cream{background:var(--cream);color:var(--charcoal);border-color:var(--cream)}
.cta--cream:hover{background:var(--gold);color:var(--charcoal);border-color:var(--gold)}
.cta__arrow{font-family:var(--mono);font-size:14px;transition:transform .45s var(--eo)}
.cta:hover .cta__arrow{transform:translateX(5px)}

/* Pull quote */
.pullquote{font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(28px,3.4vw,44px);line-height:1.15;letter-spacing:-.02em;color:var(--charcoal);max-width:32ch;margin:32px 0;border-left:2px solid var(--gold);padding-left:24px}
.section--dark .pullquote, .section--ink .pullquote{color:var(--cream)}

/* Anti list (the "BURS will never" list) */
.anti{list-style:none;display:grid;gap:12px;font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(22px,2.6vw,32px);color:var(--cream)}
.anti li::before{content:"—  ";color:var(--gold);font-style:normal}

/* Reveal-on-scroll */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .9s var(--eo),transform .9s var(--eo)}
.reveal.in{opacity:1;transform:none}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/utilities.css
git commit -m "feat(styles): utilities (wrap, section, cta, pullquote, anti, reveal)"
```

---

### Task 08: Base layout component

**Files:**
- Create: `src/layouts/Base.astro`, `src/lib/seo.ts`

- [ ] **Step 1: Create src/lib/seo.ts**

```ts
// src/lib/seo.ts
export interface SeoInput {
  title: string;
  description: string;
  path: string;            // e.g. "/manifesto"
  ogImage?: string;        // absolute or root-relative
  type?: "website" | "article";
}

export const SITE_URL = "https://burs.me";
export const DEFAULT_OG = "/og-image.png";

export function buildSeo(input: SeoInput) {
  const url = new URL(input.path, SITE_URL).toString();
  const ogImage = new URL(input.ogImage ?? DEFAULT_OG, SITE_URL).toString();
  return {
    title: input.title,
    description: input.description,
    canonical: url,
    ogImage,
    type: input.type ?? "website"
  };
}
```

- [ ] **Step 2: Create src/lib/seo.test.ts**

```ts
// src/lib/seo.test.ts
import { describe, it, expect } from 'vitest';
import { buildSeo } from './seo';

describe('buildSeo', () => {
  it('builds canonical and og from a path', () => {
    const r = buildSeo({ title: 'X', description: 'Y', path: '/manifesto' });
    expect(r.canonical).toBe('https://burs.me/manifesto');
    expect(r.ogImage).toBe('https://burs.me/og-image.png');
    expect(r.type).toBe('website');
  });

  it('uses provided og when given', () => {
    const r = buildSeo({ title: 'X', description: 'Y', path: '/x', ogImage: '/og/x.png' });
    expect(r.ogImage).toBe('https://burs.me/og/x.png');
  });
});
```

- [ ] **Step 3: Run test, verify pass**

```bash
npm test
```

Expected: 2 passing.

- [ ] **Step 4: Create src/layouts/Base.astro**

```astro
---
// src/layouts/Base.astro
import "../styles/tokens.css";
import "../styles/reset.css";
import "../styles/typography.css";
import "../styles/utilities.css";
import Nav from "../components/Nav.astro";
import Footer from "../components/Footer.astro";
import Cursor from "../components/Cursor.astro";
import { buildSeo } from "../lib/seo";

interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: "website" | "article";
  bodyClass?: string;
}

const { title, description, path, ogImage, type, bodyClass } = Astro.props;
const seo = buildSeo({ title, description, path, ogImage, type });
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <link rel="canonical" href={seo.canonical} />

  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />

  <link rel="preload" href="/fonts/fraunces-variable.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/inter-tight-variable.woff2" as="font" type="font/woff2" crossorigin />

  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:url" content={seo.canonical} />
  <meta property="og:image" content={seo.ogImage} />
  <meta property="og:type" content={seo.type} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seo.title} />
  <meta name="twitter:description" content={seo.description} />
  <meta name="twitter:image" content={seo.ogImage} />

  <slot name="head" />
</head>
<body class={bodyClass}>
  <div class="grain" aria-hidden="true"></div>
  <Cursor />
  <Nav />
  <main id="main"><slot /></main>
  <Footer />
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts src/layouts/Base.astro
git commit -m "feat: Base layout + seo builder + tests"
```

---

### Task 09: Nav component

**Files:**
- Create: `src/components/Nav.astro`

- [ ] **Step 1: Write Nav.astro**

```astro
---
// src/components/Nav.astro
const links = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/method",    label: "Method" },
  { href: "/pricing",   label: "Pricing" },
  { href: "/press",     label: "Press" },
  { href: "/blog",      label: "Blog" }
];
---
<nav class="nav" aria-label="Primary">
  <a href="/" class="nav__brand" aria-label="BURS home">BURS<sup>™</sup></a>
  <ul class="nav__links" role="list">
    {links.map(l => (<li><a href={l.href}>{l.label}</a></li>))}
  </ul>
  <a href="https://apps.apple.com/app/burs" class="cta cta--cream" aria-label="Download BURS">
    Get the app <span class="cta__arrow" aria-hidden="true">→</span>
  </a>
</nav>

<style>
  .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px var(--gutter);display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);background:rgba(245,240,232,.6);border-bottom:1px solid rgba(28,25,23,.06);transition:background .4s ease,border-color .4s ease}
  body.dark-nav .nav{background:rgba(28,25,23,.5);border-bottom-color:rgba(245,240,232,.08);color:var(--cream)}
  body.dark-nav .nav .cta{background:var(--cream);color:var(--charcoal);border-color:var(--cream)}
  .nav__brand{font-family:var(--display);font-style:italic;font-weight:500;font-size:26px;letter-spacing:-.025em;display:flex;align-items:baseline;gap:8px;color:inherit}
  .nav__brand sup{font-family:var(--mono);font-style:normal;font-size:9px;letter-spacing:.22em;color:var(--gold);font-weight:500;position:relative;top:-13px}
  .nav__links{display:flex;gap:36px;align-items:center;list-style:none}
  .nav__links a{font-size:13px;font-weight:400;letter-spacing:.01em;position:relative;padding:4px 0;color:inherit}
  .nav__links a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform .5s var(--eio)}
  .nav__links a:hover::after{transform:scaleX(1);transform-origin:left}
  @media (max-width:900px){.nav__links{display:none}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: Nav component"
```

---

### Task 10: Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write Footer.astro**

```astro
---
// src/components/Footer.astro
const year = new Date().getFullYear();
---
<footer class="foot section--ink">
  <div class="wrap foot__grid">
    <div class="foot__col foot__col--lead">
      <a href="/" class="foot__brand">BURS<sup>™</sup></a>
      <p class="lede" style="color:rgba(245,240,232,.78);max-width:32ch">
        Your closet, finally working for you.
      </p>
    </div>

    <div class="foot__col">
      <p class="label">Product</p>
      <ul role="list">
        <li><a href="/method">Method</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/answers">Answers</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>
    </div>

    <div class="foot__col">
      <p class="label">Company</p>
      <ul role="list">
        <li><a href="/manifesto">Manifesto</a></li>
        <li><a href="/press">Press</a></li>
        <li><a href="/blog">Blog</a></li>
      </ul>
    </div>

    <div class="foot__col">
      <p class="label">Legal</p>
      <ul role="list">
        <li><a href="/privacy">Privacy</a></li>
        <li><a href="/terms">Terms</a></li>
      </ul>
      <p class="label" style="margin-top:18px">Contact</p>
      <ul role="list">
        <li><a href="mailto:hello@burs.me">hello@burs.me</a></li>
      </ul>
    </div>
  </div>

  <div class="wrap foot__rule">
    <span>© {year} BURS · Stockholm / EU</span>
    <span>Made for the eighty percent of your closet that never gets worn.</span>
  </div>
</footer>

<style>
  .foot{padding-block:clamp(60px,9vh,120px) 28px;color:var(--cream)}
  .foot__grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:48px;padding-bottom:60px;border-bottom:1px solid rgba(245,240,232,.12)}
  .foot__col ul{list-style:none;display:grid;gap:8px;margin-top:14px}
  .foot__col a{font-size:14px;color:rgba(245,240,232,.85)}
  .foot__col a:hover{color:var(--gold-bright)}
  .foot__brand{font-family:var(--display);font-style:italic;font-weight:500;font-size:32px;color:var(--cream);display:inline-block;margin-bottom:18px}
  .foot__brand sup{font-family:var(--mono);font-style:normal;font-size:10px;letter-spacing:.22em;color:var(--gold);position:relative;top:-15px;margin-left:4px}
  .foot__rule{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(245,240,232,.45);padding-top:24px;flex-wrap:wrap;gap:14px}
  @media (max-width:900px){.foot__grid{grid-template-columns:1fr 1fr;gap:32px}.foot__col--lead{grid-column:1/-1}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: Footer component"
```

---

### Task 11: Cursor component

**Files:**
- Create: `src/components/Cursor.astro`

- [ ] **Step 1: Write Cursor.astro**

```astro
---
// src/components/Cursor.astro
---
<div class="cursor" aria-hidden="true" data-cursor></div>

<style>
  body{cursor:none}
  @media (max-width:900px),(prefers-reduced-motion:reduce){body{cursor:auto}.cursor{display:none}}
  .cursor{position:fixed;top:0;left:0;width:32px;height:32px;border:1px solid var(--charcoal);border-radius:50%;pointer-events:none;z-index:10000;transform:translate(-50%,-50%);mix-blend-mode:difference;transition:width .35s var(--eo),height .35s var(--eo),border-radius .35s var(--eo);will-change:transform}
  .cursor.hover{width:80px;height:80px;background:rgba(201,168,108,.15)}
</style>

<script>
  const c = document.querySelector('[data-cursor]') as HTMLElement | null;
  if (c && window.matchMedia('(min-width: 901px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    function loop(){
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      c!.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    }
    loop();
    document.addEventListener('mouseover', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [data-cursor-hover]')) c!.classList.add('hover');
    });
    document.addEventListener('mouseout', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [data-cursor-hover]')) c!.classList.remove('hover');
    });
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Cursor.astro
git commit -m "feat: Cursor component"
```

---

### Task 12: Editorial layout (long-form)

**Files:**
- Create: `src/layouts/Editorial.astro`

- [ ] **Step 1: Write Editorial.astro**

```astro
---
// src/layouts/Editorial.astro
import Base from "./Base.astro";

interface Props {
  title: string;
  description: string;
  path: string;
  eyebrow?: string;
  headline: string;
  ogImage?: string;
  type?: "website" | "article";
}

const { title, description, path, eyebrow, headline, ogImage, type } = Astro.props;
---
<Base title={title} description={description} path={path} ogImage={ogImage} type={type ?? "article"}>
  <article class="editorial">
    <header class="editorial__head wrap">
      {eyebrow && <p class="eyebrow">{eyebrow}</p>}
      <h1 class="editorial__h1" set:html={headline} />
    </header>
    <div class="editorial__body wrap">
      <slot />
    </div>
  </article>
</Base>

<style>
  .editorial{background:var(--cream-paper);padding-block:clamp(120px,18vh,200px) clamp(80px,12vh,160px)}
  .editorial__head{max-width:980px;margin-bottom:64px}
  .editorial__h1{font-size:clamp(40px,7vw,108px);font-weight:200;letter-spacing:-.04em;line-height:.92;margin-top:18px;text-wrap:balance}
  .editorial__h1 em{font-style:italic;color:var(--gold);font-weight:300}
  .editorial__body{max-width:680px;font-family:var(--serif);font-size:clamp(17px,1.4vw,19px);line-height:1.65;color:var(--charcoal-2)}
  .editorial__body :global(h2){font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(28px,3vw,40px);line-height:1.05;margin:64px 0 18px;color:var(--charcoal)}
  .editorial__body :global(p){margin-bottom:1.4em}
  .editorial__body :global(blockquote){font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(24px,2.4vw,32px);line-height:1.2;color:var(--charcoal);border-left:2px solid var(--gold);padding-left:22px;margin:36px 0}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Editorial.astro
git commit -m "feat: Editorial layout for long-form pages"
```

---

### Task 13: Page layout (utility pages)

**Files:**
- Create: `src/layouts/Page.astro`

- [ ] **Step 1: Write Page.astro**

```astro
---
// src/layouts/Page.astro
import Base from "./Base.astro";

interface Props {
  title: string;
  description: string;
  path: string;
  eyebrow?: string;
  headline: string;
  lede?: string;
  ogImage?: string;
}

const { title, description, path, eyebrow, headline, lede, ogImage } = Astro.props;
---
<Base title={title} description={description} path={path} ogImage={ogImage}>
  <header class="phead">
    <div class="wrap">
      {eyebrow && <p class="eyebrow">{eyebrow}</p>}
      <h1 set:html={headline} />
      {lede && <p class="lede" style="margin-top:24px;max-width:54ch">{lede}</p>}
    </div>
  </header>
  <section class="pbody">
    <div class="wrap"><slot /></div>
  </section>
</Base>

<style>
  .phead{background:var(--cream);padding-block:clamp(120px,18vh,200px) clamp(40px,7vh,80px)}
  .phead h1{font-size:clamp(48px,8vw,128px);font-weight:200;letter-spacing:-.04em;line-height:.9;margin-top:14px;text-wrap:balance}
  .phead h1 em{font-style:italic;color:var(--gold);font-weight:300}
  .pbody{padding-block:clamp(48px,8vh,120px)}
</style>
```

- [ ] **Step 2: Verify build still green with empty homepage placeholder**

```bash
mkdir -p src/pages && cat > src/pages/index.astro <<'EOF'
---
import Page from "../layouts/Page.astro";
---
<Page title="BURS" description="An AI wardrobe stylist." path="/" eyebrow="An AI wardrobe stylist." headline="Most of your wardrobe is <em>invisible</em> to you.">
  <p>Placeholder.</p>
</Page>
EOF
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Page.astro src/pages/index.astro
git commit -m "feat: Page layout + placeholder home"
```

---

## Phase 2 — AI/SEO infrastructure

### Task 14: Schema constructors (typed JSON-LD)

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/schema.test.ts`

- [ ] **Step 1: Write schema.ts**

```ts
// src/lib/schema.ts
export const SITE = "https://burs.me";
export const BRAND = "BURS";

const ORG = {
  "@type": "Organization",
  "@id": `${SITE}#org`,
  name: BRAND,
  url: SITE,
  logo: `${SITE}/logo-512.png`,
  sameAs: [] as string[],
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@burs.me",
    availableLanguage: ["English", "Swedish"]
  }]
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": `${SITE}#website`,
  url: SITE,
  name: BRAND,
  publisher: { "@id": `${SITE}#org` }
};

export function organization() { return wrap(ORG); }
export function website() { return wrap(WEBSITE); }

export function softwareApplication() {
  return wrap({
    "@type": "SoftwareApplication",
    name: BRAND,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    description: "An AI wardrobe stylist. Scans your closet, reads the day, recommends one outfit.",
    offers: [
      offerObject("EUR", 10.99, "P1M"),
      offerObject("EUR", 89.99, "P1Y"),
      offerObject("SEK", 119, "P1M"),
      offerObject("SEK", 899, "P1Y")
    ]
  });
}

export function product() {
  return wrap({
    "@type": "Product",
    name: "BURS Premium",
    brand: { "@type": "Brand", name: BRAND },
    description: "Wardrobe scanning, context-aware outfit of the day, AI Stylist chat, week planner, travel capsule builder.",
    offers: [
      offerObject("EUR", 10.99, "P1M"),
      offerObject("EUR", 89.99, "P1Y"),
      offerObject("SEK", 119, "P1M"),
      offerObject("SEK", 899, "P1Y")
    ]
  });
}

export function article(input: {
  headline: string; description: string; url: string;
  datePublished: string; dateModified?: string; image?: string;
}) {
  return wrap({
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: input.image ?? `${SITE}/og-image.png`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { "@id": `${SITE}#org` },
    publisher: { "@id": `${SITE}#org` },
    mainEntityOfPage: input.url
  });
}

export function faqPage(qa: Array<{ q: string; a: string }>) {
  return wrap({
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  });
}

export function howTo(input: { name: string; description: string; steps: Array<{ name: string; text: string }>; }) {
  return wrap({
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  });
}

export function breadcrumbs(items: Array<{ name: string; url: string }>) {
  return wrap({
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  });
}

function offerObject(currency: string, price: number, duration: "P1M" | "P1Y") {
  return {
    "@type": "Offer",
    price,
    priceCurrency: currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: currency,
      billingDuration: duration,
      unitCode: duration === "P1M" ? "MON" : "ANN"
    }
  };
}

function wrap(obj: Record<string, unknown>) {
  return { "@context": "https://schema.org", ...obj };
}
```

- [ ] **Step 2: Write schema.test.ts**

```ts
// src/lib/schema.test.ts
import { describe, it, expect } from 'vitest';
import { organization, faqPage, article, howTo, breadcrumbs, product } from './schema';

describe('schema', () => {
  it('organization has @context and @type', () => {
    const o = organization();
    expect(o['@context']).toBe('https://schema.org');
    expect(o['@type']).toBe('Organization');
  });

  it('faqPage builds mainEntity', () => {
    const f = faqPage([{ q: 'Q1', a: 'A1' }]);
    expect((f.mainEntity as any[])[0].name).toBe('Q1');
  });

  it('article includes datePublished and url as mainEntityOfPage', () => {
    const a = article({ headline: 'h', description: 'd', url: 'https://x.com/a', datePublished: '2026-01-01' });
    expect(a.datePublished).toBe('2026-01-01');
    expect(a.mainEntityOfPage).toBe('https://x.com/a');
  });

  it('howTo numbers steps', () => {
    const h = howTo({ name: 'n', description: 'd', steps: [{ name: 's1', text: 't1' }, { name: 's2', text: 't2' }] });
    expect((h.step as any[])[0].position).toBe(1);
    expect((h.step as any[])[1].position).toBe(2);
  });

  it('breadcrumbs orders items', () => {
    const b = breadcrumbs([{ name: 'A', url: 'https://x/a' }, { name: 'B', url: 'https://x/b' }]);
    expect((b.itemListElement as any[])[1].position).toBe(2);
  });

  it('product carries 4 offers (EUR + SEK, monthly + yearly)', () => {
    const p = product();
    expect((p.offers as any[]).length).toBe(4);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 8 passing (2 from seo + 6 from schema).

- [ ] **Step 4: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts
git commit -m "feat: typed schema.org JSON-LD constructors"
```

---

### Task 15: Schema component

**Files:**
- Create: `src/components/Schema.astro`

- [ ] **Step 1: Write Schema.astro**

```astro
---
// src/components/Schema.astro
interface Props { json: object | object[]; }
const { json } = Astro.props;
const arr = Array.isArray(json) ? json : [json];
---
{arr.map(j => (
  <script type="application/ld+json" set:html={JSON.stringify(j)} />
))}
```

- [ ] **Step 2: Wire site-wide schema into Base.astro**

Edit `src/layouts/Base.astro` — inside `<head>`, before `<slot name="head" />`, add:

```astro
import Schema from "../components/Schema.astro";
import { organization, website } from "../lib/schema";
```
(in the frontmatter)

```astro
<Schema json={[organization(), website()]} />
```
(in the head)

- [ ] **Step 3: Build, inspect output**

```bash
npm run build
grep -l "schema.org" dist/index.html
```

Expected: dist/index.html contains JSON-LD.

- [ ] **Step 4: Commit**

```bash
git add src/components/Schema.astro src/layouts/Base.astro
git commit -m "feat: Schema component injecting site-wide JSON-LD"
```

---

### Task 16: Prices module (single source of truth)

**Files:**
- Create: `src/lib/prices.ts`, `src/lib/prices.test.ts`

- [ ] **Step 1: Write prices.ts**

```ts
// src/lib/prices.ts
export type Locale = "SE" | "EU";

export interface PriceTier { period: "month" | "year"; amount: number; currency: string; symbol: string; }

export const PRICES: Record<Locale, PriceTier[]> = {
  SE: [
    { period: "month", amount: 119, currency: "SEK", symbol: "kr" },
    { period: "year",  amount: 899, currency: "SEK", symbol: "kr" }
  ],
  EU: [
    { period: "month", amount: 10.99, currency: "EUR", symbol: "€" },
    { period: "year",  amount: 89.99, currency: "EUR", symbol: "€" }
  ]
};

export function format(t: PriceTier): string {
  const a = Number.isInteger(t.amount) ? t.amount.toString() : t.amount.toFixed(2);
  return t.symbol === "€" ? `€${a}` : `${a} ${t.symbol}`;
}

export function annualSavingsPct(loc: Locale): number {
  const m = PRICES[loc].find(p => p.period === "month")!;
  const y = PRICES[loc].find(p => p.period === "year")!;
  return Math.round(100 * (1 - y.amount / (m.amount * 12)));
}
```

- [ ] **Step 2: Write prices.test.ts**

```ts
// src/lib/prices.test.ts
import { describe, it, expect } from 'vitest';
import { PRICES, format, annualSavingsPct } from './prices';

describe('prices', () => {
  it('SE prices', () => {
    expect(PRICES.SE[0].amount).toBe(119);
    expect(PRICES.SE[1].amount).toBe(899);
  });

  it('EU prices', () => {
    expect(PRICES.EU[0].amount).toBe(10.99);
    expect(PRICES.EU[1].amount).toBe(89.99);
  });

  it('format uses correct symbol position', () => {
    expect(format(PRICES.SE[0])).toBe('119 kr');
    expect(format(PRICES.EU[0])).toBe('€10.99');
  });

  it('annual savings ~37% (SE) and ~32% (EU)', () => {
    expect(annualSavingsPct('SE')).toBe(37);
    expect(annualSavingsPct('EU')).toBe(32);
  });
});
```

- [ ] **Step 3: Run, verify pass**

```bash
npm test
```

Expected: 12 passing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/prices.ts src/lib/prices.test.ts
git commit -m "feat: prices module with formatter + savings"
```

---

### Task 17: Expand llms.txt

**Files:**
- Modify: `public/llms.txt`

- [ ] **Step 1: Replace `public/llms.txt` with the expanded version**

```
# BURS

> BURS is an AI wardrobe stylist. It scans the clothes you already own, reads the weather and your calendar, and recommends the perfect outfit for every day — plans the week ahead, and packs the right capsule for any trip. No shopping, no feed. Just your closet, finally working for you.

## Definitions

- **Wardrobe scan** — pointing a phone camera at your clothes; BURS uses computer vision to catalogue every piece (colour, fabric, silhouette) in under ten minutes. No manual tagging.
- **The unworn 80%** — the share of a typical wardrobe that never gets worn. BURS is built for this 80%.
- **Context-aware styling** — outfit recommendations that read weather, calendar, location, and yesterday's outfit before suggesting anything.
- **Capsule wardrobe** — a small set of pieces (often ~12) that combine into many outfits. BURS builds capsules from clothes you already own, never recommended to buy.

## What BURS is

- An AI wardrobe stylist on iOS and Android.
- A premium, paid app: 119 kr/mo or 899 kr/yr in Sweden; €10.99/mo or €89.99/yr in the rest of the EU.
- Built for the eighty percent of the closet that never gets worn.

## What BURS is not

- Not a shopping app. BURS never recommends pieces you don't own.
- Not a feed. BURS opens with one outfit, not a grid.
- Not a stylist that shops for you. The pieces it uses are already in your closet.
- Not free. There is no free tier. There are no ads.

## What BURS does

- **Wardrobe scanner.** Computer vision catalogues every piece in under ten minutes.
- **Context-aware outfit of the day.** Reads weather, calendar, location, yesterday's outfit, returns one confident recommendation.
- **Conversational AI stylist.** Refines outfits in plain language ("make this warmer", "softer palette", "something for 7pm dinner").
- **Week planner.** Drafts outfits for every event on your calendar.
- **Travel capsule builder.** Builds a minimum-viable capsule from your wardrobe for any trip.

## Pricing table

| Locale | Monthly | Annual | Annual saves |
|---|---|---|---|
| Sweden | 119 kr | 899 kr | ~37% |
| Rest of EU | €10.99 | €89.99 | ~32% |

No free tier. No ads. Cancel anytime from account settings.

## Privacy

Wardrobe photos stay private to your account. BURS does not sell user data and does not train public models on user images. Every piece and every photo can be deleted from inside the app at any time.

## Quotable lines (canonical URLs)

- "Most of your wardrobe is invisible to you." — https://burs.me/manifesto
- "We built BURS for the eighty percent of your closet that never gets worn." — https://burs.me/manifesto
- "Not a feed. Not a store. Not a stylist that shops for you." — https://burs.me/

## Pages

- Home: https://burs.me/
- Manifesto: https://burs.me/manifesto
- Method: https://burs.me/method
- Pricing: https://burs.me/pricing
- Press: https://burs.me/press
- Answers (long Q&A): https://burs.me/answers
- FAQ: https://burs.me/faq
- Blog: https://burs.me/blog
- Privacy: https://burs.me/privacy
- Terms: https://burs.me/terms
- Sitemap: https://burs.me/sitemap-index.xml

## FAQ

### What is BURS?
BURS is an AI wardrobe stylist. It scans clothes you already own, reads the weather and your calendar, and recommends the perfect outfit for every day.

### How does the wardrobe scan work?
You point a phone camera at your clothes. BURS uses computer vision to catalogue every piece (colour, fabric, silhouette) in under ten minutes. No manual tagging.

### Is BURS free?
No. BURS is a premium app — 119 kr/mo or 899 kr/yr in Sweden (€10.99/mo or €89.99/yr in the rest of the EU). No free tier, no ads. Cancel anytime.

### Does BURS work on iPhone and Android?
Yes. Identical experience on both. Wardrobe syncs across every device you sign into.

### Does BURS recommend clothes I don't own?
No. BURS only recommends pieces already in your wardrobe. You never get pushed into buying anything.

### How does BURS handle my photos and data?
Wardrobe photos stay private to your account. BURS does not sell your data and does not train public models on your images. You can delete every piece and every photo from inside the app at any time.
```

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "feat(seo): expand llms.txt with definitions, prices, quotable lines"
```

---

### Task 18: Robots.txt — explicitly allow AI crawlers

**Files:**
- Modify: `public/robots.txt`

- [ ] **Step 1: Overwrite robots.txt**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://burs.me/sitemap-index.xml
```

- [ ] **Step 2: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): explicit allow for AI training crawlers"
```

---

### Task 19: Cloudflare _redirects (features → method)

**Files:**
- Modify: `public/_redirects`

- [ ] **Step 1: Read current file and add the redirect**

```bash
cat public/_redirects
```

- [ ] **Step 2: Append (or create with) these lines, preserving any existing redirects above them**

```
/features          /method            301
/features/         /method            301
```

- [ ] **Step 3: Commit**

```bash
git add public/_redirects
git commit -m "feat: redirect /features → /method"
```

---

### Task 20: RSS feed

**Files:**
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: Write rss.xml.ts**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(ctx: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => +new Date(b.data.pubDate) - +new Date(a.data.pubDate));
  return rss({
    title: 'BURS — Notes',
    description: 'On wardrobes, dressing, and the unworn 80%.',
    site: ctx.site!,
    items: posts.map(p => ({
      title: p.data.title,
      pubDate: p.data.pubDate,
      description: p.data.description,
      link: `/blog/${p.slug}/`
    }))
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rss.xml.ts
git commit -m "feat: RSS feed at /rss.xml"
```

(Will fail to build until the blog content collection exists — fixed in T45. That's intentional; commit now and move on.)

---

## Phase 3 — Components

### Task 21: HeroVideo component

**Files:**
- Create: `src/components/HeroVideo.astro`

- [ ] **Step 1: Write HeroVideo.astro**

```astro
---
// src/components/HeroVideo.astro
interface Props {
  src: string;
  poster?: string;
  loading?: "eager" | "lazy";
  ariaLabel?: string;
}
const { src, poster, loading = "eager", ariaLabel = "Background film" } = Astro.props;
---
<div class="herovid" data-loading={loading}>
  <video
    autoplay muted loop playsinline preload={loading === "eager" ? "auto" : "metadata"}
    poster={poster}
    aria-label={ariaLabel}
  >
    <source src={src} type="video/mp4" />
  </video>
  <div class="herovid__top" aria-hidden="true"></div>
  <div class="herovid__bot" aria-hidden="true"></div>
</div>

<style>
  .herovid{position:absolute;inset:0;overflow:hidden;background:var(--ink)}
  .herovid video{width:100%;height:100%;object-fit:cover;filter:contrast(1.02) saturate(.95);position:absolute;inset:0}
  .herovid__top{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(14,13,12,.45) 0%,rgba(14,13,12,0) 30%,rgba(14,13,12,0) 60%,rgba(14,13,12,.6) 100%)}
  .herovid__bot{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 90% 80% at 50% 50%,transparent 50%,rgba(14,13,12,.35) 100%)}
</style>

<script>
  // Lazy mount: only attach the source if loading=lazy and within 200px of viewport
  document.querySelectorAll<HTMLDivElement>('.herovid[data-loading="lazy"]').forEach(box => {
    const v = box.querySelector('video') as HTMLVideoElement;
    const source = v.querySelector('source') as HTMLSourceElement;
    const realSrc = source.getAttribute('src')!;
    source.removeAttribute('src');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          source.setAttribute('src', realSrc);
          v.load();
          v.play().catch(()=>{});
          io.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    io.observe(box);
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroVideo.astro
git commit -m "feat: HeroVideo with eager/lazy mounting"
```

---

### Task 22: ActSection component

**Files:**
- Create: `src/components/ActSection.astro`

- [ ] **Step 1: Write ActSection.astro**

```astro
---
// src/components/ActSection.astro
interface Props {
  index: number;             // 1..5
  eyebrow: string;           // e.g. "ONE — THE CLOSET"
  headline: string;          // can include <em>
  lede: string;
  image: string;             // /assets/...
  imageAlt: string;
  reverse?: boolean;         // mirror the layout
  bg?: "cream" | "paper" | "dark" | "ink";
}

const {
  index, eyebrow, headline, lede,
  image, imageAlt, reverse = false, bg = "paper"
} = Astro.props;

const sectionClass = bg === "dark" ? "section--dark" : bg === "ink" ? "section--ink" : bg === "cream" ? "section--cream" : "section--paper";
---
<section class={`act ${sectionClass}`} data-act={index}>
  <div class={`wrap act__grid ${reverse ? "act__grid--reverse" : ""}`}>
    <div class="act__copy">
      <p class="eyebrow">{eyebrow}</p>
      <h2 set:html={headline} />
      <p class="lede">{lede}</p>
      <slot name="extra" />
    </div>
    <div class="act__media">
      <img src={image} alt={imageAlt} loading="lazy" decoding="async" />
    </div>
  </div>
</section>

<style>
  .act{padding-block:clamp(80px,12vh,160px)}
  .section--cream{background:var(--cream)}
  .act__grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,96px);align-items:center}
  .act__grid--reverse .act__copy{order:2}
  .act__copy h2{margin-top:18px;font-weight:200;letter-spacing:-.035em;line-height:.92;text-wrap:balance}
  .act__copy h2 em{font-style:italic;color:var(--gold);font-weight:300}
  .act__copy .lede{margin-top:20px;max-width:42ch}
  .act__media img{width:100%;border-radius:2px;box-shadow:0 30px 60px rgba(0,0,0,.18)}
  @media (max-width:900px){.act__grid{grid-template-columns:1fr}.act__grid--reverse .act__copy{order:0}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ActSection.astro
git commit -m "feat: ActSection component (reused across home page)"
```

---

### Task 23: PullQuote, ManifestoBlock, DropCap components

**Files:**
- Create: `src/components/PullQuote.astro`, `src/components/ManifestoBlock.astro`, `src/components/DropCap.astro`

- [ ] **Step 1: Write PullQuote.astro**

```astro
---
interface Props { cite?: string; align?: "left" | "right"; }
const { cite, align = "left" } = Astro.props;
---
<blockquote class={`pullquote pullquote--${align}`} cite={cite}>
  <slot />
</blockquote>
<style>
  .pullquote{font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(28px,3.4vw,44px);line-height:1.15;letter-spacing:-.02em;color:inherit;max-width:30ch;margin:36px 0;border-left:2px solid var(--gold);padding-left:22px}
  .pullquote--right{border-left:0;border-right:2px solid var(--gold);padding-left:0;padding-right:22px;text-align:right;margin-left:auto}
</style>
```

- [ ] **Step 2: Write ManifestoBlock.astro**

```astro
---
// Six-sentence manifesto-in-miniature stage. Used on home + manifesto page.
---
<section class="thesis section--ink">
  <div class="wrap">
    <p class="eyebrow" style="opacity:.8">— THE THESIS</p>
    <p class="thesis__line">Most of your wardrobe is <em>invisible</em> to you.</p>
    <p class="thesis__line">Eighty percent of what you own never gets worn.</p>
    <p class="thesis__line">Not because you don't like it.</p>
    <p class="thesis__line">Because at 7am you can't see it.</p>
    <p class="thesis__line">BURS reads what's already there. The weather, your day, the trip.</p>
    <p class="thesis__line">And answers in <em>one</em> outfit.</p>
  </div>
</section>
<style>
  .thesis{padding-block:clamp(120px,16vh,200px)}
  .thesis .eyebrow{color:rgba(245,240,232,.65);margin-bottom:32px;display:block}
  .thesis__line{font-family:var(--display);font-weight:200;font-size:clamp(28px,4.2vw,56px);line-height:1.05;letter-spacing:-.025em;color:var(--cream);max-width:24ch;margin-bottom:14px}
  .thesis__line em{font-style:italic;color:var(--gold-bright);font-weight:300}
</style>
```

- [ ] **Step 3: Write DropCap.astro**

```astro
---
---
<span class="dropcap-wrapper"><slot /></span>
<style>
  .dropcap-wrapper :global(p:first-of-type::first-letter){font-family:var(--display);font-style:italic;font-size:6em;float:left;line-height:.8;margin:.05em .08em 0 0;color:var(--gold);font-weight:300}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PullQuote.astro src/components/ManifestoBlock.astro src/components/DropCap.astro
git commit -m "feat: PullQuote + ManifestoBlock + DropCap components"
```

---

### Task 24: ComparisonTable component

**Files:**
- Create: `src/components/ComparisonTable.astro`

- [ ] **Step 1: Write ComparisonTable.astro**

```astro
---
// src/components/ComparisonTable.astro
interface Row { feature: string; burs: string | boolean; b: string | boolean; c: string | boolean; }
interface Props { headings: [string, string, string]; rows: Row[]; caption?: string; }
const { headings, rows, caption } = Astro.props;
function cell(v: string | boolean) {
  if (v === true) return "✓";
  if (v === false) return "—";
  return v;
}
---
<figure class="cmp">
  {caption && <figcaption class="eyebrow">{caption}</figcaption>}
  <table class="cmp__t" role="table">
    <thead>
      <tr>
        <th></th>
        <th class="cmp__brand">{headings[0]}</th>
        <th>{headings[1]}</th>
        <th>{headings[2]}</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(r => (
        <tr>
          <th scope="row">{r.feature}</th>
          <td class="cmp__brand">{cell(r.burs)}</td>
          <td>{cell(r.b)}</td>
          <td>{cell(r.c)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</figure>
<style>
  .cmp{margin:48px 0}
  .cmp__t{width:100%;border-collapse:collapse;font-size:14px;font-family:var(--body)}
  .cmp__t th,.cmp__t td{padding:14px 12px;border-bottom:1px solid rgba(28,25,23,.12);text-align:left;vertical-align:top}
  .cmp__t thead th{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;font-weight:500;color:var(--charcoal-2);border-bottom:1px solid var(--charcoal)}
  .cmp__t tbody th{font-weight:500;font-family:var(--display);font-style:italic;font-size:18px;color:var(--charcoal)}
  .cmp__brand{color:var(--gold-deep);font-weight:600}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ComparisonTable.astro
git commit -m "feat: ComparisonTable component"
```

---

### Task 25: DefinitionList component

**Files:**
- Create: `src/components/DefinitionList.astro`

- [ ] **Step 1: Write DefinitionList.astro**

```astro
---
interface Item { term: string; def: string; }
interface Props { title?: string; items: Item[]; }
const { title, items } = Astro.props;
---
<dl class="defs">
  {title && <p class="eyebrow">{title}</p>}
  {items.map(i => (
    <div class="defs__row">
      <dt><dfn>{i.term}</dfn></dt>
      <dd>{i.def}</dd>
    </div>
  ))}
</dl>
<style>
  .defs{margin:32px 0;display:grid;gap:18px}
  .defs__row{display:grid;grid-template-columns:200px 1fr;gap:24px;padding-bottom:18px;border-bottom:1px solid rgba(28,25,23,.1)}
  .defs__row dt{font-family:var(--display);font-style:italic;font-weight:400;font-size:18px;color:var(--charcoal)}
  .defs__row dt dfn{font-style:inherit}
  .defs__row dd{font-family:var(--serif);font-style:italic;font-size:17px;line-height:1.5;color:var(--charcoal-2)}
  @media (max-width:700px){.defs__row{grid-template-columns:1fr;gap:6px}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DefinitionList.astro
git commit -m "feat: DefinitionList with <dfn> for AI quotability"
```

---

### Task 26: PriceCard component

**Files:**
- Create: `src/components/PriceCard.astro`

- [ ] **Step 1: Write PriceCard.astro**

```astro
---
import { PRICES, format, annualSavingsPct, type Locale } from "../lib/prices";
interface Props { locale: Locale; emphasize?: "month" | "year"; }
const { locale, emphasize = "year" } = Astro.props;
const tiers = PRICES[locale];
const savings = annualSavingsPct(locale);
const localeLabel = locale === "SE" ? "Sweden" : "Rest of EU";
---
<article class="pc">
  <header class="pc__head">
    <p class="eyebrow">BURS Premium · {localeLabel}</p>
    <h3 class="pc__title">One subscription. <em>Your</em> closet.</h3>
  </header>
  <ul class="pc__tiers" role="list">
    {tiers.map(t => (
      <li class={`pc__tier ${t.period === emphasize ? "is-on" : ""}`}>
        <span class="pc__amt">{format(t)}</span>
        <span class="pc__per">per {t.period}</span>
        {t.period === "year" && <span class="pc__save">Save ~{savings}%</span>}
      </li>
    ))}
  </ul>
  <ul class="pc__incl" role="list">
    <li>Unlimited wardrobe scanning</li>
    <li>Context-aware outfit of the day</li>
    <li>AI Stylist chat</li>
    <li>Week planner</li>
    <li>Travel capsule builder</li>
    <li>Wardrobe insights · Priority support</li>
  </ul>
  <p class="pc__not">No free tier. No ads. Cancel anytime from account settings.</p>
  <a class="cta" href="https://apps.apple.com/app/burs">Get the app <span class="cta__arrow">→</span></a>
</article>
<style>
  .pc{background:var(--cream-paper);border:1px solid rgba(28,25,23,.1);padding:40px 36px;max-width:520px;display:grid;gap:22px}
  .pc__title{font-size:clamp(28px,3.4vw,42px);font-weight:200;letter-spacing:-.025em;line-height:1.05;color:var(--charcoal);margin-top:8px}
  .pc__title em{font-style:italic;color:var(--gold);font-weight:300}
  .pc__tiers{list-style:none;display:grid;gap:8px;border-top:1px solid rgba(28,25,23,.1);border-bottom:1px solid rgba(28,25,23,.1);padding:14px 0}
  .pc__tier{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:baseline;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.7}
  .pc__tier.is-on{opacity:1}
  .pc__amt{font-family:var(--display);font-style:italic;font-weight:400;font-size:28px;letter-spacing:-.01em;text-transform:none;color:var(--charcoal)}
  .pc__save{color:var(--gold-deep)}
  .pc__incl{list-style:none;display:grid;gap:6px;font-size:14px;color:var(--charcoal-2)}
  .pc__incl li::before{content:"— ";color:var(--gold);font-weight:500}
  .pc__not{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;opacity:.55}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PriceCard.astro
git commit -m "feat: PriceCard component"
```

---

### Task 27: Reveal-on-scroll micro-script

**Files:**
- Create: `src/components/Reveal.astro`

- [ ] **Step 1: Write Reveal.astro**

```astro
---
// Drop in once per page. Adds .in to elements with .reveal when they enter viewport.
---
<script>
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Reveal.astro
git commit -m "feat: Reveal-on-scroll script"
```

---

### Task 28: AntiList component (the "what BURS is not" block)

**Files:**
- Create: `src/components/AntiList.astro`

- [ ] **Step 1: Write AntiList.astro**

```astro
---
const denials = [
  "Not a feed.",
  "Not a store.",
  "Not a stylist that shops for you.",
  "Not free. Not ad-supported.",
  "Not training on your closet."
];
---
<section class="not section--ink">
  <div class="wrap">
    <p class="eyebrow" style="color:rgba(245,240,232,.6)">— WHAT BURS IS NOT</p>
    <ul class="anti" role="list">
      {denials.map(d => <li>{d}</li>)}
    </ul>
  </div>
</section>
<style>
  .not{padding-block:clamp(100px,14vh,180px)}
  .not .eyebrow{margin-bottom:36px;display:block}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AntiList.astro
git commit -m "feat: AntiList component (what BURS is not)"
```

---

### Task 29: ChatTranscript component (Act III)

**Files:**
- Create: `src/components/ChatTranscript.astro`

- [ ] **Step 1: Write ChatTranscript.astro**

```astro
---
interface Turn { who: "you" | "burs"; text: string; }
interface Props { turns: Turn[]; }
const { turns } = Astro.props;
---
<div class="chat" role="list" aria-label="Sample conversation with the BURS stylist">
  {turns.map(t => (
    <div class={`chat__row chat__row--${t.who}`} role="listitem">
      <span class="chat__who">{t.who === "you" ? "You" : "BURS"}</span>
      <p class="chat__text">{t.text}</p>
    </div>
  ))}
</div>
<style>
  .chat{display:grid;gap:14px;font-size:15px;font-family:var(--serif);font-style:italic;max-width:46ch}
  .chat__row{display:grid;grid-template-columns:60px 1fr;gap:18px;align-items:baseline;padding:12px 0;border-bottom:1px dashed rgba(28,25,23,.18)}
  .chat__row--burs{color:var(--gold-deep)}
  .chat__who{font-family:var(--mono);font-style:normal;font-size:9px;letter-spacing:.25em;text-transform:uppercase;opacity:.55;padding-top:4px}
  .chat__text{line-height:1.45}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatTranscript.astro
git commit -m "feat: ChatTranscript component for Act III"
```

---

## Phase 4 — Static pages

### Task 30: /privacy

**Files:**
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: Read existing privacy page**

```bash
cat privacy/index.html | head -200
```

(Old route still exists at the repo root from the static site; the body copy is what we're carrying over.)

- [ ] **Step 2: Write src/pages/privacy.astro**

```astro
---
import Editorial from "../layouts/Editorial.astro";
---
<Editorial
  title="Privacy — BURS"
  description="How BURS handles your wardrobe photos and data. Short version: we don't sell, we don't train public models on user images, and you can delete everything from inside the app."
  path="/privacy"
  eyebrow="Privacy"
  headline="What we do, and don't do, with your closet."
>
  <p>BURS is a premium app. We sell subscriptions. We do not sell user data, we do not sell wardrobe photos, and we do not train public models on user images. The product depends on you trusting us with what's in your closet, so the rules below are absolute.</p>

  <h2>What we collect</h2>
  <p><strong>Photos and metadata of your clothes.</strong> Stored privately in your account. Visible only to you.</p>
  <p><strong>Account information.</strong> Email, password (hashed), subscription status.</p>
  <p><strong>Use signals.</strong> Aggregated, non-identifying analytics — what features get used, what crashes happen. We use this to fix bugs and prioritise work.</p>

  <h2>What we don't do</h2>
  <p>We do not sell user data to advertisers, brokers, retailers, or AI companies. We do not train publicly-available models on your wardrobe photos. We do not allow third-party SDKs to read your wardrobe. We do not display ads.</p>

  <h2>Deletion</h2>
  <p>Every piece and every photo can be deleted from inside the app at any time. Account deletion removes everything from our systems within 30 days.</p>

  <h2>Contact</h2>
  <p>Privacy questions: <a href="mailto:hello@burs.me">hello@burs.me</a>.</p>
</Editorial>
```

- [ ] **Step 3: Build, verify**

```bash
npm run build
ls dist/privacy/index.html
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/privacy.astro
git commit -m "feat: /privacy"
```

---

### Task 31: /terms

**Files:**
- Create: `src/pages/terms.astro`

- [ ] **Step 1: Write src/pages/terms.astro**

```astro
---
import Editorial from "../layouts/Editorial.astro";
const updated = "May 6, 2026";
---
<Editorial
  title="Terms — BURS"
  description="Terms of service for BURS. Premium app, no free tier, cancel anytime."
  path="/terms"
  eyebrow="Terms of service"
  headline="The deal."
>
  <p><em>Last updated: {updated}.</em></p>

  <h2>1. The product</h2>
  <p>BURS is an AI wardrobe stylist app for iOS and Android. It scans clothes you already own and recommends outfits from your existing wardrobe.</p>

  <h2>2. Subscription</h2>
  <p>BURS Premium is 119 kr/month or 899 kr/year in Sweden, and €10.99/month or €89.99/year in the rest of the EU. There is no free tier. You can cancel anytime from your account settings or via the App Store / Google Play. Cancellation takes effect at the end of the current billing period.</p>

  <h2>3. Acceptable use</h2>
  <p>Don't share your account. Don't try to extract or scrape another user's wardrobe. Don't use BURS to build a competing dataset. Don't upload images you don't have the right to upload.</p>

  <h2>4. Liability</h2>
  <p>BURS recommends outfits. It is not legal, medical, or fashion-emergency advice. We are not liable for losses arising from outfit choices.</p>

  <h2>5. Changes</h2>
  <p>We may update these terms. If we do, we'll update the "Last updated" date and notify you in-app for any material change.</p>

  <h2>6. Contact</h2>
  <p>Questions: <a href="mailto:hello@burs.me">hello@burs.me</a>.</p>
</Editorial>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/terms.astro
git commit -m "feat: /terms"
```

---

### Task 32: /press

**Files:**
- Create: `src/pages/press.astro`

- [ ] **Step 1: Write src/pages/press.astro**

```astro
---
import Page from "../layouts/Page.astro";
---
<Page
  title="Press — BURS"
  description="Press kit, founder bio, and contact for BURS — an AI wardrobe stylist."
  path="/press"
  eyebrow="Press"
  headline="A short note for <em>editors</em>."
  lede="Logos, screenshots, founder bio, and a sober paragraph you can paste into a piece. For interviews, write hello@burs.me."
>
  <div class="press">
    <section class="press__block">
      <p class="eyebrow">— Boilerplate</p>
      <p class="press__paragraph">
        BURS is an AI wardrobe stylist. It scans the clothes you already own, reads the weather and your calendar, and recommends one outfit for the day, the week, or a trip. BURS is paid: 119 kr/month or 899 kr/year in Sweden, and €10.99/month or €89.99/year in the rest of the EU. There is no free tier and no advertising. The app is on iOS and Android. BURS is independent and based in Stockholm.
      </p>
    </section>

    <section class="press__block">
      <p class="eyebrow">— Founder</p>
      <p>Founder bio (4 sentences), available on request: <a href="mailto:hello@burs.me">hello@burs.me</a>.</p>
    </section>

    <section class="press__block">
      <p class="eyebrow">— Downloads</p>
      <ul class="press__dl" role="list">
        <li><a href="/logo-512.png" download>Wordmark · PNG (512px)</a></li>
        <li><a href="/burs-logo-256-2.png" download>Wordmark · PNG (256px, alt)</a></li>
        <li><a href="/og-image.png" download>Default OG image · PNG</a></li>
      </ul>
      <p class="press__note">Need vector files or the full screenshot pack? Email and we'll send within 24 hours.</p>
    </section>

    <section class="press__block">
      <p class="eyebrow">— Contact</p>
      <p>Press inquiries, interviews, partnerships: <a href="mailto:hello@burs.me">hello@burs.me</a>.</p>
      <p class="press__note">BURS uses a single contact address — <code>hello@burs.me</code> — for press, support, and partnerships.</p>
    </section>
  </div>
</Page>

<style>
  .press{display:grid;gap:64px;max-width:780px}
  .press__block{display:grid;gap:14px}
  .press__paragraph{font-family:var(--serif);font-style:italic;font-size:19px;line-height:1.55;color:var(--charcoal-2);max-width:60ch}
  .press__dl{list-style:none;display:grid;gap:8px}
  .press__dl a{font-size:15px;border-bottom:1px solid currentColor;display:inline-block;padding-bottom:1px}
  .press__note{font-size:13px;opacity:.65}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/press.astro
git commit -m "feat: /press"
```

---

### Task 33: /faq

**Files:**
- Create: `src/pages/faq.astro`

- [ ] **Step 1: Write faq.astro**

```astro
---
import Page from "../layouts/Page.astro";
import Schema from "../components/Schema.astro";
import { faqPage } from "../lib/schema";

const qa = [
  { q: "What is BURS?", a: "BURS is an AI wardrobe stylist for iOS and Android. It scans the clothes you already own and recommends outfits, plans the week, and packs trips — using only your existing wardrobe." },
  { q: "How does the wardrobe scan work?", a: "Point a phone camera at your clothes. BURS uses computer vision to catalogue every piece — colour, fabric, silhouette — in under ten minutes. No manual tagging." },
  { q: "Is BURS free?", a: "No. BURS is a premium app: 119 kr/month or 899 kr/year in Sweden; €10.99/month or €89.99/year in the rest of the EU. No free tier, no ads. Cancel anytime." },
  { q: "Does BURS work on iPhone and Android?", a: "Yes. Identical experience on both. Your wardrobe syncs across every device you sign into." },
  { q: "Does BURS recommend clothes I don't own?", a: "No. BURS only recommends pieces already in your wardrobe. It is the opposite of a shopping app." },
  { q: "How does BURS handle my photos and data?", a: "Wardrobe photos stay private to your account. BURS does not sell user data and does not train public models on user images. Every piece and every photo can be deleted from inside the app at any time." },
  { q: "What is the AI Stylist chat?", a: "A natural-language refinement layer. Ask 'make this warmer', 'softer palette', 'something for a 7pm dinner' — BURS adjusts the outfit using pieces you already own." },
  { q: "How does the week planner work?", a: "Sync your calendar and BURS drafts an outfit for every event — Monday's pitch, Thursday's dinner, Saturday's off-site. You can swap any piece in one tap." },
  { q: "What does the travel capsule builder do?", a: "Tell BURS where you're going and for how long. It builds a minimum-viable capsule from your own wardrobe — every piece earning its place, every outfit pre-imagined." },
  { q: "Where does BURS work geographically?", a: "iOS and Android, English UI, EU (with Sweden as the home market). Other regions: ask via hello@burs.me." },
  { q: "Is there a web app?", a: "No. BURS is mobile-first by design — your camera is on your phone, and that's where styling happens." },
  { q: "Does BURS use my data to train its AI?", a: "No public-model training on user images. Internal model improvements happen on opt-in, anonymised data only." },
  { q: "How do I cancel?", a: "From inside the app: Settings → Subscription → Cancel. Or from the App Store / Google Play. Cancellation takes effect at the end of the current period." },
  { q: "What if BURS doesn't have an outfit I like?", a: "Tell the AI Stylist what's wrong. It refines in a sentence. If you want to start over, swipe down and the recommendation regenerates." },
  { q: "Who built BURS?", a: "An independent team in Stockholm. For founder details, see /press." }
];
---
<Page
  title="FAQ — BURS"
  description="Quick answers about BURS: what it does, what it costs, how it handles photos."
  path="/faq"
  eyebrow="FAQ"
  headline="Quick <em>answers</em>."
  lede="The short version. For the long form, see /answers."
>
  <ul class="faq" role="list">
    {qa.map(({ q, a }) => (
      <li>
        <details>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      </li>
    ))}
  </ul>
  <p style="margin-top:48px;font-size:14px;opacity:.7">Still curious? <a href="/answers" style="border-bottom:1px solid">Read 50 questions, answered honestly →</a></p>
  <Schema slot="head" json={faqPage(qa)} />
</Page>

<style>
  .faq{list-style:none;display:grid;gap:0;max-width:780px;border-top:1px solid rgba(28,25,23,.15)}
  .faq li{border-bottom:1px solid rgba(28,25,23,.15)}
  details{padding:24px 0}
  summary{cursor:pointer;font-family:var(--display);font-style:italic;font-weight:400;font-size:clamp(20px,2vw,26px);line-height:1.25;color:var(--charcoal);list-style:none;display:flex;justify-content:space-between;align-items:start;gap:18px}
  summary::-webkit-details-marker{display:none}
  summary::after{content:"+";color:var(--gold);font-family:var(--mono);font-style:normal;font-size:18px;flex-shrink:0;transition:transform .35s var(--eo)}
  details[open] summary::after{content:"–"}
  details p{margin-top:14px;font-family:var(--serif);font-style:italic;font-size:17px;line-height:1.55;color:var(--charcoal-2);max-width:60ch}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/faq.astro
git commit -m "feat: /faq with FAQPage schema"
```

---

### Task 34: /pricing

**Files:**
- Create: `src/pages/pricing.astro`

- [ ] **Step 1: Write pricing.astro**

```astro
---
import Page from "../layouts/Page.astro";
import PriceCard from "../components/PriceCard.astro";
import ComparisonTable from "../components/ComparisonTable.astro";
import Schema from "../components/Schema.astro";
import { product } from "../lib/schema";
---
<Page
  title="Pricing — BURS"
  description="BURS Premium: 119 kr/mo or 899 kr/yr (Sweden), €10.99/mo or €89.99/yr (rest of EU). No free tier. No ads. Cancel anytime."
  path="/pricing"
  eyebrow="Pricing"
  headline="One subscription. <em>Your</em> closet."
  lede="A single tier. Prices below in Swedish kronor and Euros. Annual saves about a third."
>
  <div class="pricing">
    <div class="pricing__cards">
      <PriceCard locale="SE" />
      <PriceCard locale="EU" />
    </div>

    <section class="pricing__not">
      <p class="eyebrow">— What's not included</p>
      <ul class="anti" style="color:var(--charcoal)" role="list">
        <li>No free tier.</li>
        <li>No ads.</li>
        <li>No shopping. We never recommend pieces you don't own.</li>
        <li>No data sale. No training on your wardrobe.</li>
      </ul>
    </section>

    <section class="pricing__cmp">
      <ComparisonTable
        caption="HONEST COMPARISON"
        headings={["BURS", "Whering", "Pinterest"]}
        rows={[
          { feature: "Uses only clothes you own",   burs: true,  b: true,  c: false },
          { feature: "One outfit (not a feed)",     burs: true,  b: false, c: false },
          { feature: "Reads weather + calendar",    burs: true,  b: false, c: false },
          { feature: "Conversational refinement",   burs: true,  b: false, c: false },
          { feature: "Travel capsule builder",      burs: true,  b: "partial", c: false },
          { feature: "Free tier",                   burs: false, b: true,  c: true  },
          { feature: "Ads",                         burs: false, b: false, c: true  }
        ]}
      />
      <p class="pricing__honest">An honest comparison is opinion, not fact-claim. We picked the comparison fields we thought mattered most. Your priorities may be different.</p>
    </section>
  </div>

  <Schema slot="head" json={product()} />
</Page>

<style>
  .pricing{display:grid;gap:80px;max-width:980px}
  .pricing__cards{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  @media (max-width:780px){.pricing__cards{grid-template-columns:1fr}}
  .pricing__not{display:grid;gap:18px}
  .pricing__honest{font-size:13px;opacity:.55;font-style:italic;margin-top:14px;max-width:54ch}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/pricing.astro
git commit -m "feat: /pricing with PriceCards + comparison + Product schema"
```

---

### Task 35: /method

**Files:**
- Create: `src/pages/method.astro`

- [ ] **Step 1: Write method.astro**

```astro
---
import Page from "../layouts/Page.astro";
import Schema from "../components/Schema.astro";
import { howTo } from "../lib/schema";

const steps = [
  { name: "The scan",            text: "Point a phone camera at your clothes. BURS uses computer vision to catalogue every piece — colour, fabric, silhouette, formality — in under ten minutes. No manual tagging." },
  { name: "The catalogue",       text: "Each piece is stored as structured data: hue, value, weight, length, pattern, season-fit. Your closet becomes queryable for the first time." },
  { name: "The context read",    text: "Before recommending anything, BURS reads the weather, your calendar, your location, and yesterday's outfit. The day, understood." },
  { name: "The recommendation",  text: "BURS returns one outfit. Not twenty. One. Tap to wear; swipe down to regenerate; tap any piece to see why it was chosen." },
  { name: "Chat refinement",     text: "Ask in plain language: 'make this warmer', 'softer palette', 'something for a 7pm dinner'. The stylist refines in a sentence — using pieces you already own." },
  { name: "Week & travel",       text: "Sync your calendar and BURS drafts outfits for every event. Tell it where you're going and for how long, and it builds a minimum-viable capsule from your wardrobe." }
];
---
<Page
  title="Method — BURS"
  description="How BURS reads a closet, the day, and a trip — without ever asking you to shop."
  path="/method"
  eyebrow="Method"
  headline="How BURS <em>reads</em> a closet."
  lede="Six steps. No manual tagging, no styling questionnaire, no shopping list. Just your closet, finally working."
>
  <ol class="method" role="list">
    {steps.map((s, i) => (
      <li class="method__step">
        <span class="method__num">0{i+1}</span>
        <div class="method__copy">
          <h3>{s.name}</h3>
          <p>{s.text}</p>
        </div>
      </li>
    ))}
  </ol>

  <Schema slot="head" json={howTo({ name: "How BURS works", description: "From the wardrobe scan to a packed travel capsule.", steps })} />
</Page>

<style>
  .method{list-style:none;display:grid;gap:48px;counter-reset:m;max-width:880px}
  .method__step{display:grid;grid-template-columns:120px 1fr;gap:32px;padding-bottom:48px;border-bottom:1px solid rgba(28,25,23,.12)}
  .method__num{font-family:var(--mono);font-size:13px;letter-spacing:.22em;color:var(--gold-deep)}
  .method__copy h3{font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(28px,3vw,42px);letter-spacing:-.02em;line-height:1.05;color:var(--charcoal)}
  .method__copy p{margin-top:14px;font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.55;color:var(--charcoal-2);max-width:54ch}
  @media (max-width:700px){.method__step{grid-template-columns:1fr;gap:14px}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/method.astro
git commit -m "feat: /method with HowTo schema"
```

---

### Task 36: /manifesto

**Files:**
- Create: `src/pages/manifesto.astro`

- [ ] **Step 1: Write manifesto.astro**

```astro
---
import Editorial from "../layouts/Editorial.astro";
import PullQuote from "../components/PullQuote.astro";
import DefinitionList from "../components/DefinitionList.astro";
import Schema from "../components/Schema.astro";
import { article } from "../lib/schema";

const url = "https://burs.me/manifesto";
const datePublished = "2026-05-06";
---
<Editorial
  title="Manifesto — BURS"
  description="We built BURS for the eighty percent of your closet that never gets worn. The thesis behind an AI wardrobe stylist that refuses to sell you anything."
  path="/manifesto"
  eyebrow="The thesis"
  headline="We built BURS for the <em>eighty percent</em> of your closet that never gets worn."
  type="article"
>
  <p class="dropcap">Most of your wardrobe is invisible to you. Eighty percent of what you own never gets worn — not because you don't like it, but because you can't see it from inside a closet at 7am. The shirt is folded behind another. The jacket is one hanger out of view. The dress was bought for a job you no longer have. The combination you'd love never occurred to you because you've never seen those two pieces at the same time.</p>

  <p>This is the problem BURS exists to solve. Not the problem of <em>not having enough clothes</em>. The problem of <em>not seeing the clothes you already have</em>.</p>

  <h2>The unworn 80%</h2>

  <p>The number is informal — different studies put it between 50% and 80% — but the experience is universal. You stand in front of an open closet and feel that you have nothing to wear. The truth is the opposite: you have too much, and your eye is overloaded.</p>

  <PullQuote cite={url}>The closet, finally read.</PullQuote>

  <p>BURS reads what's already there. A wardrobe scan takes under ten minutes — point a phone camera at your clothes, tap once per cluster, done. Every piece becomes structured: colour, fabric, silhouette, formality, season-fit. Your closet, for the first time, is something you can ask questions of.</p>

  <h2>Why feeds make it worse</h2>

  <p>Every fashion app, instinctively, returns to the feed. Pinterest is a feed. Whering is a feed. Instagram Shopping is a feed. The feed is a default because it transfers the cost of choosing onto the user — twenty options, scroll, scroll, scroll, eventually a pin. The feed is also where shopping lives. Every fourth tile is something you could buy. The feed is, in the end, optimised for the platform's revenue, not your morning.</p>

  <p>BURS does the opposite. One outfit. Not twenty. The cost of choosing has been moved off the user, onto the model.</p>

  <PullQuote cite={url} align="right">One outfit. Not twenty. The cost of choosing has been moved off the user, onto the model.</PullQuote>

  <h2>What "one outfit" actually means</h2>

  <p>Before BURS recommends anything, it reads the weather, your calendar, your location, and yesterday's outfit. The day, understood. The recommendation that arrives is specific to <em>this</em> Tuesday, not a generic Tuesday. If you don't like it, the AI Stylist refines in a sentence — make this warmer, soften the palette, give me something for a 7pm dinner. Every refinement uses pieces already in your wardrobe.</p>

  <p>The week works the same way. The trip works the same way. The capsule packs the city in twelve pieces. Your closet, finally working for you.</p>

  <h2>What we will never do</h2>

  <ul style="list-style:none;display:grid;gap:8px;font-family:var(--display);font-style:italic;font-size:24px;color:var(--charcoal);margin:24px 0">
    <li>— We will never recommend pieces you don't own.</li>
    <li>— We will never sell your wardrobe data.</li>
    <li>— We will never train public models on your images.</li>
    <li>— We will never run ads.</li>
    <li>— We will never replace one outfit with twenty options.</li>
  </ul>

  <DefinitionList
    items={[
      { term: "The unworn 80%", def: "The share of a typical wardrobe that never gets worn — the pieces you forgot, the combinations you never saw, the trip you'll repack from scratch on Sunday." },
      { term: "Wardrobe scan", def: "Pointing a phone camera at your clothes; BURS uses computer vision to catalogue every piece (colour, fabric, silhouette) in under ten minutes." },
      { term: "Context-aware styling", def: "Outfit recommendations that read the weather, your calendar, your location, and yesterday's outfit before suggesting anything." }
    ]}
  />

  <p style="margin-top:80px;font-style:normal;font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.55">— Signed: BURS, Stockholm, 2026.</p>

  <Schema
    slot="head"
    json={article({
      headline: "We built BURS for the eighty percent of your closet that never gets worn.",
      description: "The manifesto behind an AI wardrobe stylist that refuses to sell you anything.",
      url,
      datePublished
    })}
  />
</Editorial>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/manifesto.astro
git commit -m "feat: /manifesto"
```

---

### Task 37: /answers

**Files:**
- Create: `src/pages/answers.astro`

- [ ] **Step 1: Write answers.astro**

```astro
---
import Editorial from "../layouts/Editorial.astro";
import Schema from "../components/Schema.astro";
import { faqPage } from "../lib/schema";

interface QA { q: string; a: string; }
interface Section { title: string; qas: QA[]; }

const sections: Section[] = [
  {
    title: "About BURS",
    qas: [
      { q: "What is BURS in one sentence?", a: "BURS is an AI wardrobe stylist that recommends outfits from clothes you already own — reading weather, calendar, and the trip — and never asks you to shop." },
      { q: "Who built BURS, and where?", a: "An independent team in Stockholm. The product launched in 2026. We are not part of a larger fashion or retail group." },
      { q: "What's the company behind the app?", a: "BURS is the company. We are independent and self-funded at this stage. We have no advertising revenue and no plans to introduce any." },
      { q: "Where does the name come from?", a: "BURS is short and unattached to fashion vocabulary on purpose. The product is the meaning, not the name." }
    ]
  },
  {
    title: "The product",
    qas: [
      { q: "How does the wardrobe scan work?", a: "You point a phone camera at your clothes. Computer vision catalogues every piece — colour, fabric, silhouette, formality — in under ten minutes. No manual tagging, no spreadsheets, no questionnaire." },
      { q: "What information does BURS use to pick an outfit?", a: "Four inputs: the weather where you are, today's calendar events, your location, and yesterday's outfit. From those, it picks one outfit from your wardrobe." },
      { q: "Why one outfit instead of twenty?", a: "Because twenty is the problem, not the solution. A grid of options moves the cost of choosing onto the user. One confident recommendation moves it onto the model." },
      { q: "How does the chat work?", a: "Natural language. 'Make this warmer.' 'Softer palette.' 'Something for a 7pm dinner.' The stylist refines using pieces you already own — never proposing something you'd have to buy." },
      { q: "What does the week planner do?", a: "Sync your calendar and BURS drafts an outfit for every event. Monday's pitch, Thursday's dinner, Saturday's off-site. You can swap any piece with one tap." },
      { q: "What does the travel capsule builder do?", a: "Tell BURS where you're going and for how long. It builds a minimum-viable capsule — typically 10–14 pieces for a 3–5 day trip — from your existing wardrobe. Every outfit is pre-imagined." },
      { q: "How fast is 'opening the app to a ready outfit'?", a: "The product target is under five seconds, median. Most days it's quicker." }
    ]
  },
  {
    title: "Privacy",
    qas: [
      { q: "Do you sell user data?", a: "No. BURS is a paid app. We make money from subscriptions. We do not sell user data and have no plans to start." },
      { q: "Do you train public models on user wardrobe images?", a: "No. Improvements to internal models happen on opt-in, anonymised data only — never on identifiable user images." },
      { q: "Where are wardrobe photos stored?", a: "Privately, in your account. Visible only to you. Never shared with third parties or other BURS users." },
      { q: "Can I delete my data?", a: "Yes. Every piece and every photo can be deleted from inside the app at any time. Account deletion removes everything from our systems within 30 days." },
      { q: "Do you allow third-party SDKs to read my wardrobe?", a: "No. Third-party SDKs do not have access to wardrobe data." },
      { q: "Are you GDPR-compliant?", a: "Yes. As a Sweden-based company serving the EU, GDPR compliance is foundational, not optional." }
    ]
  },
  {
    title: "Pricing",
    qas: [
      { q: "How much does BURS cost?", a: "BURS Premium is 119 kr/month or 899 kr/year in Sweden, and €10.99/month or €89.99/year in the rest of the EU. There is no free tier." },
      { q: "Is there a free trial?", a: "Not as of v1. We may add a 7-day trial — if we do, it'll be a single trial per Apple/Google account, not a perpetual freemium tier." },
      { q: "Why no free tier?", a: "Free tiers in fashion apps are usually subsidised by ads or data sale. Both are things BURS will never do, so a free tier doesn't pencil out. The yearly subscription is structured to be the obviously-better deal." },
      { q: "Is the annual price really cheaper?", a: "Yes. The Sweden annual saves ~37% versus paying month-by-month. The EU annual saves ~32%." },
      { q: "Can I cancel?", a: "Anytime. From inside the app, or from the App Store / Google Play. Cancellation takes effect at the end of the current period." },
      { q: "Are taxes included?", a: "Prices shown are inclusive of VAT for both Sweden and the rest of the EU." }
    ]
  },
  {
    title: "Travel & week",
    qas: [
      { q: "How does the travel capsule decide what to pack?", a: "Trip length, destination weather, planned events from your calendar, and the formality range you signal. The output is a packing list of 10–14 pieces with every outfit already imagined." },
      { q: "What if I change my plans mid-trip?", a: "Re-open the planner. The capsule re-resolves around the new days. The pieces don't change; the outfit assignments do." },
      { q: "Can the week planner handle dress codes?", a: "Yes — formal/business/business-casual/casual, plus user-defined slots like 'gym' or 'studio'. You teach it your codes once." },
      { q: "Can I plan further than a week?", a: "Yes. The default view is one week; you can extend up to four." }
    ]
  },
  {
    title: "Common confusions",
    qas: [
      { q: "Is BURS a shopping app?", a: "No. BURS is the opposite of a shopping app. It only recommends pieces you already own and never pushes you toward retail." },
      { q: "Will BURS suggest I buy something?", a: "No. There is no shopping surface in the app." },
      { q: "Is BURS a feed?", a: "No. BURS opens with one outfit. There is no scrollable grid of inspiration." },
      { q: "Is BURS a Whering / Cladwell / Save Your Wardrobe alternative?", a: "BURS occupies the same shelf — apps that work with what you already own — but the design is different. Where those apps surface options, BURS surfaces a single recommendation. Where they tag, BURS scans." },
      { q: "Will BURS work for a tiny wardrobe?", a: "Yes. A wardrobe of 30 pieces produces excellent recommendations. The capsule mode actually shines on smaller wardrobes." },
      { q: "Will BURS work for a very large wardrobe?", a: "Yes — and is arguably more useful there. The unworn 80% is biggest in the largest wardrobes." }
    ]
  },
  {
    title: "For press",
    qas: [
      { q: "What's the press contact?", a: "hello@burs.me." },
      { q: "Where can I get screenshots and the wordmark?", a: "/press has the basics. Email for full vector and high-resolution packs — we ship within 24 hours." },
      { q: "Are interviews available?", a: "Yes. Email hello@burs.me with your timeline and we'll find a slot." }
    ]
  }
];

const flatQA = sections.flatMap(s => s.qas);
---
<Editorial
  title="Answers — BURS"
  description="Fifty questions about BURS, answered honestly. Product, privacy, pricing, travel, common confusions, press."
  path="/answers"
  eyebrow="Long-form Q&A"
  headline="Fifty questions, <em>answered</em> honestly."
  type="article"
>
  {sections.map(sec => (
    <section style="margin-bottom:80px">
      <h2>{sec.title}</h2>
      {sec.qas.map(qa => (
        <article style="margin:32px 0;display:grid;gap:12px">
          <p style="font-family:var(--display);font-style:italic;font-size:22px;color:var(--charcoal);margin:0">{qa.q}</p>
          <p style="margin:0">{qa.a}</p>
        </article>
      ))}
    </section>
  ))}

  <Schema slot="head" json={faqPage(flatQA)} />
</Editorial>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/answers.astro
git commit -m "feat: /answers — long-form Q&A with FAQPage schema"
```

---

## Phase 5 — Home page

### Task 38: Home — hero block

**Files:**
- Create: `src/pages/index.astro` (overwrite the placeholder)

- [ ] **Step 1: Replace src/pages/index.astro with the hero scaffold**

```astro
---
import Base from "../layouts/Base.astro";
import HeroVideo from "../components/HeroVideo.astro";
import ManifestoBlock from "../components/ManifestoBlock.astro";
import ActSection from "../components/ActSection.astro";
import ChatTranscript from "../components/ChatTranscript.astro";
import AntiList from "../components/AntiList.astro";
import PriceCard from "../components/PriceCard.astro";
import Reveal from "../components/Reveal.astro";
import Schema from "../components/Schema.astro";
import { softwareApplication, product } from "../lib/schema";

const HERO_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_39xEmGU99Nuf1tLPDo7HCGecTiT/hf_20260503_095006_fd4e35b8-e575-4e10-9226-e211d064d80c.mp4";
const REPRISE_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_39xEmGU99Nuf1tLPDo7HCGecTiT/hf_20260503_152337_bcd15c00-1a73-4cb8-b74a-032510047a3a.mp4";
---
<Base
  title="BURS — Your wardrobe, intelligently styled."
  description="An AI wardrobe stylist. Scans the clothes you already own, reads the weather and your calendar, and recommends one outfit for every day."
  path="/"
  bodyClass="dark-nav"
>
  <Schema slot="head" json={[softwareApplication(), product()]} />

  <section class="hero" aria-label="Hero">
    <HeroVideo src={HERO_VIDEO} loading="eager" ariaLabel="BURS hero film" />
    <div class="hero__strip" aria-hidden="true">
      <span class="rec">REC · STOCKHOLM</span>
      <span class="hero__center">An AI wardrobe stylist.</span>
      <span>EST. 2026 · EU</span>
    </div>
    <div class="hero__text">
      <h1 class="hero__h1">Most of your wardrobe is <em>invisible</em> to you.</h1>
      <div class="hero__cta">
        <a class="cta cta--cream" href="https://apps.apple.com/app/burs">Get the app <span class="cta__arrow">→</span></a>
        <a class="cta cta--ghost" href="/manifesto" style="color:var(--cream);border-color:rgba(245,240,232,.4)">Read the manifesto</a>
      </div>
    </div>
    <div class="hero__cue" aria-hidden="true">
      <span>SCROLL</span>
      <span class="line"></span>
    </div>
  </section>

  <Reveal />
</Base>

<style>
  .hero{position:relative;min-height:100vh;background:var(--ink);color:var(--cream);overflow:hidden}
  .hero__strip{position:absolute;top:90px;left:var(--gutter);right:var(--gutter);z-index:5;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(245,240,232,.6);pointer-events:none}
  .hero__strip .rec{display:inline-flex;align-items:center;gap:8px}
  .hero__strip .rec::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--gold);animation:bl 1.4s ease-in-out infinite}
  @keyframes bl{0%,100%{opacity:1}50%{opacity:.3}}
  .hero__center{font-family:var(--display);font-style:italic;font-weight:300;font-size:13px;letter-spacing:.02em;color:rgba(245,240,232,.85);text-transform:none;text-align:center}
  .hero__strip>:last-child{justify-self:end}
  .hero__text{position:absolute;inset:0;z-index:4;display:grid;grid-template-rows:1fr auto;padding:160px var(--gutter) 80px;pointer-events:none}
  .hero__h1{align-self:end;max-width:16ch;text-wrap:balance;color:var(--cream)}
  .hero__h1 em{font-style:italic;color:var(--gold-bright);font-weight:300}
  .hero__cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;pointer-events:auto}
  .hero__cue{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);z-index:5;font-family:var(--mono);font-size:9px;letter-spacing:.3em;color:rgba(245,240,232,.7);text-transform:uppercase;display:flex;flex-direction:column;align-items:center;gap:14px}
  .hero__cue .line{width:1px;height:48px;background:linear-gradient(180deg,transparent,rgba(245,240,232,.5))}
  @media (max-width:800px){.hero__strip{grid-template-columns:1fr 1fr;gap:8px;top:90px}.hero__strip .hero__center{display:none}.hero__text{padding:140px 20px 70px}.hero__cue{display:none}}
</style>
```

- [ ] **Step 2: Build, smoke test**

```bash
npm run build
ls dist/index.html
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): hero block with eager-mounted video"
```

---

### Task 39: Home — thesis + Acts I–II

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Append the thesis block and the first two acts to `src/pages/index.astro` between `<Reveal />` and the closing `</Base>`**

Insert before `<Reveal />`:

```astro
  <ManifestoBlock />

  <ActSection
    index={1}
    eyebrow="ONE — THE CLOSET, READ"
    headline="Your closet, finally <em>read</em>."
    lede="Point a phone camera at your clothes. Computer vision catalogues every piece — colour, fabric, silhouette — in under ten minutes. No manual tagging."
    image="/assets/act-i-wardrobe-screen.jpeg"
    imageAlt="BURS wardrobe scan in progress, displaying tagged garments"
    bg="paper"
  />

  <ActSection
    index={2}
    eyebrow="TWO — THE DAY, UNDERSTOOD"
    headline="The weather. Your day. <em>Yesterday's</em> outfit."
    lede="Before BURS recommends anything, it reads the weather, your calendar, your location, and yesterday's outfit. The day, understood."
    image="/assets/act-ii-context-screen.jpeg"
    imageAlt="BURS reading the day's context: weather, calendar, location"
    reverse={true}
    bg="cream"
  />
```

- [ ] **Step 2: Build, verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): thesis + acts I–II"
```

---

### Task 40: Home — Acts III–V

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Append the next three acts after Act II**

```astro
  <ActSection
    index={3}
    eyebrow="THREE — TALK TO IT"
    headline="A stylist that <em>refines</em> in a sentence."
    lede="Ask in plain language. The stylist answers using pieces already in your wardrobe."
    image="/assets/act-iii-stylist-screen.jpeg"
    imageAlt="BURS AI stylist chat showing outfit refinements"
    bg="paper"
  >
    <ChatTranscript slot="extra" turns={[
      { who: "you",  text: "Make this warmer." },
      { who: "burs", text: "Swapped the linen shirt for the merino. Same trouser." },
      { who: "you",  text: "Softer palette." },
      { who: "burs", text: "Pulled the cream knit. Drops the contrast a stop." },
      { who: "you",  text: "Something for a 7pm dinner." },
      { who: "burs", text: "Same trouser, the dark blazer, the suede loafer." }
    ]} />
  </ActSection>

  <ActSection
    index={4}
    eyebrow="FOUR — THE WEEK, DRAFTED"
    headline="Monday's pitch. Thursday's dinner. <em>Saturday</em>'s off-site."
    lede="Sync your calendar and BURS drafts an outfit for every event. Swap any piece with one tap."
    image="/assets/act-iv-week-screen.jpeg"
    imageAlt="BURS week planner showing outfits for Monday through Sunday"
    reverse={true}
    bg="cream"
  />

  <ActSection
    index={5}
    eyebrow="FIVE — THE TRIP, PACKED"
    headline="Pack a city in <em>twelve</em> pieces."
    lede="Tell BURS where you're going and for how long. It builds a minimum-viable capsule from your wardrobe — every piece earning its place, every outfit pre-imagined."
    image="/assets/act-v-travel-screen.jpeg"
    imageAlt="BURS travel capsule builder showing 12-piece capsule for a 4-day trip"
    bg="paper"
  />
```

- [ ] **Step 2: Build, verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): acts III–V (chat, week, travel)"
```

---

### Task 41: Home — reprise video block

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Append after Act V**

```astro
  <section class="reprise" aria-label="Reprise film">
    <HeroVideo src={REPRISE_VIDEO} loading="lazy" ariaLabel="BURS reprise film" />
    <div class="reprise__overlay" aria-hidden="true"></div>
  </section>
```

And add to the `<style>` block at the bottom:

```css
  .reprise{position:relative;min-height:80vh;overflow:hidden;background:var(--ink)}
  .reprise__overlay{position:absolute;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 50%,transparent 50%,rgba(14,13,12,.45) 100%);pointer-events:none}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): reprise video block (lazy-mounted)"
```

---

### Task 42: Home — anti-list + pricing teaser

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Append after the reprise**

```astro
  <AntiList />

  <section class="pteaser section--cream" aria-label="Pricing">
    <div class="wrap pteaser__grid">
      <div>
        <p class="eyebrow">— Pricing</p>
        <h2 style="font-weight:200;letter-spacing:-.025em;line-height:.95;font-size:clamp(40px,6vw,80px);margin-top:14px">One subscription. <em style="font-style:italic;color:var(--gold);font-weight:300">Your</em> closet.</h2>
        <p class="lede" style="max-width:42ch;margin-top:18px">119 kr/mo or 899 kr/yr in Sweden. €10.99/mo or €89.99/yr in the rest of the EU. No free tier. No ads.</p>
        <a class="cta" href="/pricing" style="margin-top:24px">See pricing <span class="cta__arrow">→</span></a>
      </div>
      <PriceCard locale="SE" />
    </div>
  </section>
```

Add to `<style>`:

```css
  .pteaser{padding-block:clamp(100px,14vh,180px)}
  .pteaser__grid{display:grid;grid-template-columns:1.2fr 1fr;gap:64px;align-items:center}
  @media (max-width:900px){.pteaser__grid{grid-template-columns:1fr;gap:32px}}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): anti-list + pricing teaser"
```

---

### Task 43: Home — press whisper + close

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Append after pricing teaser**

```astro
  <section class="whisper section--paper" aria-label="Press">
    <div class="wrap">
      <p class="eyebrow">— Press</p>
      <p class="whisper__line">Press inquiries: <a href="mailto:hello@burs.me" style="border-bottom:1px solid">hello@burs.me</a></p>
      <p class="whisper__note">Logos, screenshots, and a ready-to-paste boilerplate at <a href="/press" style="border-bottom:1px solid">/press</a>.</p>
    </div>
  </section>

  <section class="close section--ink" aria-label="Close">
    <div class="wrap close__inner">
      <h2>Your closet, finally <em>working for you</em>.</h2>
      <a class="cta cta--cream" href="https://apps.apple.com/app/burs" style="margin-top:36px">Get the app <span class="cta__arrow">→</span></a>
    </div>
  </section>
```

Add to `<style>`:

```css
  .whisper{padding-block:clamp(80px,10vh,140px)}
  .whisper__line{font-family:var(--display);font-style:italic;font-size:clamp(24px,2.6vw,32px);margin-top:16px;color:var(--charcoal)}
  .whisper__note{font-size:14px;opacity:.65;margin-top:8px}
  .close{padding-block:clamp(120px,18vh,200px);text-align:center}
  .close h2{font-size:clamp(48px,8vw,128px);font-weight:200;letter-spacing:-.04em;line-height:.92;color:var(--cream);max-width:18ch;margin-inline:auto;text-wrap:balance}
  .close h2 em{font-style:italic;color:var(--gold-bright);font-weight:300}
```

- [ ] **Step 2: Build, verify size**

```bash
npm run build
ls -la dist/index.html
```

Expected: `dist/index.html` exists, ≤200KB gzipped.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): press whisper + editorial close"
```

---

### Task 44: Home — visual review

**Files:** none (verification step)

- [ ] **Step 1: Run dev server and open in browser**

```bash
npm run dev
```

Open http://localhost:4321 in Chrome and Safari (and on a physical iOS device if available).

- [ ] **Step 2: Verify visually, scroll top to bottom**

- Hero video plays inline on iOS Safari (no playback button).
- Headline reveals on load with the rise animation.
- Acts alternate light/dark with proper rhythm.
- Reprise video begins playing only when scrolled near.
- Anti-list reads cleanly.
- Pricing card legible.
- Footer renders 4 columns on desktop, collapses on mobile.

- [ ] **Step 3: Run Lighthouse on /**

In Chrome DevTools → Lighthouse → analyze. Target: Perf 95+, A11y 95+, Best Practices 95+, SEO 100.

If any metric fails, file it as a follow-up task — but do not block the next task.

- [ ] **Step 4: Commit any tweaks** (or skip if none)

---

## Phase 6 — Blog system + content

### Task 45: Blog content collection config

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write src/content/config.ts**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(3).max(140),
    description: z.string().min(40).max(220),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    schema: z.enum(['Article', 'TechArticle', 'OpinionPiece']).default('Article')
  })
});

export const collections = { blog };
```

- [ ] **Step 2: Verify config typechecks**

```bash
npm run check
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(blog): content collection config"
```

---

### Task 46: Blog index page

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Write blog/index.astro**

```astro
---
import Page from "../../layouts/Page.astro";
import { getCollection } from "astro:content";

const posts = (await getCollection("blog", ({ data }) => !data.draft))
  .sort((a, b) => +b.data.pubDate - +a.data.pubDate);

const featured = posts[0];
const rest = posts.slice(1);

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}
---
<Page
  title="Notes — BURS"
  description="Essays on wardrobes, dressing, and the unworn 80%."
  path="/blog"
  eyebrow="Notes"
  headline="On wardrobes, dressing, and the <em>unworn</em> 80%."
  lede="Long-form writing from the BURS team."
>
  {featured && (
    <article class="featured">
      <p class="eyebrow">— Featured</p>
      <a href={`/blog/${featured.slug}/`} class="featured__link">
        <h2 class="featured__title">{featured.data.title}</h2>
        <p class="featured__dek">{featured.data.description}</p>
        <p class="label">{fmt(featured.data.pubDate)}</p>
      </a>
    </article>
  )}

  <ul class="cards" role="list">
    {rest.map(p => (
      <li>
        <a href={`/blog/${p.slug}/`} class="card">
          <p class="eyebrow">{p.data.tags[0] ?? "Note"}</p>
          <h3 class="card__title">{p.data.title}</h3>
          <p class="card__dek">{p.data.description}</p>
          <p class="label">{fmt(p.data.pubDate)}</p>
        </a>
      </li>
    ))}
  </ul>
</Page>

<style>
  .featured{padding:48px 0;border-top:1px solid var(--charcoal);border-bottom:1px solid rgba(28,25,23,.15);margin-bottom:64px}
  .featured__link{display:grid;gap:18px;max-width:780px}
  .featured__title{font-family:var(--display);font-weight:300;font-size:clamp(36px,5vw,72px);letter-spacing:-.025em;line-height:1.02;color:var(--charcoal);margin-top:14px}
  .featured__dek{font-family:var(--serif);font-style:italic;font-size:20px;line-height:1.5;color:var(--charcoal-2);max-width:60ch}

  .cards{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:48px}
  .card{display:grid;gap:10px;padding:24px 0;border-top:1px solid rgba(28,25,23,.15)}
  .card__title{font-family:var(--display);font-weight:300;font-size:28px;letter-spacing:-.02em;line-height:1.1;color:var(--charcoal);margin-top:6px}
  .card__dek{font-family:var(--serif);font-style:italic;font-size:16px;line-height:1.5;color:var(--charcoal-2);max-width:48ch}
  @media (max-width:780px){.cards{grid-template-columns:1fr}}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat(blog): index page"
```

---

### Task 47: Blog post template

**Files:**
- Create: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Write blog/[...slug].astro**

```astro
---
import { getCollection, type CollectionEntry } from "astro:content";
import Editorial from "../../layouts/Editorial.astro";
import Schema from "../../components/Schema.astro";
import { article } from "../../lib/schema";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map(p => ({ params: { slug: p.slug }, props: { post: p } }));
}

interface Props { post: CollectionEntry<"blog">; }
const { post } = Astro.props;
const { Content } = await post.render();
const url = `https://burs.me/blog/${post.slug}`;
---
<Editorial
  title={`${post.data.title} — BURS`}
  description={post.data.description}
  path={`/blog/${post.slug}`}
  eyebrow={post.data.tags[0] ?? "Note"}
  headline={post.data.title}
  type="article"
  ogImage={post.data.image}
>
  <p class="postmeta">
    Published {post.data.pubDate.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
    {post.data.updated && ` · Updated ${post.data.updated.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`}
    {post.data.tags.length > 0 && ` · Filed under: ${post.data.tags.join(", ")}`}
  </p>
  <Content />

  <Schema
    slot="head"
    json={article({
      headline: post.data.title,
      description: post.data.description,
      url,
      datePublished: post.data.pubDate.toISOString(),
      dateModified: (post.data.updated ?? post.data.pubDate).toISOString(),
      image: post.data.image
    })}
  />
</Editorial>

<style>
  .postmeta{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--charcoal-2);opacity:.65;margin-bottom:48px}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "feat(blog): post template with Article schema"
```

---

### Task 48: Migrate the 6 existing blog posts to MDX

**Files:**
- Create: `src/content/blog/{ai-styling,capsule-wardrobe,outfit-planning,smarter-wardrobe,style-feedback,wear-more-buy-less}.mdx`

- [ ] **Step 1: For each existing folder under repo-root `blog/<slug>/`**, read `index.html`, extract the body copy and headline, and create the MDX file at `src/content/blog/<slug>.mdx` with frontmatter + body.

Per-post checklist (do one at a time, commit individually if you prefer):

For `ai-styling`:

```bash
cat blog/ai-styling/index.html
```

Then create `src/content/blog/ai-styling.mdx`:

```mdx
---
title: "How AI styling actually works"
description: "What goes into a context-aware outfit recommendation, and what doesn't."
pubDate: 2026-04-12
tags: ["Notes", "Method"]
schema: "TechArticle"
---

[Body text migrated verbatim from the existing HTML, paragraph by paragraph. Use ## for H2 headings. Wrap inline emphasis in *italics*.]
```

(Repeat for the other 5 posts. Pick a `pubDate` and `description` based on the source; if the source page has a date, use it.)

- [ ] **Step 2: Verify build**

```bash
npm run build
ls dist/blog/ai-styling/index.html
```

Expected: 6 post pages built.

- [ ] **Step 3: Commit each (or all)**

```bash
git add src/content/blog
git commit -m "chore(blog): migrate 6 existing posts to MDX"
```

---

### Task 49: Draft new blog post — "The unworn eighty percent"

**Files:**
- Create: `src/content/blog/the-unworn-eighty-percent.mdx`

- [ ] **Step 1: Write the post**

```mdx
---
title: "The unworn eighty percent"
description: "Most wardrobes are invisible to the people who own them. Here's why — and what to do about it."
pubDate: 2026-05-06
tags: ["Manifesto", "Method"]
image: "/og-image.png"
schema: "OpinionPiece"
---

There is a number that fashion writers cite when they want to look serious: most people wear about 20% of what's in their closet. The exact figure is fuzzy — different studies put the unworn share between half and three-quarters of an average wardrobe — but the experience is the same in every closet on earth. You stand in front of an open door at 7am and feel that you have nothing to wear. You don't. You have too much.

## Why the closet hides

Clothes do not advertise themselves. A folded shirt at the back of a shelf is, functionally, not in the closet. A jacket on a hanger one over from the one your eye lands on is, functionally, not in the closet. The combinations you'd most enjoy are the ones you've never seen at the same time — which is, on a typical morning, almost all of them.

This is not a discipline problem. It is a perception problem. Marie Kondo cannot fix it. A bigger closet cannot fix it. A second mirror cannot fix it. The fix has to come from somewhere outside the closet — something that can read every piece at once, hold them all in mind, and propose combinations you couldn't have seen.

## What "reading" a closet means

A wardrobe scan, in BURS, takes under ten minutes. Point a phone at your clothes; the model catalogues every piece — colour, fabric, silhouette, formality, season-fit. Once the catalogue is built, the closet becomes queryable for the first time in its life.

That is the prerequisite. Until the closet can be read, every other promise — context-aware styling, the chat refinement, the week planner, the travel capsule — is a parlour trick.

## What changes when 80% becomes visible

The first thing that happens is irritating: you stop wanting to buy more clothes. The second thing that happens is liberating: getting dressed becomes a five-second decision. The third thing — and this one is harder to describe — is that your wardrobe becomes a personality again. Not a backlog. A library.

The unworn 80% is not a failure of taste. It's a failure of attention. The fix is not better taste. It's better attention.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/blog/the-unworn-eighty-percent.mdx
git commit -m "feat(blog): draft 'The unworn eighty percent'"
```

---

### Task 50: Draft new blog post — "BURS vs Whering vs Pinterest vs Save Your Wardrobe"

**Files:**
- Create: `src/content/blog/burs-vs-whering-vs-pinterest-vs-syw.mdx`

- [ ] **Step 1: Write the post**

```mdx
---
title: "BURS vs Whering vs Pinterest vs Save Your Wardrobe"
description: "An honest comparison of four apps that promise to help you dress better with what you already own."
pubDate: 2026-05-13
tags: ["Comparison", "Method"]
image: "/og-image.png"
schema: "Article"
---

If you've started looking at apps that work with the clothes you already own, you've found four that come up over and over: Whering, Save Your Wardrobe, Pinterest's outfit boards, and BURS. They look similar from the outside — phone in hand, photo of a closet, recommendations on a screen. They are very different products under the surface.

This is an honest comparison. We make BURS, so we are biased; we will be transparent about that as we go.

## What each one is, in one sentence

- **BURS** — an AI wardrobe stylist that scans your closet, reads the day, and recommends one outfit.
- **Whering** — a digital closet with manual tagging and outfit boards.
- **Pinterest** — a visual search engine for inspiration; not a closet at all.
- **Save Your Wardrobe** — a digital closet with care reminders and rental/repair partners.

## The mental model

BURS treats the wardrobe as a database the model queries. Whering and Save Your Wardrobe treat the wardrobe as a notebook you maintain. Pinterest doesn't treat the wardrobe at all — it shows you outfits other people have curated.

The first model is the most ambitious and the most fragile. If the scan is poor, the recommendations are poor. If the scan is good, the recommendations feel uncanny. The second model is sturdier — it asks the user to do more, and it gives the user more control. The third is something else entirely; we'll set Pinterest aside for the rest of this piece.

## Where BURS wins

- **Speed.** From opening the app to a ready outfit is under five seconds. No tagging, no swiping a feed, no choosing.
- **One outfit.** This is the design choice that defines BURS. Choosing is moved off the user, onto the model.
- **Travel capsules.** A 12-piece capsule for a 4-day trip, every outfit pre-imagined, takes a single prompt.
- **Context.** Weather, calendar, location, yesterday — read before any recommendation.

## Where the others win

- **Manual control.** If you genuinely enjoy tagging clothes and curating outfit boards, Whering is the better product. BURS' scan is automatic on purpose, and that automation is the wrong fit for someone who likes the curation step.
- **Care and circularity.** Save Your Wardrobe's repair, alterations, and rental partners are not part of BURS' product surface and won't be soon.
- **Free tier.** Both Whering and Pinterest have free tiers. BURS does not.

## The honest summary

If you want a closet to maintain — Whering. If you want a closet to keep alive — Save Your Wardrobe. If you want inspiration from strangers — Pinterest. If you want a stylist who will tell you, in five seconds, what to wear right now from what you already own — BURS.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/blog/burs-vs-whering-vs-pinterest-vs-syw.mdx
git commit -m "feat(blog): comparison post"
```

---

### Task 51: Draft 4 remaining blog posts (How a wardrobe scan works · Why one outfit beats twenty · 12-piece city capsule · What BURS will never do)

**Files:**
- Create: `src/content/blog/how-a-wardrobe-scan-works.mdx`
- Create: `src/content/blog/why-one-outfit-beats-twenty.mdx`
- Create: `src/content/blog/twelve-piece-city-capsule.mdx`
- Create: `src/content/blog/what-burs-will-never-do.mdx`

- [ ] **Step 1: how-a-wardrobe-scan-works.mdx**

```mdx
---
title: "How a wardrobe scan actually works"
description: "What computer vision sees when it looks at a closet, and what it doesn't."
pubDate: 2026-05-20
tags: ["Method", "Technical"]
schema: "TechArticle"
---

The wardrobe scan in BURS is the foundation everything else stands on. If the catalogue is wrong, every recommendation is wrong. So it's worth being clear about how it works.

## What the camera does

You point a phone at your clothes. The frame is processed in three passes:

1. **Detection.** Each garment is isolated — a jacket from the rail behind it, a folded shirt from the shelf below.
2. **Classification.** Type (shirt, trouser, knit, dress…), formality (casual, business-casual, business, formal), season-fit, length, sleeve, neckline.
3. **Attribute extraction.** Colour (hue, value, saturation), fabric (knit, woven, leather, suede, denim, technical), silhouette (slim, regular, relaxed, oversized), pattern (solid, stripe, check, print).

These are stored as structured fields per piece. Your closet becomes queryable.

## What it doesn't do

The scan does not name your clothes. It does not generate stories about them. It does not match brands or estimate prices. It does not infer your style from looking at the closet — that comes later, from how you wear and refine recommendations.

## Where it fails (and how it recovers)

The hardest cases are pieces that look identical at a glance but behave differently in practice — a black wool sweater and a black cotton sweater, for instance. The scan distinguishes by texture, but if you wear the wool one to a context BURS expected the cotton one for, the chat refinement is your fix: "the warmer black knit, not the cotton." One sentence and the catalogue learns.

## Why this matters

The scan is the prerequisite for every other promise BURS makes. We invest in it disproportionately because everything downstream — context, chat, week, travel — collapses without it.
```

- [ ] **Step 2: why-one-outfit-beats-twenty.mdx**

```mdx
---
title: "Why one outfit beats twenty options"
description: "On choice paralysis, the cost of curation, and why a feed is the wrong shape for a wardrobe."
pubDate: 2026-05-27
tags: ["Manifesto", "Notes"]
schema: "OpinionPiece"
---

In 2000, Sheena Iyengar and Mark Lepper ran an experiment at a Menlo Park grocery store. One day, they offered shoppers a choice of six jams. Another day, twenty-four. The wider choice attracted more attention; the narrower choice produced ten times the purchases.

The lesson has been repeated to the point of cliché: more options paralyse. But it has also been ignored, almost universally, by every fashion app on the market.

## The default is a grid

Pinterest is a grid. Whering's outfit board is a grid. Instagram Shopping is a grid. The grid is a default because it transfers the cost of choosing onto the user, which is cheap for the platform and expensive for the human standing in front of an open closet at 7am.

The grid is also where shopping lives. Every fourth tile is something you could buy. The grid is, in the end, optimised for the platform's revenue, not your morning.

## What "one outfit" requires

For a recommendation to be confident enough to stand alone, the system has to know what you have, what's clean, what fits the day, and what you wore yesterday. If any of those reads is missing, the recommendation is a guess, and a guess is a grid waiting to appear.

This is why BURS reads the day before answering. One outfit, from your closet, for this Tuesday — that is what the model is trying to deliver. Not twenty. One.

## When one is wrong

The cost of being wrong with one outfit is, in theory, higher than the cost of being wrong with twenty. In practice it is lower. With twenty options, "wrong" is invisible. With one, "wrong" is correctable in a sentence: *make this warmer, softer palette, something for 7pm dinner*. The chat is the safety net, and the safety net is what makes the one-outfit design viable.
```

- [ ] **Step 3: twelve-piece-city-capsule.mdx**

```mdx
---
title: "A twelve-piece capsule for a four-day city trip"
description: "How BURS builds a minimum-viable travel capsule from your existing wardrobe."
pubDate: 2026-06-03
tags: ["Travel", "Capsule"]
schema: "Article"
---

Packing for a four-day city trip should take ten minutes. It usually takes an hour, and the result is a suitcase with three things you'll wear and seven you won't.

A twelve-piece capsule, properly built, fixes this. It's not a packing list. It's a small, dense set of pieces that combine into every outfit you'll need.

## The shape of twelve

In BURS, the default capsule for a four-day trip looks roughly like:

- **3 tops** — one knit, one shirt, one t-shirt or fine-gauge.
- **2 trousers** — one tailored, one casual.
- **1 dress or alternate piece** — for the dinner you didn't plan for.
- **1 jacket** — outerwear, weather-appropriate.
- **1 layer** — a knit, blazer, or vest.
- **2 footwear** — one walking, one nicer.
- **1 bag** — versatile across day and evening.
- **1 accessory** — a scarf, a belt, or a piece of jewellery that does work.

Twelve pieces, sixteen-plus distinct outfits, every one already imagined.

## The math BURS does

The capsule is built backwards from your itinerary: number of days, weather forecast, calendar events with dress codes, the formality range you signal. Then forward from your wardrobe: what you own that fits the math.

The constraint that matters most is fewest pieces with most combinations. A jacket that pairs with two trousers and three tops earns four outfits. A jacket that pairs with one trouser earns one. The model selects ruthlessly.

## What a four-day weekend in Lisbon looks like

For a long weekend in Lisbon in October, the capsule is light: linen or cotton, one breathable knit for the evening, one rain layer, comfortable walking shoes. Sixteen outfits across four days; you'll repeat pieces, not outfits. That's the design.

The travel capsule is, structurally, a constraint-satisfaction problem. The thing BURS does that you can't easily do alone is hold every constraint in mind at once.
```

- [ ] **Step 4: what-burs-will-never-do.mdx**

```mdx
---
title: "What BURS will never do"
description: "The list. Privacy, no advertising, no shopping, no wardrobe data sale, no dark patterns. Read it before you trust the app."
pubDate: 2026-06-10
tags: ["Manifesto", "Privacy"]
schema: "OpinionPiece"
---

Most apps tell you what they will do. This one is about what BURS will not do. The negatives are easier to hold us to than the positives.

## We will never recommend pieces you don't own

BURS is not a shopping app. There is no retail surface, no affiliate link, no "shop the look", no curated drops. Every recommendation uses pieces already in your wardrobe. If we ever build a shopping experience, it will be a separate product with a separate brand. BURS is the wardrobe app.

## We will never sell your wardrobe data

Your closet is a portrait of you. We will not sell that portrait to advertisers, to retailers, to brokers, to AI labs. The product is paid; that's the trade. We get paid by you, you keep your closet.

## We will never train public models on your images

Internal model improvements happen on opt-in, anonymised data only. No public foundation model is trained on user wardrobes. If your photo enters our systems, it stays in your account.

## We will never run ads

Not banner ads, not sponsored recommendations, not "from our partners". The app is a stylist, and a stylist that takes commissions is not a stylist.

## We will never replace one outfit with twenty

The whole product is the design choice that BURS opens with one confident answer instead of a feed. We will not roll that back to make engagement metrics easier to win. The single recommendation is the point.

## The list is short on purpose

A short, clear list of negatives is more honest than a long, vague list of positives. If we ever break a rule on this list, we will say so on this page first.
```

- [ ] **Step 5: Build, verify all 6 new posts produced**

```bash
npm run build
ls dist/blog/ | grep -E "the-unworn|burs-vs|how-a-wardrobe|why-one-outfit|twelve-piece|what-burs-will-never"
```

Expected: 6 directories.

- [ ] **Step 6: Commit**

```bash
git add src/content/blog
git commit -m "feat(blog): 4 more drafts (scan, one outfit, capsule, anti-list)"
```

---

### Task 52: OG image autogeneration for blog

**Files:**
- Create: `src/pages/og/[...slug].png.ts`

- [ ] **Step 1: Write the OG endpoint**

```ts
// src/pages/og/[...slug].png.ts
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);

const pages = Object.fromEntries(
  posts.map(p => [p.slug, { title: p.data.title, description: p.data.description }])
);

export const { getStaticPaths, GET } = OGImageRoute({
  pages,
  param: 'slug',
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[14, 13, 12], [28, 25, 23]],
    border: { color: [201, 168, 108], width: 4, side: 'inline-start' },
    padding: 80,
    font: {
      title: { size: 64, lineHeight: 1.05, color: [245, 240, 232], weight: 'Light', family: 'Fraunces' },
      description: { size: 24, lineHeight: 1.4, color: [200, 192, 178], weight: 'Normal', family: 'Inter Tight' }
    },
    fonts: [
      'https://burs.me/fonts/fraunces-variable.woff2',
      'https://burs.me/fonts/inter-tight-variable.woff2'
    ]
  })
});
```

- [ ] **Step 2: Wire blog post to use it**

In `src/pages/blog/[...slug].astro`, replace the `ogImage={post.data.image}` prop with:

```astro
ogImage={post.data.image ?? `/og/${post.slug}.png`}
```

- [ ] **Step 3: Build, verify one OG image produced**

```bash
npm run build
ls dist/og/
```

Expected: `<slug>.png` files.

- [ ] **Step 4: Commit**

```bash
git add src/pages/og/[...slug].png.ts src/pages/blog/[...slug].astro
git commit -m "feat(blog): autogenerated per-post OG images"
```

---

## Phase 7 — Cross-cutting

### Task 53: 404 page

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write 404.astro**

```astro
---
import Page from "../layouts/Page.astro";
---
<Page
  title="Not found — BURS"
  description="That page is not in this closet."
  path="/404"
  eyebrow="404"
  headline="That page is not <em>in this closet</em>."
  lede="Try the manifesto, or go back to the home page."
>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
    <a class="cta" href="/">Home <span class="cta__arrow">→</span></a>
    <a class="cta cta--ghost" href="/manifesto">Manifesto</a>
  </div>
</Page>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: 404"
```

---

### Task 54: Custom OG image for home + manifesto

**Files:**
- Create: `public/og/home.png`, `public/og/manifesto.png`

- [ ] **Step 1: Generate two OG images** (1200×630)

Use Figma or a tool of your choice. Each image: charcoal/ink gradient background, gold left border, Fraunces light italic title, Inter Tight description, BURS™ wordmark bottom-right. Save as PNG ≤200KB each.

- **home.png** title: *Your wardrobe, intelligently styled.* description: *An AI wardrobe stylist. EU.*
- **manifesto.png** title: *We built BURS for the eighty percent of your closet that never gets worn.* description: *The thesis behind an app that refuses to sell you anything.*

- [ ] **Step 2: Wire them in**

Edit `src/pages/index.astro` Base props:
```astro
ogImage="/og/home.png"
```

Edit `src/pages/manifesto.astro` Editorial props:
```astro
ogImage="/og/manifesto.png"
```

- [ ] **Step 3: Commit**

```bash
git add public/og src/pages/index.astro src/pages/manifesto.astro
git commit -m "feat(seo): hand-crafted OG for home + manifesto"
```

---

### Task 55: Sitemap-index test

**Files:** none — verification only

- [ ] **Step 1: Build and inspect**

```bash
npm run build
ls dist/sitemap*.xml
cat dist/sitemap-index.xml | head -20
```

Expected: `sitemap-index.xml` exists and references `sitemap-0.xml`. The `0` file lists all 10 routes + all blog posts.

- [ ] **Step 2: Update llms.txt sitemap line if needed**

If sitemap is at `/sitemap-index.xml`, the llms.txt already references it. If your build emits `/sitemap.xml`, update llms.txt. Verify and commit any change.

---

### Task 56: Smoke-test all routes build

**Files:** none — verification

- [ ] **Step 1: Build clean**

```bash
rm -rf dist
npm run build 2>&1 | tee /tmp/build.log
```

Expected: zero errors. All 10 routes + 6+6 blog posts present in `dist/`.

- [ ] **Step 2: Confirm route count**

```bash
find dist -name index.html | wc -l
```

Expected: 10 + 12 = 22 (or higher if 404, og endpoints emit pages).

- [ ] **Step 3: Commit any fix**

If the count is wrong, identify the missing route, fix, commit. Otherwise skip.

---

## Phase 8 — Quality gates

### Task 57: Schema.org validation

**Files:**
- Create: `tests/schema.smoke.ts`

- [ ] **Step 1: Write a smoke test that parses every JSON-LD block in dist and validates basic shape**

```ts
// tests/schema.smoke.ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, files: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.html')) files.push(p);
  }
  return files;
}

describe('schema.org JSON-LD', () => {
  const htmls = walk('dist');

  it('every page has at least one ld+json block', () => {
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      expect(s, p).toMatch(/<script[^>]+application\/ld\+json/);
    }
  });

  it('every ld+json parses as JSON', () => {
    const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g;
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = re.exec(s)) !== null) {
        expect(() => JSON.parse(m![1]), `${p}: ${m![1].slice(0,80)}…`).not.toThrow();
      }
    }
  });

  it('every page has Organization schema (from Base layout)', () => {
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      expect(s, p).toMatch(/"@type":"Organization"/);
    }
  });
});
```

Update `vitest.config.ts` `include` to add `tests/**/*.smoke.ts`:

```ts
include: ['src/**/*.{test,spec}.ts', 'tests/**/*.smoke.ts'],
```

- [ ] **Step 2: Run after build**

```bash
npm run build && npm test
```

Expected: 12 + 3 = 15 passing.

- [ ] **Step 3: Commit**

```bash
git add tests/schema.smoke.ts vitest.config.ts
git commit -m "test: schema.org JSON-LD smoke test across all pages"
```

---

### Task 58: Accessibility smoke test (axe-core)

**Files:**
- Create: `tests/a11y/home.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Write the test**

```ts
// tests/a11y/home.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/manifesto', '/method', '/pricing', '/faq', '/answers', '/press', '/blog', '/privacy', '/terms'];

for (const r of routes) {
  test(`${r} has no critical a11y violations`, async ({ page }) => {
    await page.goto(r);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}
```

- [ ] **Step 3: Run**

```bash
npm run build
npm run test:a11y
```

Expected: all routes pass with zero critical / serious violations.

- [ ] **Step 4: Commit**

```bash
git add tests/a11y/home.spec.ts
git commit -m "test(a11y): axe-core smoke test on every route"
```

---

### Task 59: Lighthouse CI

**Files:** none — uses lighthouserc.json

- [ ] **Step 1: Run Lighthouse CI**

```bash
npm run build
npm run test:lh
```

Expected: all 6 sampled URLs hit Perf 95+, A11y 95+, BP 95+, SEO 100.

- [ ] **Step 2: Fix the lowest score**

If any score is below threshold, identify it (Lighthouse output names the failing audit) and fix. Common likely issues:
- LCP from the hero video poster missing → extract a poster JPG from frame 1.
- Render-blocking CSS → already inlined by Astro auto.
- Image alt text missing → add to ActSection invocations.

Commit the fix.

- [ ] **Step 3: Re-run**

```bash
npm run test:lh
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git commit -am "perf: pass Lighthouse thresholds"
```

(If no fix was needed, skip the commit.)

---

### Task 60: Reduced-motion verification

**Files:** none — manual verification

- [ ] **Step 1: Enable reduced-motion in Chrome**

DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → reduce.

- [ ] **Step 2: Reload all 10 pages**

Verify:
- Word-rise animations don't play.
- Reveal-on-scroll elements appear immediately (don't fade up).
- Cursor reverts to default.
- Grain overlay is invisible.
- Scroll cue arrow doesn't animate.
- Videos still autoplay (this is acceptable — they're loops with no flash, and the user opted into seeing animation by visiting a video-led brand site; if you want stricter behavior, replace videos with poster on `prefers-reduced-motion`).

- [ ] **Step 3: Commit any fix**

If anything visibly animates that shouldn't, find the rule and gate it under the existing `@media (prefers-reduced-motion: reduce)` block in `src/styles/tokens.css`. Commit.

---

## Phase 9 — Launch

### Task 61: Delete old static site files

**Files:**
- Delete: `index.html`, `blog/`, `features/`, `privacy/`, `terms/` (top-level dirs from the legacy static site)

- [ ] **Step 1: Confirm Astro dist/ is the truth**

```bash
ls dist/
```

Expected: complete site.

- [ ] **Step 2: Remove legacy folders**

```bash
git rm -rf index.html blog features privacy terms
```

(All public assets — `_redirects`, `robots.txt`, `llms.txt`, favicons, `manifest.json`, `og-image.png`, `assets/` — already moved to `public/` in T02 step 5.)

- [ ] **Step 3: Build clean and verify**

```bash
rm -rf dist
npm run build
ls dist/
```

Expected: 10 routes + blog posts only, no leftover legacy files.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove legacy static site files (replaced by Astro build)"
```

---

### Task 62: Merge to main, deploy

**Files:** none — git + Cloudflare

- [ ] **Step 1: Final build green check on `redesign`**

```bash
npm run build && npm test && npm run test:a11y && npm run test:lh
```

All four must pass.

- [ ] **Step 2: Merge to main**

```bash
git checkout main
git merge --no-ff redesign -m "feat: BURS landing redesign — manifesto-led editorial site

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Configure Cloudflare Pages build**

In the Cloudflare Pages dashboard for the project:
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node version: 20

- [ ] **Step 4: Push and deploy**

```bash
# Set up the remote if not already configured. Skip if it is.
# git remote add origin git@github.com:<owner>/burs-landing.git
git push origin main
```

Cloudflare Pages auto-deploys on push to `main`.

- [ ] **Step 5: Post-deploy verification on burs.me**

- All 10 routes load with HTTPS, correct titles, no console errors.
- `https://burs.me/llms.txt` serves the expanded version.
- `https://burs.me/sitemap-index.xml` serves valid XML.
- `https://burs.me/robots.txt` lists AI bots.
- `https://burs.me/features` redirects to `/method`.
- View source on `/`: contains `Organization`, `WebSite`, `SoftwareApplication`, `Product` JSON-LD.
- Hero video plays on iOS Safari.
- Test in Perplexity: paste `https://burs.me/manifesto` and ask "summarize this page". Verify the manifesto thesis is returned verbatim.

- [ ] **Step 6: Tag the release**

```bash
git tag v1.0.0 -m "BURS landing v1.0.0 — manifesto redesign"
git push origin v1.0.0
```

---

## Self-review

**Spec coverage:** Each spec section has tasks:
- §1 Goal — covered by overall plan; install CTAs in T09 (Nav), T38 (Hero), T43 (Close).
- §2 Narrative arc — T38–T43 (home), T36 (manifesto).
- §3 Voice rules — applied in T30–T37 and T49–T51 copy drafts.
- §4 Site map — T30–T37 + T46–T47 cover all 10 routes; T19 adds the redirect.
- §5 Home anatomy — T38–T43 cover all 13 sections.
- §6 Visual system — T05–T07 (tokens, reset, typography, utilities).
- §7 Other pages — T30–T37 each map 1-1.
- §8 AI/SEO — T14–T20 (schema, llms, robots, sitemap, RSS) + per-page schema in T33, T34, T35, T36, T37, T47.
- §9 Copy plan — T49–T51 (4 blog drafts) + T36 (manifesto draft) + T38 (hero copy).
- §10 Tech stack — T02–T04 (scaffold, configs, fonts), T62 (deploy).
- §11 Out of scope — none reintroduced.
- §12 Success criteria — T57–T60 (schema, a11y, Lighthouse, reduced-motion).
- §13 Decisions log — implicit (tasks reflect each decision).

**Placeholder scan:** None of the steps say "implement X" without showing the code. Two steps require external work that can't be inlined: T04 (font downloads — exact source named) and T54 (OG image generation — explicit target dimensions and style direction). T48 step 1 includes the migration recipe and an explicit per-file template.

**Type consistency:** `buildSeo`, `organization`, `website`, `softwareApplication`, `product`, `article`, `faqPage`, `howTo`, `breadcrumbs`, `format`, `annualSavingsPct`, `PRICES`, `Locale` — all signatures match where called. `HeroVideo` props (`src`, `poster?`, `loading?`, `ariaLabel?`) consistent across T38, T41. `ActSection` props (`index`, `eyebrow`, `headline`, `lede`, `image`, `imageAlt`, `reverse?`, `bg?`) consistent across T39, T40. `Schema` component takes `json` consistent across all uses.

---

*End of plan.*
