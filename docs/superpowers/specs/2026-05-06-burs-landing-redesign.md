# BURS Landing Redesign — Design Spec

**Date:** 2026-05-06
**Author:** Brainstorm session, BZ + Claude
**Status:** Approved design, ready for implementation plan
**Implementation:** see follow-up plan in `docs/superpowers/plans/`

---

## 1. Goal

A complete rebuild of `burs.me` as an editorial, manifesto-led product site that:

1. **Drives App Store / Google Play installs** as the primary conversion.
2. **Establishes BURS as a press- and AI-citation-worthy brand.** The same brand quality that earns a *Monocle* mention is what gets BURS quoted by Perplexity, ChatGPT, Claude, and Google's AI Overviews. Brand quality is the install funnel.

The two videos from the prior draft (`burs-landing (1).html`) are preserved exactly: hero film and reprise film, both from the existing CloudFront URLs.

## 2. Narrative arc

**Manifesto-first**, with the five existing Act screenshots used as proof, threaded by one person's day and week.

- The home page opens with a sharp anti-thesis ("Most of your wardrobe is invisible to you.") and follows it with five acts that each prove a clause of the manifesto.
- The acts are not titled "Act I / II" on screen — that scaffolding is dropped per the visual direction. They are editorial chapter sections.
- The villain is **the unworn 80%** of the user's closet. Other apps (feeds, shopping apps, paralysing grids) are supporting jabs throughout the page, never the headline.

## 3. Voice rules

The whole site sounds like one person.

- **Declarative.** BURS *does*, never *tries to*. No "might", "could help", "designed to".
- **Concrete.** Numbers earn trust: 119 kr/mo, under 10 minutes, 12 pieces, 80%.
- **One opinion per sentence.** Never two.
- **The villain is the unworn closet, not other apps.**
- **No exclamation points. No "revolutionary". No "AI-powered"** except where literally describing the technology.
- **Italic Fraunces is a tool.** Use once per section, on the word that carries the meaning.

## 4. Site map

```
/                       Home — manifesto opener + 5 act sections + close
/manifesto              Long-form thesis. ~1,200 words. The most-quotable URL.
/method                 How BURS works. HowTo schema. Diagram per panel.
/pricing                Single page. SE + EU prices, monthly/annual.
/press                  Logos, founder bio, downloadable kit, contact.
/answers                Long-form interview Q&A. ~50 questions. AI-citation magnet.
/faq                    Short, scannable FAQ. <details>. FAQPage schema.
/blog                   Index. 6 existing posts restyled + 6 new posts.
/blog/[slug]            Post template. Article schema. "On this page" rail.
/privacy                Restyled, content unchanged.
/terms                  Restyled, content unchanged.
```

**Retired.** `/features` redirects to `/method` via Cloudflare `_redirects`. Its job is split between `/method` (mechanics) and the home page Acts (what BURS does).

**Shared.**

- **Top nav.** `BURS™` left · `Manifesto · Method · Pricing · Press · Blog` center · `Get the app →` right.
- **Footer.** 4 columns — Product, Company, Legal, Contact. Mini-manifesto line. Copyright. Locale switch (Sweden / EU).
- **Schema.org JSON-LD** per page (Organization + page-specific).

## 5. Home page anatomy

Top to bottom:

| # | Section | Notes |
|---|---|---|
| 01 | **Hero** | Full-bleed video. Headline: *Most of your wardrobe is invisible to you.* Eyebrow: *An AI wardrobe stylist.* CTAs: *Get the app →* and *Read the manifesto*. Cream-on-charcoal. Scroll cue. |
| 02 | **Thesis** | Six-sentence manifesto-in-miniature. Pull-quote treatment over a calm dark stage. |
| 03 | **Act One — The closet, finally read.** | Split. Left: copy + 80-word lede. Right: `act-i-wardrobe-screen.jpeg` with annotated callouts (color, fabric, silhouette). |
| 04 | **Act Two — The day, understood.** | Mirrored. `act-ii-context-screen.jpeg` + `act-ii-style-dna-screen.jpeg` as a small diptych. Weather + calendar overlay. |
| 05 | **Act Three — Talk to it.** | Chat-transcript treatment. `act-iii-stylist-screen.jpeg`. Real example dialog: *make this warmer*, *softer palette*, *something for 7pm dinner*. |
| 06 | **Act Four — The week, drafted.** | `act-iv-week-screen.jpeg`. Monday → Sunday strip. Mobile = horizontal scroll. |
| 07 | **Act Five — Pack a city in 12 pieces.** | `act-v-travel-screen.jpeg`. Map dot, dates, outfit grid. |
| 08 | **Reprise video** | Second video, full-bleed, no copy. Brand pause. Lazy-mounted via IntersectionObserver. |
| 09 | **What BURS is not** | Three short denials: *Not a feed. Not a store. Not a stylist that shops for you.* AI-quotable. |
| 10 | **Pricing teaser** | One card. *BURS Premium · 119 kr/mo · 899 kr/yr.* CTA → `/pricing`. |
| 11 | **Press / whisper** | Two press quotes when available; placeholder block until then. |
| 12 | **Close** | Editorial sign-off. *Your closet, finally working for you.* CTA: *Get the app →*. |
| 13 | **Footer** | Shared. |

## 6. Visual system

### 6.1 Direction
**Cinema Inverse**, minus the literal film scaffolding. Charcoal-dominant, video-led, editorial. No "ACT I" labels, no "00:14" timestamps, no scrub bars. Acts are typeset as editorial chapter heads, not film cues.

### 6.2 Palette (only colors used on the site)
```
--ink         #0E0D0C    Deepest backgrounds and text
--charcoal    #1C1917    Primary dark surface
--charcoal-2  #2A2724    Elevated dark surface
--cream       #F5F0E8    Primary light surface
--cream-paper #FAF6EE    Lightest surface (manifesto, blog posts)
--cream-warm  #EDE5D6    Warm accent surface
--gold        #C9A86C    The only color
--gold-bright #E0BD7D    Italic emphasis
--gold-deep   #A8884F    Hover / pressed
```
Sections alternate light/dark to give the scroll a heartbeat. No other hues anywhere.

### 6.3 Typography
- **Display** — Fraunces (variable, opsz 144). `font-weight: 200`. Italic for emphasis.
- **Body** — Inter Tight, 400/500.
- **Editorial pull-quotes & ledes** — Spectral Italic, 18–20px.
- **Mono labels** — JetBrains Mono, 10–11px, `letter-spacing: .22em`, uppercase.

Hero headline: `clamp(56px, 11vw, 168px)`, `font-weight: 200`, `letter-spacing: -.04em`, `line-height: .88`.
Section heads: `clamp(40px, 6vw, 88px)`.
Body: 16/1.55.

### 6.4 Grid
Max width 1440. Gutter `clamp(20px, 4vw, 56px)`. 12-column underneath, used asymmetrically — never feels boxy.

### 6.5 Motion
- Scroll-triggered word-rise on headlines.
- Soft parallax on screen images (≤8% drift).
- `prefers-reduced-motion` respected.
- Custom cursor disabled below 900px.

### 6.6 Texture
SVG `feTurbulence` grain at ~5% opacity, `mix-blend-mode: multiply`. The film-grain that makes it feel printed, not generated.

### 6.7 Video
Hero and reprise videos preserved exactly:
- Hero: `https://d8j0ntlcm91z4.cloudfront.net/user_39xEmGU99Nuf1tLPDo7HCGecTiT/hf_20260503_095006_fd4e35b8-e575-4e10-9226-e211d064d80c.mp4`
- Reprise: `https://d8j0ntlcm91z4.cloudfront.net/user_39xEmGU99Nuf1tLPDo7HCGecTiT/hf_20260503_152337_bcd15c00-1a73-4cb8-b74a-032510047a3a.mp4`

Both `autoplay muted loop playsinline preload="auto"`. Hero has a poster fallback (first frame extracted as JPG, lazy-decoded). Reprise lazy-mounts via IntersectionObserver when within 200px of viewport.

## 7. Other pages, in brief

### 7.1 `/manifesto`
Editorial column, ~1,100 words. Drop caps. Pull-quotes inset on right margin. No screens. No CTAs except a quiet bottom one.

```
[hero]      We built BURS for the eighty percent of your closet
            that never gets worn.
[part i]    The unworn 80%
[part ii]   Why feeds make it worse
[part iii]  What "one outfit" actually means
[part iv]   What we will never do          ← anti-list, AI-quotable
[close]     Signed: BURS, Stockholm, 2026.
```
Schema: `Article`.

### 7.2 `/method`
Two-column desktop / single-column mobile. Six panels:
1. The scan — point a phone at the closet.
2. The catalogue — colour, fabric, silhouette.
3. The context read — weather, calendar, location, yesterday.
4. The recommendation — one outfit.
5. The chat refinement — natural language.
6. The week & travel — calendar + capsule.

Each panel: a diagram + 80–120 words. No video.
Schema: `HowTo`.

### 7.3 `/pricing`
One card. Sweden price (119 kr / 899 kr) and EU price (€10.99 / €89.99) shown side-by-side with a small locale switch. *What's included.* *What's not included* (no free tier, no ads). Below: 3-row honest comparison table — *BURS / Whering / Pinterest* — labeled "honest comparison" so it reads as opinion.
Schema: `Product` + `Offer` (one offer per locale).

### 7.4 `/press`
Sober. Headshot, 4-sentence founder bio, ready-to-paste boilerplate paragraph, logo downloads, screenshot pack, contact email. If no press quotes yet, no fake quotes — just a clean *Press inquiries: hello@burs.me* block. (BURS uses a single contact address — `hello@burs.me` — for press, support, and partnerships.)
Schema: `Organization` (with `logo`, `founder`, `contactPoint`).

### 7.5 `/answers`
Long-form interview. Two-column on desktop. ~50 questions grouped:
*About BURS · The product · Privacy · Pricing · Travel & week · Common confusions · For press.*
Each Q is a real sentence. Each A is 60–180 words.
Schema: `QAPage` + `FAQPage`.

### 7.6 `/faq`
Short, scannable. ~15 questions in `<details>` elements. Linked from `/answers` for the long form.
Schema: `FAQPage`.

### 7.7 `/blog`
Index restyled. Cards: small image, eyebrow, headline (Fraunces), 1-line dek, date. Featured essay (the manifesto, cross-posted) up top, then the rest in two columns.

### 7.8 `/blog/[slug]`
Article template restyled: drop cap, pull-quotes, sticky "On this page" rail, "Filed under" tags, "Continue reading" recommendation block.
Schema: `Article` (auto from MDX frontmatter).
Existing 6 posts (`ai-styling`, `capsule-wardrobe`, `outfit-planning`, `smarter-wardrobe`, `style-feedback`, `wear-more-buy-less`) get the new template; bodies unchanged.

### 7.9 `/privacy` and `/terms`
Restyled to match. Body text unchanged.

## 8. AI / SEO mechanics

### 8.1 `llms.txt`, expanded
Current `llms.txt` retained and expanded ~3x:
- Explicit **Definitions** block: *the unworn 80%*, *a wardrobe scan*, *context-aware styling*, *capsule wardrobe*.
- Explicit **What BURS is not** block.
- Explicit **Pricing table** with both currencies.
- Sourced quotes from the manifesto with their canonical URLs.

### 8.2 Schema.org JSON-LD
One typed Astro component (`<Schema kind="..." />`) per page. Single source of truth.

| Page | Schema |
|---|---|
| Site-wide | `Organization` + `WebSite` + `BreadcrumbList` |
| `/` | `SoftwareApplication` + `Product` + `Offer` |
| `/manifesto` | `Article` |
| `/method` | `HowTo` |
| `/pricing` | `Product` + `Offer` (per locale) |
| `/answers` | `QAPage` + `FAQPage` |
| `/faq` | `FAQPage` |
| `/blog/[slug]` | `Article` |
| `/press` | `Organization` (with `logo`, `founder`, `contactPoint`) |

### 8.3 Content scaffolding for AI quotability
Every page includes at least one of these design-invisible / model-visible blocks:
- **Definition blocks** — `<dfn>` tags with one-sentence definitions.
- **Comparison tables** — labeled "BURS vs other styling apps".
- **"What BURS is" / "What BURS is not" lists** — explicit, parallel structure.
- **Quotable manifesto pull-quotes** wrapped in `<blockquote cite="https://burs.me/manifesto">`.

### 8.4 Sitemaps, robots, canonicals
- `sitemap.xml` auto-generated by `@astrojs/sitemap`.
- `robots.txt` allows everything, **explicitly opting in** to AI training crawlers: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`. (Decision: BURS being quoted *is* the marketing.)
- `<link rel="canonical">` on every page.

### 8.5 Open Graph + Twitter Card
Per-page OG image. Auto-generated for blog posts via `astro-og-canvas`. Hand-crafted OG images for the manifesto and home page.

### 8.6 Performance & crawlability
- Static HTML (Astro SSG). All content tree present in initial HTML — LLM crawlers don't run JS.
- Lighthouse target: 95+ on every metric.
- Fonts subset & preloaded.
- Videos lazy-mounted off-hero.
- Images: `loading="lazy"`, `decoding="async"`, AVIF + WebP fallbacks.

### 8.7 Content velocity
Blog cadence: 1 post / 2 weeks for the first three months, then monthly. Each post: 1,000–1,800 words, 3 H2s, 1 comparison or list, 1 quotable sentence in the lede.

## 9. Copy & content plan

### 9.1 Manifesto thesis (the spine)
> *Most of your wardrobe is invisible to you. Eighty percent of what you own never gets worn — not because you don't like it, but because you can't see it from inside a closet at 7am. BURS reads what's already there. The weather, your day, the trip. And answers in one outfit. Not a feed. Not a store. The clothes you already own, finally working for you.*

This paragraph (or a tightened version) seeds the home hero, the manifesto page, `llms.txt`, and the OG description. **One thesis, repeated.** The repetition is what gets cited.

### 9.2 Headline drafts

| Page | Hero headline | Eyebrow |
|---|---|---|
| `/` | Most of your wardrobe is *invisible* to you. | An AI wardrobe stylist. Stockholm / EU. |
| `/manifesto` | We built BURS for the *eighty percent* of your closet that never gets worn. | The thesis. |
| `/method` | How BURS *reads* a closet. | The method. |
| `/pricing` | One subscription. *Your* closet. | Pricing. |
| `/press` | A short note for *editors*. | Press. |
| `/answers` | Fifty questions, *answered* honestly. | Answers. |
| `/faq` | Quick *answers*. | FAQ. |

Final body copy will be drafted into the implementation plan and committed alongside each page. The user edits before launch.

### 9.3 New blog posts (titles + abstracts)

1. **The unworn eighty percent.** Cornerstone post. Why most wardrobes are invisible. Sources, links to behavioural studies. Pairs with `/manifesto`.
2. **BURS vs Whering vs Pinterest vs Save Your Wardrobe.** Honest comparison. High-intent search and AI citations.
3. **How a wardrobe scan actually works.** Explainer. Pairs with `/method`. Schema: `TechArticle`.
4. **Why one outfit beats twenty options.** Choice-paralysis essay. Cites Iyengar & Lepper jam study.
5. **A 12-piece capsule for a 4-day city trip.** Practical, SEO-friendly. Pairs with Act V.
6. **What BURS will never do.** The anti-list as its own post. Privacy + no-ads + no-shopping. Highly quotable.

Existing 6 posts are restyled in the new template; bodies unchanged. Rewrite later, separately.

### 9.4 Localisation
English only at v1. Pricing shows both currencies. A Swedish-language version of the home + manifesto is a v2 — flagged, not built now.

## 10. Tech stack

### 10.1 Stack
- **Astro 4.x**, SSG mode (no SSR).
- **Integrations:** `@astrojs/sitemap`, `@astrojs/mdx`, `@astrojs/rss`, `astro-og-canvas`, `@astrojs/check`.
- **Content Collections** (Zod-typed) for blog and answers.
- **No CSS framework.** Hand-written CSS in `src/styles/`.
- **No JS runtime framework.** Vanilla JS for cursor, scroll-trigger, video lazy-mount.
- **Self-hosted fonts** in `public/fonts/`, preloaded. No Google Fonts CDN at runtime.

### 10.2 File tree

```
burs-landing-main/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── _redirects                 # Cloudflare. /features → /method.
│   ├── robots.txt                 # AI bots allowed.
│   ├── llms.txt                   # expanded.
│   ├── manifest.json
│   ├── favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png
│   ├── og-image.png
│   ├── fonts/                     # self-hosted woff2
│   └── assets/                    # 7 act screens (existing JPEGs preserved)
│
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── manifesto.astro
│   │   ├── method.astro
│   │   ├── pricing.astro
│   │   ├── press.astro
│   │   ├── answers.astro
│   │   ├── faq.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── rss.xml.ts
│   │
│   ├── content/
│   │   ├── config.ts              # Zod schemas
│   │   ├── blog/                  # MDX posts (6 existing migrated + 6 new)
│   │   └── answers/               # MDX
│   │
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Schema.astro           # <Schema kind="Organization" />
│   │   ├── HeroVideo.astro
│   │   ├── ActSection.astro       # reused 5x on home
│   │   ├── ManifestoBlock.astro
│   │   ├── PullQuote.astro
│   │   ├── ComparisonTable.astro
│   │   ├── DefinitionList.astro
│   │   ├── DropCap.astro
│   │   ├── PriceCard.astro
│   │   └── Cursor.astro
│   │
│   ├── layouts/
│   │   ├── Base.astro             # head, fonts, schema, nav, footer
│   │   ├── Editorial.astro        # /manifesto, /privacy, /terms, blog post
│   │   └── Page.astro             # /method, /pricing, /press, /answers, /faq
│   │
│   ├── styles/
│   │   ├── tokens.css             # :root colors, type, spacing, motion
│   │   ├── reset.css
│   │   ├── typography.css
│   │   ├── nav.css
│   │   ├── footer.css
│   │   └── utilities.css
│   │
│   └── lib/
│       ├── seo.ts                 # per-page meta builder
│       ├── schema.ts              # typed JSON-LD constructors
│       └── prices.ts              # single source of truth for SE/EU prices
│
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-05-06-burs-landing-redesign.md   # this file
        └── plans/
            └── 2026-05-06-burs-landing-redesign-plan.md  # follow-up
```

### 10.3 Deploy
- **Cloudflare Pages.**
- **Build command:** `npm run build`.
- **Output dir:** `dist/`.
- **Same domain.** `_redirects` carries over (already Cloudflare-native).
- **Preview deploys per branch.**

### 10.4 Migration order
Astro is scaffolded on a `redesign` git branch (the current static site stays on `main` and live in production). New site is built green, reviewed page-by-page, then merged and deployed on launch day. Detailed sequencing belongs in the implementation plan.

## 11. Out of scope (explicit)

These are deliberately *not* part of v1 — flagged so they don't sneak in:

- **Swedish-language translation** of any page. (v2.)
- **Per-feature deep pages** (`/wardrobe`, `/outfit-of-the-day`, `/stylist`, `/week`, `/travel`). The Acts on the home page cover these; deep pages only earn their place if blog metrics show appetite.
- **Email-capture / waitlist UI.** Primary CTA is install. (If demand emerges, a subtle footer field is the v2 addition.)
- **Rewriting bodies of the existing 6 blog posts.** They get the new template only.
- **Custom CMS.** Content lives as MDX in the repo.
- **A/B testing infrastructure.** Editorial sites are too small to A/B test responsibly.
- **Animation libraries** (Framer Motion, GSAP). Vanilla CSS + tiny vanilla JS only.
- **Analytics beyond what already exists.** Out of scope to choose a vendor here.

## 12. Success criteria

- All 10 routes render with no console errors and pass HTML validation.
- Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100, on `/`, `/manifesto`, `/method`, `/pricing`, `/blog`, and one blog post.
- Schema.org validates on every page (Schema Markup Validator, no errors).
- `prefers-reduced-motion` honored — site is fully usable with all motion off.
- Every page passes the "AI citation test": pasted into Perplexity / ChatGPT / Claude with a prompt like *"summarize this page"*, the model returns the manifesto thesis verbatim and at least three accurate facts (pricing, what BURS is not, how the scan works).
- The hero and reprise videos play on iOS Safari, Android Chrome, desktop Safari/Chrome/Firefox/Edge.
- New site visually consistent across the 10 pages (single design language, no orphans).

## 13. Decisions log

| # | Decision | Reason |
|---|---|---|
| 1 | Manifesto-first arc, not day-in-the-life or 5-Acts arc | Punchier, more quotable; better for press and AI summaries |
| 2 | Villain = the unworn 80%, with anti-shopping/feed/grid as supporting jabs | Most defensible (literally true about the product); manifesto stays focused |
| 3 | 10 pages incl. dedicated `/answers` and `/faq` | Maximum AI surface area without 12+ feature pages to maintain |
| 4 | Visual direction: Cinema Inverse minus film scaffolding | Selected after browser comparison (option B); cleaner without the literal film cues |
| 5 | Allow AI training crawlers in `robots.txt` | BURS being quoted *is* the marketing |
| 6 | Astro SSG, not hand-rolled HTML or templating script | Right tool at this scale; clean components, MDX blog, content collections |
| 7 | Cloudflare Pages preserved as host | `_redirects` already in place; no migration |
| 8 | English-only at v1 | Swedish localisation is v2, explicitly out of scope |
| 9 | Two videos preserved exactly from prior draft | Keep what was already shot; don't recommission |
| 10 | Self-hosted fonts | Performance + privacy; no runtime CDN dependency |

---

*End of design spec. Implementation plan to follow as `docs/superpowers/plans/2026-05-06-burs-landing-redesign-plan.md`.*
