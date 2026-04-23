# Features Storytelling Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/features` into a five-scene cinematic product story with a supporting feature atlas, while keeping the current pricing viewer, nav behavior, and BURS brand system intact.

**Architecture:** Keep the repo's current static-site pattern by implementing the rebuild inside `features/index.html` rather than introducing a component system or build step. Add one repo-local PowerShell verification script to assert the new scene structure, atlas, GSAP hooks, and pricing carry-over against a running local static server, then use browser QA for motion and responsive placement.

**Tech Stack:** Static HTML/CSS/JS, GSAP + ScrollTrigger CDN, PowerShell verification, Python static server, Chrome browser QA

---

## File Map

- `features/index.html`
  - owns the full `/features` page head, styles, markup, and page-specific scripts
  - will be rewritten from repeated alternating feature blocks into:
    - cinematic hero
    - five scene sections
    - supporting feature atlas
    - existing one-card pricing viewer
    - existing footer/nav patterns

- `scripts/verify-features-storytelling.ps1`
  - new verification helper
  - fetches the live `/features/` page from localhost and checks for required structural markers
  - will be extended as implementation adds visual/motion hooks

## Local Review Setup

Use the repo root as the web root so `/features/`, `/assets/act-i-wardrobe-screen.jpeg`, and the rest of the static pages resolve correctly.

```powershell
Set-Location C:\Users\borna\OneDrive\Desktop\BZ\Burs\burs-landing-codex-pr
py -m http.server 4174
```

Expected:

```text
Serving HTTP on :: port 4174 (http://[::]:4174/)
```

Use this URL in all verification commands:

```text
http://127.0.0.1:4174/features/
```

### Task 1: Add a Repeatable Features Verification Script

**Files:**
- Create: `scripts/verify-features-storytelling.ps1`
- Test: `scripts/verify-features-storytelling.ps1`

- [ ] **Step 1: Create the verification script with failing structural assertions**

```powershell
param(
  [string]$Url = "http://127.0.0.1:4174/features/"
)

try {
  $response = Invoke-WebRequest -UseBasicParsing $Url
} catch {
  Write-Error "FETCH_FAIL $Url"
  exit 1
}

if ($response.StatusCode -ne 200) {
  Write-Error "STATUS_FAIL $($response.StatusCode)"
  exit 1
}

$html = $response.Content
$requiredMarkers = @(
  'class="story-hero"',
  'data-scene="scan"',
  'data-scene="ootd"',
  'data-scene="stylist"',
  'data-scene="planner"',
  'data-scene="style-dna"',
  'class="feature-atlas"',
  'class="pricing-panel"',
  'gsap.min.js',
  'ScrollTrigger.min.js'
)

$missing = foreach ($marker in $requiredMarkers) {
  if ($html -notmatch [regex]::Escape($marker)) { $marker }
}

if ($missing.Count -gt 0) {
  Write-Error ("MISSING_MARKERS`n - " + ($missing -join "`n - "))
  exit 1
}

$sceneCount = ([regex]::Matches($html, 'data-scene="')).Count
if ($sceneCount -ne 5) {
  Write-Error "SCENE_COUNT_FAIL expected=5 actual=$sceneCount"
  exit 1
}

Write-Output "PASS features story structure markers found"
```

- [ ] **Step 2: Run the script to verify it fails against the current page**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
MISSING_MARKERS
 - class="story-hero"
 - data-scene="scan"
 - data-scene="ootd"
 - data-scene="style-dna"
```

- [ ] **Step 3: Commit the failing verification harness**

```bash
git add scripts/verify-features-storytelling.ps1
git commit -m "test: add features storytelling verification script"
```

### Task 2: Replace the Repeated Feature Blocks with Story Sections and Atlas Markup

**Files:**
- Modify: `features/index.html` (hero section, all repeated `.feature-section` blocks, atlas section, chapter copy)
- Test: `scripts/verify-features-storytelling.ps1`

- [ ] **Step 1: Replace the hero and repeated feature sections with the new storytelling skeleton**

Use this structure in `features/index.html` in place of the current hero + repeated feature blocks:

```html
<section class="story-hero">
  <div class="story-hero-inner">
    <div class="eyebrow">Features</div>
    <h1>A wardrobe is only useful when it becomes usable.</h1>
    <p>BURS turns an underused closet into a system you can actually rely on every morning.</p>
  </div>
</section>

<section class="feature-scene scene-scan" data-scene="scan">
  <div class="scene-inner">
    <div class="scene-copy">
      <div class="scene-kicker">Scene I</div>
      <h2>Live Garment Scan</h2>
      <p>Point your camera at one garment and BURS reads it live in under 2 seconds. No tagging, no admin, no spreadsheet energy.</p>
      <ul class="scene-points">
        <li>Live scan in under 2 seconds</li>
        <li>Computer vision reads the garment for you</li>
        <li>No manual organization workflow</li>
      </ul>
    </div>
    <div class="scene-media">
      <img src="/assets/act-i-wardrobe-screen.jpeg" alt="BURS wardrobe screen showing scanned garments and wardrobe categories" class="scene-shot" loading="eager" decoding="async" />
    </div>
  </div>
</section>

<section class="feature-scene scene-ootd" data-scene="ootd">
  <div class="scene-inner">
    <div class="scene-copy">
      <div class="scene-kicker">Scene II</div>
      <h2>Outfit of the Day</h2>
      <p>Every morning, BURS reads the weather, your calendar, and your context, then returns one calm, confident answer.</p>
      <ul class="scene-points">
        <li>Weather-aware outfit logic</li>
        <li>Calendar-aware context</li>
        <li>One clear look instead of browsing</li>
      </ul>
    </div>
    <div class="scene-media scene-media-daylook" role="img" aria-label="BURS outfit of the day visual showing morning weather, calendar cues, and one recommended outfit">
      <div class="daylook-shell">
        <div class="daylook-head">
          <span>08:10</span>
          <span>Cloudy · 10°C</span>
        </div>
        <div class="daylook-title">Today’s look</div>
        <div class="daylook-event">Client lunch · 12:30</div>
        <div class="daylook-grid">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="daylook-cta">Wear this</div>
      </div>
    </div>
  </div>
</section>

<section class="feature-scene scene-stylist" data-scene="stylist">
  <div class="scene-inner">
    <div class="scene-copy">
      <div class="scene-kicker">Scene III</div>
      <h2>AI Stylist Chat</h2>
      <p>Ask BURS to make a look sharper, softer, warmer, or more relaxed. It refines against the wardrobe you actually own.</p>
      <ul class="scene-points">
        <li>Refine outfits in plain language</li>
        <li>Swap pieces without starting over</li>
        <li>Ask against your real closet</li>
      </ul>
    </div>
    <div class="scene-media">
      <img src="/assets/act-iii-stylist-screen.jpeg" alt="BURS AI stylist chat screen showing outfit refinement and save actions" class="scene-shot" loading="lazy" decoding="async" />
    </div>
  </div>
</section>

<section class="feature-scene scene-planner" data-scene="planner">
  <div class="scene-inner">
    <div class="scene-copy">
      <div class="scene-kicker">Scene IV</div>
      <h2>Week Planner</h2>
      <p>Calendar sync turns a run of events into a dressed week. BURS plans ahead so the next seven days feel clear before they start.</p>
      <ul class="scene-points">
        <li>Google Calendar + ICS</li>
        <li>Seven-day planning</li>
        <li>Event-aware outfit preparation</li>
      </ul>
    </div>
    <div class="scene-media">
      <img src="/assets/act-iv-week-screen.jpeg" alt="BURS week planner screen showing planned outfits for the week" class="scene-shot" loading="lazy" decoding="async" />
    </div>
  </div>
</section>

<section class="feature-scene scene-style-dna" data-scene="style-dna">
  <div class="scene-inner">
    <div class="scene-copy">
      <div class="scene-kicker">Scene V</div>
      <h2>Style DNA</h2>
      <p>After a few days of scans, saves, refinements, and daily use, BURS starts learning your fit, taste, and preferences well enough to become genuinely presentable.</p>
      <ul class="scene-points">
        <li>Built from behavior, not trends</li>
        <li>Improves as you use the app</li>
        <li>Turns taste into a repeatable system</li>
      </ul>
    </div>
    <div class="scene-media">
      <img src="/assets/act-ii-style-dna-screen.jpeg" alt="BURS Style DNA screen showing personal style profile settings" class="scene-shot" loading="lazy" decoding="async" />
    </div>
  </div>
</section>

<section class="feature-atlas" aria-labelledby="atlas-title">
  <div class="atlas-inner">
    <div class="eyebrow">More ways BURS works for you</div>
    <h2 id="atlas-title">Depth after the daily flow.</h2>
    <div class="atlas-grid">
      <article class="atlas-card"><h3>Travel Capsule</h3><p>Build a packing list from your own wardrobe.</p></article>
      <article class="atlas-card"><h3>Wardrobe Gaps</h3><p>See what unlocks more looks instead of shopping blindly.</p></article>
      <article class="atlas-card"><h3>Mood Outfit</h3><p>Translate how you want to feel into what you wear.</p></article>
      <article class="atlas-card"><h3>Ghost Mannequin</h3><p>Preview balance and silhouette without needing a mirror.</p></article>
      <article class="atlas-card"><h3>Wardrobe Insights &amp; Analytics</h3><p>Track most-worn, underused, and cost-per-wear decisions.</p></article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Run the verification script and confirm the new structure passes**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
PASS features story structure markers found
```

- [ ] **Step 3: Commit the structural rebuild**

```bash
git add features/index.html
git commit -m "feat: replace features grid with story structure"
```

### Task 3: Add the Visual System, Editorial Layout, and Responsive CSS

**Files:**
- Modify: `features/index.html` (style block for hero, scenes, atlas, device visuals, responsive behavior)
- Modify: `scripts/verify-features-storytelling.ps1`
- Test: `scripts/verify-features-storytelling.ps1`

- [ ] **Step 1: Extend the verification script to assert the new visual system hooks**

Append these markers to `$requiredMarkers` in `scripts/verify-features-storytelling.ps1`:

```powershell
$requiredMarkers += @(
  'class="scene-inner"',
  'class="scene-shot"',
  'class="scene-media-daylook"',
  'class="atlas-grid"',
  '@media(max-width:1024px)',
  '@media(max-width:640px)'
)
```

- [ ] **Step 2: Run the verification script and confirm it fails before the CSS rewrite**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
MISSING_MARKERS
 - class="scene-inner"
 - class="scene-shot"
 - class="scene-media-daylook"
 - class="atlas-grid"
```

- [ ] **Step 3: Replace the old feature-block CSS with scene-driven editorial layout styles**

In the `features/index.html` `<style>` block, replace the repeated `.feature-section` / `.feature-visual` system with this scene-first base:

```css
.story-hero{padding:128px 72px 96px;border-bottom:1px solid var(--border);background:
linear-gradient(180deg,rgba(245,240,232,.96) 0%,rgba(237,232,223,.82) 100%);}
.story-hero-inner{max-width:1180px;margin:0 auto;}
.story-hero h1{max-width:920px;}
.story-hero p{max-width:640px;font-size:19px;line-height:1.7;color:var(--muted);}

.feature-scene{padding:110px 72px;border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
.feature-scene::before{content:"";position:absolute;inset:0;pointer-events:none;background:
radial-gradient(circle at 75% 30%,rgba(201,168,108,.10),transparent 42%);}
.scene-inner{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.95fr) minmax(320px,.95fr);gap:64px;align-items:center;}
.scene-copy{max-width:600px;}
.scene-kicker{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:18px;}
.scene-copy h2{font-family:"Playfair Display",serif;font-style:italic;font-size:clamp(42px,5vw,84px);line-height:1.04;margin-bottom:20px;}
.scene-copy p{font-size:17px;line-height:1.75;color:var(--muted);margin-bottom:28px;}
.scene-points{list-style:none;display:grid;gap:12px;}
.scene-points li{display:flex;gap:12px;align-items:flex-start;font-size:14px;}
.scene-points li::before{content:"";width:12px;height:7px;border-left:1.5px solid var(--gold);border-bottom:1.5px solid var(--gold);transform:rotate(-45deg) translateY(4px);flex-shrink:0;}

.scene-media{position:relative;display:grid;place-items:center;min-height:620px;}
.scene-shot{display:block;width:min(100%,360px);height:auto;border-radius:38px;box-shadow:0 36px 80px rgba(28,25,23,.18);}
.scene-media-daylook{min-height:620px;}
.daylook-shell{width:min(100%,360px);padding:22px;border-radius:38px;background:linear-gradient(180deg,#fbf8f1 0%,#efe6d8 100%);box-shadow:0 36px 80px rgba(28,25,23,.16);display:grid;gap:16px;}
.daylook-head,.daylook-event{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--faint);}
.daylook-title{font-family:"Playfair Display",serif;font-style:italic;font-size:36px;line-height:1.04;}
.daylook-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.daylook-grid span{aspect-ratio:1;border-radius:18px;background:linear-gradient(145deg,#fff 0%,#e9dfd1 100%);border:1px solid rgba(28,25,23,.08);}
.daylook-cta{padding:16px 18px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:11px;letter-spacing:2px;text-transform:uppercase;text-align:center;}

.feature-atlas{padding:110px 72px;border-bottom:1px solid var(--border);background:var(--surf);}
.atlas-inner{max-width:1240px;margin:0 auto;}
.atlas-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:34px;}
.atlas-card{padding:26px 24px;border:1px solid var(--border);border-radius:8px;background:rgba(245,240,232,.58);}
.atlas-card h3{font-family:"Playfair Display",serif;font-style:italic;font-size:28px;line-height:1.15;margin-bottom:10px;}
.atlas-card p{font-size:15px;line-height:1.7;color:var(--muted);}

@media(max-width:1024px){
  .story-hero,.feature-scene,.feature-atlas,.pricing{padding-left:24px;padding-right:24px;}
  .scene-inner{grid-template-columns:1fr;gap:36px;}
  .scene-media,.scene-media-daylook{min-height:0;}
  .atlas-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
}

@media(max-width:640px){
  .story-hero,.feature-scene,.feature-atlas,.pricing{padding:76px 20px;}
  .scene-copy h2{font-size:clamp(36px,10vw,56px);}
  .scene-shot,.daylook-shell{width:min(100%,300px);border-radius:30px;}
  .atlas-grid{grid-template-columns:1fr;}
}
```

- [ ] **Step 4: Run the verification script and confirm the visual markers now pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
PASS features story structure markers found
```

- [ ] **Step 5: Commit the visual layout layer**

```bash
git add features/index.html scripts/verify-features-storytelling.ps1
git commit -m "feat: add cinematic scene layout to features page"
```

### Task 4: Add GSAP Scene Motion and Scroll Storytelling

**Files:**
- Modify: `features/index.html` (head script imports, reveal classes, bottom story-motion script)
- Modify: `scripts/verify-features-storytelling.ps1`
- Test: `scripts/verify-features-storytelling.ps1`

- [ ] **Step 1: Extend the verification script for GSAP story hooks**

Add these markers to `$requiredMarkers` in `scripts/verify-features-storytelling.ps1`:

```powershell
$requiredMarkers += @(
  'gsap.registerPlugin(ScrollTrigger)',
  'document.querySelectorAll(''[data-scene]'')',
  'prefers-reduced-motion',
  'class="reveal"'
)
```

- [ ] **Step 2: Run the verification script and confirm it fails before motion is added**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
MISSING_MARKERS
 - gsap.registerPlugin(ScrollTrigger)
 - document.querySelectorAll('[data-scene]')
 - prefers-reduced-motion
 - class="reveal"
```

- [ ] **Step 3: Add the same GSAP + ScrollTrigger CDN imports used on the homepage**

Insert these tags in the `<head>` of `features/index.html` after the font links:

```html
<script src="https://unpkg.com/gsap@3.12.5/dist/gsap.min.js" defer crossorigin="anonymous"></script>
<script src="https://unpkg.com/gsap@3.12.5/dist/ScrollTrigger.min.js" defer crossorigin="anonymous"></script>
```

- [ ] **Step 4: Add reveal classes and the scene animation script**

Append this scene-motion block near the end of `features/index.html`, keeping the existing nav and pricing scripts:

```html
<script>
  (function(){
    if(!window.gsap || !window.ScrollTrigger) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('.story-hero .eyebrow, .story-hero h1, .story-hero p',
      {opacity:0, y:32},
      {opacity:1, y:0, duration:0.9, stagger:0.12, ease:'power3.out'}
    );

    document.querySelectorAll('[data-scene]').forEach((scene, index) => {
      const copyBits = scene.querySelectorAll('.scene-kicker, h2, p, .scene-points li');
      const media = scene.querySelector('.scene-media');
      gsap.fromTo(copyBits,
        {opacity:0, y:28},
        {
          opacity:1, y:0, duration:0.8, stagger:0.08, ease:'power3.out',
          scrollTrigger:{trigger:scene, start:'top 78%', toggleActions:'play none none reverse'}
        }
      );
      gsap.fromTo(media,
        {opacity:0, y:42, scale:0.96},
        {
          opacity:1, y:0, scale:1, duration:1.05, ease:'power3.out',
          scrollTrigger:{trigger:scene, start:'top 72%', toggleActions:'play none none reverse'}
        }
      );
      gsap.to(media, {
        yPercent: index === 4 ? -4 : -8,
        ease:'none',
        scrollTrigger:{trigger:scene, start:'top bottom', end:'bottom top', scrub:1}
      });
    });

    gsap.fromTo('.atlas-card',
      {opacity:0, y:24},
      {
        opacity:1, y:0, duration:0.65, stagger:0.07, ease:'power2.out',
        scrollTrigger:{trigger:'.feature-atlas', start:'top 78%', toggleActions:'play none none reverse'}
      }
    );
  })();
</script>
```

- [ ] **Step 5: Run the verification script and confirm the motion hooks pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
PASS features story structure markers found
```

- [ ] **Step 6: Commit the motion layer**

```bash
git add features/index.html scripts/verify-features-storytelling.ps1
git commit -m "feat: animate features story scenes with gsap"
```

### Task 5: Preserve Pricing Continuity, Tune Mobile, and Finish QA

**Files:**
- Modify: `features/index.html` (pricing spacing/theme continuity, final copy polish)
- Modify: `scripts/verify-features-storytelling.ps1`
- Test: `scripts/verify-features-storytelling.ps1`

- [ ] **Step 1: Extend the verification script to assert the pricing viewer and footer carry-over**

Add these checks to `scripts/verify-features-storytelling.ps1` after the scene count assertion:

```powershell
$pricingCardCount = ([regex]::Matches($html, 'data-plan-view')).Count
if ($pricingCardCount -ne 1) {
  Write-Error "PRICING_CARD_COUNT_FAIL expected=1 actual=$pricingCardCount"
  exit 1
}

$atlasCardCount = ([regex]::Matches($html, 'class="atlas-card"')).Count
if ($atlasCardCount -lt 5) {
  Write-Error "ATLAS_CARD_COUNT_FAIL expected>=5 actual=$atlasCardCount"
  exit 1
}

if ($html -notmatch [regex]::Escape('Save 37% yearly')) {
  Write-Error "DISCOUNT_CHIP_FAIL"
  exit 1
}
```

- [ ] **Step 2: Run the verification script and make sure the final static structure passes**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-features-storytelling.ps1
```

Expected:

```text
PASS features story structure markers found
```

- [ ] **Step 3: Smoke-test the live page routes**

Run:

```powershell
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4174/features/).StatusCode
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4174/).StatusCode
```

Expected:

```text
200
200
```

- [ ] **Step 4: Do browser QA for readability, story order, and motion**

Manual checklist in Chrome:

```text
Desktop 1440x1200
- Hero reads as a thesis, not a generic features intro
- There are exactly five primary scenes before the atlas
- Style DNA is the last major scene
- Pricing viewer still appears as a single-card toggle section below the atlas

Tablet 1024x1366
- Scene media remains readable without clipping
- Copy and phone mockups do not collapse into cramped side-by-side layouts

Mobile 390x844
- Scenes stack cleanly
- Device visuals remain large enough to read
- Atlas cards become single-column
- Pricing chip still sits left of the toggle and disappears on monthly

Motion
- Hero reveals once, smoothly
- Each scene has noticeable entrance motion
- Scene media has restrained parallax on scroll
- Style DNA feels slower and calmer than earlier scenes
```

- [ ] **Step 5: Commit the finished page**

```bash
git add features/index.html scripts/verify-features-storytelling.ps1
git commit -m "feat: rebuild features page as cinematic story"
```
