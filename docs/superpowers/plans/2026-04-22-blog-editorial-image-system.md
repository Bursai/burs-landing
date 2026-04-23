# Blog Editorial Image System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and integrate twelve editorial blog images so the blog index and all six article pages use real, premium imagery with matching metadata and alt text.

**Architecture:** Keep the blog implementation static. Store all generated assets in `assets/blog/`, update the blog index cards to use card crops, update article hero blocks to use hero crops, and point every article's social metadata and JSON-LD image field at its corresponding hero asset. Use one shared visual system with per-post prompts so the full set reads as one family.

**Tech Stack:** Static HTML, shared CSS in `blog/article.css`, page-local CSS in `blog/index.html`, local JPG assets, PowerShell verification, browser smoke checks

---

## File Structure

**Create**

- `assets/blog/smarter-wardrobe-hero.jpg`
- `assets/blog/smarter-wardrobe-card.jpg`
- `assets/blog/ai-styling-hero.jpg`
- `assets/blog/ai-styling-card.jpg`
- `assets/blog/capsule-wardrobe-hero.jpg`
- `assets/blog/capsule-wardrobe-card.jpg`
- `assets/blog/wear-more-buy-less-hero.jpg`
- `assets/blog/wear-more-buy-less-card.jpg`
- `assets/blog/outfit-planning-hero.jpg`
- `assets/blog/outfit-planning-card.jpg`
- `assets/blog/style-feedback-hero.jpg`
- `assets/blog/style-feedback-card.jpg`

**Modify**

- `blog/index.html`
- `blog/article.css`
- `blog/smarter-wardrobe/index.html`
- `blog/ai-styling/index.html`
- `blog/capsule-wardrobe/index.html`
- `blog/wear-more-buy-less/index.html`
- `blog/outfit-planning/index.html`
- `blog/style-feedback/index.html`

**Test**

- Manual browser review at:
  - `http://127.0.0.1:4174/blog/`
  - `http://127.0.0.1:4174/blog/smarter-wardrobe/`
  - `http://127.0.0.1:4174/blog/ai-styling/`
  - `http://127.0.0.1:4174/blog/capsule-wardrobe/`
  - `http://127.0.0.1:4174/blog/wear-more-buy-less/`
  - `http://127.0.0.1:4174/blog/outfit-planning/`
  - `http://127.0.0.1:4174/blog/style-feedback/`
- Asset existence checks under `assets/blog/`
- Metadata checks with `Select-String`

### Shared Asset Map

| Slug | Hero Asset | Card Asset |
| --- | --- | --- |
| `smarter-wardrobe` | `/assets/blog/smarter-wardrobe-hero.jpg` | `/assets/blog/smarter-wardrobe-card.jpg` |
| `ai-styling` | `/assets/blog/ai-styling-hero.jpg` | `/assets/blog/ai-styling-card.jpg` |
| `capsule-wardrobe` | `/assets/blog/capsule-wardrobe-hero.jpg` | `/assets/blog/capsule-wardrobe-card.jpg` |
| `wear-more-buy-less` | `/assets/blog/wear-more-buy-less-hero.jpg` | `/assets/blog/wear-more-buy-less-card.jpg` |
| `outfit-planning` | `/assets/blog/outfit-planning-hero.jpg` | `/assets/blog/outfit-planning-card.jpg` |
| `style-feedback` | `/assets/blog/style-feedback-hero.jpg` | `/assets/blog/style-feedback-card.jpg` |

### Shared Metadata Map

| Slug | Hero Alt | Card Alt |
| --- | --- | --- |
| `smarter-wardrobe` | `Wardrobe essentials arranged in a calm, structured system with folded knits, hangers, and a notebook on a cream surface` | `Edited wardrobe pieces and a notebook arranged as a smarter wardrobe guide` |
| `ai-styling` | `Garments, printed outfit references, and styling notes arranged on a cream table` | `Wardrobe pairings and styling references arranged with analytical precision` |
| `capsule-wardrobe` | `An open suitcase with neatly edited travel pieces arranged for a modern capsule wardrobe` | `Packed capsule wardrobe pieces arranged beside a structured travel case` |
| `wear-more-buy-less` | `Worn garments, folded denim, and mending tools arranged as a care-focused wardrobe still life` | `Repair tools and worn garments arranged to suggest longer clothing use` |
| `outfit-planning` | `A weekly wardrobe planning still life with garments, a planner, and calendar cues on a cream surface` | `A planned outfit grouping arranged beside a weekly planning cue` |
| `style-feedback` | `Three outfit alternatives arranged for comparison with a hand refining the final choice` | `A styling comparison crop showing one refined outfit decision` |

### Shared Server Command

Use this for visual verification when the static server is not already running:

```powershell
python -m http.server 4174 --bind 127.0.0.1
```

Expected: `Serving HTTP on 127.0.0.1 port 4174`

---

### Task 1: Generate the Smarter Wardrobe Assets

**Files:**
- Create: `assets/blog/smarter-wardrobe-hero.jpg`
- Create: `assets/blog/smarter-wardrobe-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/smarter-wardrobe-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/smarter-wardrobe-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a luxury wardrobe technology blog. Scene: wardrobe essentials arranged in a calm, structured system on a soft cream surface, including folded knitwear, a charcoal blazer, a white shirt, clean hangers, and a notebook. Lighting: soft natural daylight, premium magazine still-life, quiet shadows, restrained warm gold accents, deep charcoal anchors, no logos, no text, no UI, no stock-photo energy, no bright accent colors. Mood: clear, ordered, intelligent, premium, editorial.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/smarter-wardrobe-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop of edited wardrobe pieces and a notebook arranged as a smarter wardrobe guide. Cream surface, charcoal and ivory garments, restrained warm gold accent, soft daylight, premium editorial still-life, no text, no logos, no UI, no loud colors.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/smarter-wardrobe-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/smarter-wardrobe-hero.jpg,assets/blog/smarter-wardrobe-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/smarter-wardrobe-hero.jpg assets/blog/smarter-wardrobe-card.jpg
git commit -m "feat: add smarter wardrobe editorial blog images"
```

### Task 2: Generate the AI Styling Assets

**Files:**
- Create: `assets/blog/ai-styling-hero.jpg`
- Create: `assets/blog/ai-styling-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/ai-styling-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/ai-styling-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a blog post about AI styling. Scene: garments, printed outfit references, styling notes, and a subtle selection gesture on a cream table. The image should feel analytical but tactile, premium fashion editorial rather than futuristic tech. Soft daylight, restrained warm gold accents, charcoal and ivory wardrobe objects, no visible screens, no text, no logos, no neon, no purple.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/ai-styling-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop of wardrobe pairings, styling references, and decision cues laid out with analytical precision. Cream base, charcoal and soft neutral garments, a hint of warm gold, soft daylight, premium editorial still-life, no logos, no text, no UI.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/ai-styling-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/ai-styling-hero.jpg,assets/blog/ai-styling-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/ai-styling-hero.jpg assets/blog/ai-styling-card.jpg
git commit -m "feat: add AI styling editorial blog images"
```

### Task 3: Generate the Capsule Wardrobe Assets

**Files:**
- Create: `assets/blog/capsule-wardrobe-hero.jpg`
- Create: `assets/blog/capsule-wardrobe-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/capsule-wardrobe-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/capsule-wardrobe-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a blog post about the modern capsule wardrobe. Scene: open suitcase with neatly edited travel pieces, shoes, and soft travel cues arranged on a cream surface. Calm spacing, premium magazine still-life, soft daylight, charcoal and neutral garments, restrained warm gold detail, no airport cliches, no text, no logos, no UI.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/capsule-wardrobe-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop of packed capsule wardrobe pieces beside a structured travel case. Soft daylight, cream base, charcoal and neutral garments, refined composition, no text, no logos, no UI.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/capsule-wardrobe-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/capsule-wardrobe-hero.jpg,assets/blog/capsule-wardrobe-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/capsule-wardrobe-hero.jpg assets/blog/capsule-wardrobe-card.jpg
git commit -m "feat: add capsule wardrobe editorial blog images"
```

### Task 4: Generate the Wear More Buy Less Assets

**Files:**
- Create: `assets/blog/wear-more-buy-less-hero.jpg`
- Create: `assets/blog/wear-more-buy-less-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/wear-more-buy-less-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/wear-more-buy-less-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a research-led blog post about wearing more and buying less. Scene: worn garments, folded denim, fabric texture, and mending tools arranged as a care-focused wardrobe still life. Soft natural daylight, cream surface, charcoal and washed neutrals, restrained warm gold accents, tactile sustainability, no activism poster styling, no logos, no text, no UI.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/wear-more-buy-less-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop of repair tools and worn garments arranged to suggest longer clothing use. Cream base, soft daylight, premium editorial texture study, no text, no logos, no UI.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/wear-more-buy-less-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/wear-more-buy-less-hero.jpg,assets/blog/wear-more-buy-less-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/wear-more-buy-less-hero.jpg assets/blog/wear-more-buy-less-card.jpg
git commit -m "feat: add wear more buy less editorial blog images"
```

### Task 5: Generate the Outfit Planning Assets

**Files:**
- Create: `assets/blog/outfit-planning-hero.jpg`
- Create: `assets/blog/outfit-planning-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/outfit-planning-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/outfit-planning-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a blog post about outfit planning without overthinking. Scene: a weekly wardrobe planning still life with garments, a planner, and subtle calendar cues arranged on a cream surface. Calm spacing, soft daylight, premium editorial tone, charcoal and soft neutral garments, restrained warm gold detail, optional hand presence arranging one item, no text, no logos, no UI.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/outfit-planning-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop of a planned outfit grouping arranged beside a weekly planning cue. Cream surface, soft daylight, elegant structure, premium editorial styling, no text, no logos, no UI.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/outfit-planning-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/outfit-planning-hero.jpg,assets/blog/outfit-planning-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/outfit-planning-hero.jpg assets/blog/outfit-planning-card.jpg
git commit -m "feat: add outfit planning editorial blog images"
```

### Task 6: Generate the Style Feedback Assets

**Files:**
- Create: `assets/blog/style-feedback-hero.jpg`
- Create: `assets/blog/style-feedback-card.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/style-feedback-hero.jpg`
- Test: `http://127.0.0.1:4174/assets/blog/style-feedback-card.jpg`

- [ ] **Step 1: Use the exact hero prompt**

```text
Create a wide editorial fashion still-life image, 1600x900, for a blog post about style feedback. Scene: three outfit alternatives arranged for comparison with a hand refining the final choice. Cream surface, charcoal and neutral wardrobe pieces, subtle warmth, soft daylight, premium editorial composition, no visible UI, no text, no logos, no loud colors.
```

- [ ] **Step 2: Save the hero asset**

```text
Output file: assets/blog/style-feedback-hero.jpg
```

- [ ] **Step 3: Use the exact card prompt**

```text
Create a vertical editorial fashion still-life image, 900x1200, for the same blog post. Tight crop showing one refined outfit decision from a styling comparison. Cream background, soft daylight, tactile fabric detail, premium fashion editorial styling, no text, no logos, no UI.
```

- [ ] **Step 4: Save the card asset**

```text
Output file: assets/blog/style-feedback-card.jpg
```

- [ ] **Step 5: Verify both files exist and have non-zero size**

Run:

```powershell
Get-ChildItem assets/blog/style-feedback-hero.jpg,assets/blog/style-feedback-card.jpg | Select-Object Name,Length
```

Expected: two rows, both with `Length` greater than `0`

- [ ] **Step 6: Commit**

```bash
git add assets/blog/style-feedback-hero.jpg assets/blog/style-feedback-card.jpg
git commit -m "feat: add style feedback editorial blog images"
```

### Task 7: Replace Blog Index Placeholder Thumbnails With Real Card Images

**Files:**
- Modify: `blog/index.html`
- Test: `http://127.0.0.1:4174/blog/`

- [ ] **Step 1: Replace the thumbnail CSS block**

Replace the current `.thumb` rules in `blog/index.html` with:

```css
.thumb{display:block;width:100%;height:210px;object-fit:cover;object-position:center;background:var(--surf);}
```

Delete this rule entirely:

```css
.thumb::after{content:"";position:absolute;inset:24px;border:1px solid rgba(245,240,232,.38);border-radius:8px;}
```

Keep the mobile override but make it image-safe:

```css
@media(max-width:640px){
  .thumb{height:136px;}
}
```

- [ ] **Step 2: Replace all six blog card thumbnail nodes**

In `blog/index.html`, replace the six existing `div.thumb` nodes with these exact image tags:

```html
<img class="thumb" src="/assets/blog/smarter-wardrobe-card.jpg" alt="Edited wardrobe pieces and a notebook arranged as a smarter wardrobe guide" loading="lazy" decoding="async" />
<img class="thumb" src="/assets/blog/ai-styling-card.jpg" alt="Wardrobe pairings and styling references arranged with analytical precision" loading="lazy" decoding="async" />
<img class="thumb" src="/assets/blog/capsule-wardrobe-card.jpg" alt="Packed capsule wardrobe pieces arranged beside a structured travel case" loading="lazy" decoding="async" />
<img class="thumb" src="/assets/blog/wear-more-buy-less-card.jpg" alt="Repair tools and worn garments arranged to suggest longer clothing use" loading="lazy" decoding="async" />
<img class="thumb" src="/assets/blog/outfit-planning-card.jpg" alt="A planned outfit grouping arranged beside a weekly planning cue" loading="lazy" decoding="async" />
<img class="thumb" src="/assets/blog/style-feedback-card.jpg" alt="A styling comparison crop showing one refined outfit decision" loading="lazy" decoding="async" />
```

- [ ] **Step 3: Run a blog index smoke check**

Run:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:4174/blog/' -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add blog/index.html
git commit -m "feat: replace blog card placeholders with editorial images"
```

### Task 8: Replace Article Hero Placeholder Blocks With Real Hero Images

**Files:**
- Modify: `blog/article.css`
- Modify: `blog/smarter-wardrobe/index.html`
- Modify: `blog/ai-styling/index.html`
- Modify: `blog/capsule-wardrobe/index.html`
- Modify: `blog/wear-more-buy-less/index.html`
- Modify: `blog/outfit-planning/index.html`
- Modify: `blog/style-feedback/index.html`
- Test: all six article URLs under `http://127.0.0.1:4174/blog/`

- [ ] **Step 1: Replace the shared `.article-visual` CSS**

In `blog/article.css`, replace the current `.article-visual`, `.article-visual::before`, and `.article-visual::after` rules with:

```css
.article-visual{display:block;width:100%;height:340px;margin:56px 0 0;border:1px solid var(--border);border-radius:8px;background:var(--surf);object-fit:cover;object-position:center;}
```

Keep the mobile height override but remove pseudo-element dependence:

```css
@media(max-width:640px){
  .article-visual{height:230px;margin-top:40px;}
}
```

- [ ] **Step 2: Replace the six article hero nodes**

Use these exact hero image tags:

```html
<img class="article-visual" src="/assets/blog/smarter-wardrobe-hero.jpg" alt="Wardrobe essentials arranged in a calm, structured system with folded knits, hangers, and a notebook on a cream surface" loading="eager" decoding="async" />
<img class="article-visual" src="/assets/blog/ai-styling-hero.jpg" alt="Garments, printed outfit references, and styling notes arranged on a cream table" loading="eager" decoding="async" />
<img class="article-visual" src="/assets/blog/capsule-wardrobe-hero.jpg" alt="An open suitcase with neatly edited travel pieces arranged for a modern capsule wardrobe" loading="eager" decoding="async" />
<img class="article-visual" src="/assets/blog/wear-more-buy-less-hero.jpg" alt="Worn garments, folded denim, and mending tools arranged as a care-focused wardrobe still life" loading="eager" decoding="async" />
<img class="article-visual" src="/assets/blog/outfit-planning-hero.jpg" alt="A weekly wardrobe planning still life with garments, a planner, and calendar cues on a cream surface" loading="eager" decoding="async" />
<img class="article-visual" src="/assets/blog/style-feedback-hero.jpg" alt="Three outfit alternatives arranged for comparison with a hand refining the final choice" loading="eager" decoding="async" />
```

- [ ] **Step 3: Smoke-check all article routes**

Run:

```powershell
$paths=@(
  'http://127.0.0.1:4174/blog/smarter-wardrobe/',
  'http://127.0.0.1:4174/blog/ai-styling/',
  'http://127.0.0.1:4174/blog/capsule-wardrobe/',
  'http://127.0.0.1:4174/blog/wear-more-buy-less/',
  'http://127.0.0.1:4174/blog/outfit-planning/',
  'http://127.0.0.1:4174/blog/style-feedback/'
)
$paths | ForEach-Object { (Invoke-WebRequest -Uri $_ -UseBasicParsing).StatusCode }
```

Expected: six lines of `200`

- [ ] **Step 4: Commit**

```bash
git add blog/article.css blog/smarter-wardrobe/index.html blog/ai-styling/index.html blog/capsule-wardrobe/index.html blog/wear-more-buy-less/index.html blog/outfit-planning/index.html blog/style-feedback/index.html
git commit -m "feat: add editorial hero images to blog articles"
```

### Task 9: Update Article Social Metadata And JSON-LD Image Fields

**Files:**
- Modify: `blog/smarter-wardrobe/index.html`
- Modify: `blog/ai-styling/index.html`
- Modify: `blog/capsule-wardrobe/index.html`
- Modify: `blog/wear-more-buy-less/index.html`
- Modify: `blog/outfit-planning/index.html`
- Modify: `blog/style-feedback/index.html`
- Test: same six article files with `Select-String`

- [ ] **Step 1: Update each article head block**

For each article file, replace the logo image metadata with the matching asset URL and alt.

Use these exact values:

```text
blog/smarter-wardrobe/index.html
  og:image = https://burs.me/assets/blog/smarter-wardrobe-hero.jpg
  og:image:alt = Wardrobe essentials arranged in a calm, structured system with folded knits, hangers, and a notebook on a cream surface
  twitter:image = https://burs.me/assets/blog/smarter-wardrobe-hero.jpg
  twitter:image:alt = Wardrobe essentials arranged in a calm, structured system with folded knits, hangers, and a notebook on a cream surface
  JSON-LD image = https://burs.me/assets/blog/smarter-wardrobe-hero.jpg

blog/ai-styling/index.html
  og:image = https://burs.me/assets/blog/ai-styling-hero.jpg
  og:image:alt = Garments, printed outfit references, and styling notes arranged on a cream table
  twitter:image = https://burs.me/assets/blog/ai-styling-hero.jpg
  twitter:image:alt = Garments, printed outfit references, and styling notes arranged on a cream table
  JSON-LD image = https://burs.me/assets/blog/ai-styling-hero.jpg

blog/capsule-wardrobe/index.html
  og:image = https://burs.me/assets/blog/capsule-wardrobe-hero.jpg
  og:image:alt = An open suitcase with neatly edited travel pieces arranged for a modern capsule wardrobe
  twitter:image = https://burs.me/assets/blog/capsule-wardrobe-hero.jpg
  twitter:image:alt = An open suitcase with neatly edited travel pieces arranged for a modern capsule wardrobe
  JSON-LD image = https://burs.me/assets/blog/capsule-wardrobe-hero.jpg

blog/wear-more-buy-less/index.html
  og:image = https://burs.me/assets/blog/wear-more-buy-less-hero.jpg
  og:image:alt = Worn garments, folded denim, and mending tools arranged as a care-focused wardrobe still life
  twitter:image = https://burs.me/assets/blog/wear-more-buy-less-hero.jpg
  twitter:image:alt = Worn garments, folded denim, and mending tools arranged as a care-focused wardrobe still life
  JSON-LD image = https://burs.me/assets/blog/wear-more-buy-less-hero.jpg

blog/outfit-planning/index.html
  og:image = https://burs.me/assets/blog/outfit-planning-hero.jpg
  og:image:alt = A weekly wardrobe planning still life with garments, a planner, and calendar cues on a cream surface
  twitter:image = https://burs.me/assets/blog/outfit-planning-hero.jpg
  twitter:image:alt = A weekly wardrobe planning still life with garments, a planner, and calendar cues on a cream surface
  JSON-LD image = https://burs.me/assets/blog/outfit-planning-hero.jpg

blog/style-feedback/index.html
  og:image = https://burs.me/assets/blog/style-feedback-hero.jpg
  og:image:alt = Three outfit alternatives arranged for comparison with a hand refining the final choice
  twitter:image = https://burs.me/assets/blog/style-feedback-hero.jpg
  twitter:image:alt = Three outfit alternatives arranged for comparison with a hand refining the final choice
  JSON-LD image = https://burs.me/assets/blog/style-feedback-hero.jpg
```

- [ ] **Step 2: Add missing `twitter:image:alt` tags**

Use these exact tags:

```html
<meta name="twitter:image:alt" content="Wardrobe essentials arranged in a calm, structured system with folded knits, hangers, and a notebook on a cream surface" />
<meta name="twitter:image:alt" content="Garments, printed outfit references, and styling notes arranged on a cream table" />
<meta name="twitter:image:alt" content="An open suitcase with neatly edited travel pieces arranged for a modern capsule wardrobe" />
<meta name="twitter:image:alt" content="Worn garments, folded denim, and mending tools arranged as a care-focused wardrobe still life" />
<meta name="twitter:image:alt" content="A weekly wardrobe planning still life with garments, a planner, and calendar cues on a cream surface" />
<meta name="twitter:image:alt" content="Three outfit alternatives arranged for comparison with a hand refining the final choice" />
```

- [ ] **Step 3: Verify metadata replacements**

Run:

```powershell
Select-String -Path .\blog\*\index.html -Pattern 'assets/blog/.+-hero.jpg|twitter:image:alt'
```

Expected: each article file prints matches for `og:image`, `twitter:image`, `twitter:image:alt`, and the JSON-LD `image` field

- [ ] **Step 4: Commit**

```bash
git add blog/smarter-wardrobe/index.html blog/ai-styling/index.html blog/capsule-wardrobe/index.html blog/wear-more-buy-less/index.html blog/outfit-planning/index.html blog/style-feedback/index.html
git commit -m "feat: add blog post social metadata for editorial images"
```

### Task 10: Final Static Verification And Visual Review

**Files:**
- Modify: none
- Test: `blog/index.html`, `blog/article.css`, all six article files, all twelve image assets

- [ ] **Step 1: Verify all asset routes return 200**

Run:

```powershell
$paths=@(
  '/assets/blog/smarter-wardrobe-hero.jpg',
  '/assets/blog/smarter-wardrobe-card.jpg',
  '/assets/blog/ai-styling-hero.jpg',
  '/assets/blog/ai-styling-card.jpg',
  '/assets/blog/capsule-wardrobe-hero.jpg',
  '/assets/blog/capsule-wardrobe-card.jpg',
  '/assets/blog/wear-more-buy-less-hero.jpg',
  '/assets/blog/wear-more-buy-less-card.jpg',
  '/assets/blog/outfit-planning-hero.jpg',
  '/assets/blog/outfit-planning-card.jpg',
  '/assets/blog/style-feedback-hero.jpg',
  '/assets/blog/style-feedback-card.jpg'
)
$paths | ForEach-Object { "{0} {1}" -f $_, (Invoke-WebRequest -Uri ("http://127.0.0.1:4174" + $_) -UseBasicParsing).StatusCode }
```

Expected: twelve lines ending in `200`

- [ ] **Step 2: Verify the main pages return 200**

Run:

```powershell
$pages=@(
  'http://127.0.0.1:4174/blog/',
  'http://127.0.0.1:4174/blog/smarter-wardrobe/',
  'http://127.0.0.1:4174/blog/ai-styling/',
  'http://127.0.0.1:4174/blog/capsule-wardrobe/',
  'http://127.0.0.1:4174/blog/wear-more-buy-less/',
  'http://127.0.0.1:4174/blog/outfit-planning/',
  'http://127.0.0.1:4174/blog/style-feedback/'
)
$pages | ForEach-Object { "{0} {1}" -f $_, (Invoke-WebRequest -Uri $_ -UseBasicParsing).StatusCode }
```

Expected: seven lines ending in `200`

- [ ] **Step 3: Check that all inserted images have alt text**

Run:

```powershell
Select-String -Path .\blog\index.html,.\blog\*\index.html -Pattern '<img[^>]+alt='
```

Expected: matches for all six card images and all six article hero images

- [ ] **Step 4: Manual browser review**

Review:

```text
1. Open /blog and confirm all six cards show real editorial images.
2. Open each article and confirm the hero crop feels premium on desktop and mobile.
3. Confirm no image looks overly dark, stock-like, or visually off-brand.
4. Confirm card and hero crops feel related for the same post.
```

- [ ] **Step 5: Commit**

```bash
git add assets/blog blog/index.html blog/article.css blog/smarter-wardrobe/index.html blog/ai-styling/index.html blog/capsule-wardrobe/index.html blog/wear-more-buy-less/index.html blog/outfit-planning/index.html blog/style-feedback/index.html
git commit -m "feat: complete BURS blog editorial image system"
```
