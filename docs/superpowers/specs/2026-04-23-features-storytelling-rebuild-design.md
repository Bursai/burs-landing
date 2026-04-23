# BURS Features Page Storytelling Rebuild Design

Date: 2026-04-23
Status: Proposed
Page: `/features`

## Objective

Rebuild the BURS features page from a static alternating feature list into a cinematic storytelling page that feels premium, readable, and product-led.

The page should explain how BURS turns an underused wardrobe into a usable daily system. It should keep the existing feature set, but present only five major features as full storytelling scenes and move the rest into a supporting feature atlas.

## Constraints

- Use the existing repo stack and existing motion language.
- Reuse the brand system already established on the landing page:
  - Editorial Cream `#F5F0E8`
  - Deep Charcoal `#1C1917`
  - Warm Gold `#C9A86C`
  - Playfair Display italic for headings
  - DM Sans for UI and body copy
- Keep the page static. No backend, auth, Supabase, or query work.
- Preserve the premium floating nav behavior and current pricing viewer concept already being built for the site.
- Reuse existing GSAP / ScrollTrigger approach already present on the homepage rather than introducing a new animation library.

## Approved Direction

The user selected:

- Page mode: hybrid storytelling direction narrowed to a cinematic scene sequence for `/features`
- Story thesis: `Closet to confidence`
- Density: `5 major chapters + supporting feature atlas`
- Structure style: `cinematic scene sequence`
- Style DNA placement: `late full chapter`
- Chapter visual mode: `full-bleed editorial bands with one phone per chapter`

## Narrative Thesis

The page should feel like a sequence of editorial product scenes rather than a documentation grid.

The core message is:

`A wardrobe is only useful when it becomes usable.`

BURS is presented as the system that makes an existing closet legible, useful, and presentable over time.

## Page Structure

### 1. Hero

Purpose:
- establish the thesis of the page
- set tone before the feature story begins

Content:
- eyebrow: `Features`
- H1 built around the idea that a wardrobe becomes valuable when it becomes usable
- one short supporting sentence

Visual treatment:
- editorial hero, not a generic SaaS feature header
- large typography, restrained copy
- dominant product visual anchor

Motion:
- soft entrance on headline and supporting line
- subtle depth shift in the background plane

### 2. Scene I: Live Garment Scan

Purpose:
- show the first unlock: BURS makes the closet legible

Story message:
- point your camera at one garment
- BURS reads the garment live in under 2 seconds
- no manual tagging, spreadsheets, or admin work

Feature points:
- live garment scan in under 2 seconds
- computer vision reads core garment traits
- no manual organization workflow

Visual treatment:
- full-bleed editorial band
- one dominant phone mockup
- supporting labels should feel like product cues, not floating marketing badges

### 3. Scene II: Outfit of the Day

Purpose:
- show the first daily payoff after scanning

Story message:
- BURS reads weather, calendar, and context and returns one confident look
- the emotional tone is calm morning clarity

Feature points:
- weather-aware
- calendar-aware
- one clear answer instead of browsing a feed

Visual treatment:
- morning-oriented scene
- softer visual temperature than Scene I
- one large phone mockup and minimal supporting data points

Asset note:
- if no approved real screenshot exists for this feature at implementation time, use a polished in-product still built from the current BURS UI language as a temporary scene visual until the real screen is supplied

### 4. Scene III: AI Stylist Chat

Purpose:
- show refinement, taste, and conversational adjustment

Story message:
- BURS is not just selecting outfits; it is refining them with you
- this is where the product feels more personal

Feature points:
- conversational refinement
- swap pieces without starting over
- ask anything against your real wardrobe

Visual treatment:
- sharper contrast than Scene II
- one dominant device frame plus a small amount of supporting conversational UI language

### 5. Scene IV: Week Planner / Calendar Sync

Purpose:
- expand from one-day clarity to weekly calm

Story message:
- BURS plans across the week, not just the next outfit
- calendar data becomes a dressed plan instead of admin friction

Feature points:
- Google Calendar + ICS
- seven-day planning
- event-aware wardrobe planning

Visual treatment:
- structured chapter
- clearer grid rhythm and planning cues
- still full-bleed and editorial, but more ordered than previous scenes

### 6. Scene V: Style DNA

Purpose:
- present compounding intelligence as something earned over time

Critical framing:
- Style DNA must not feel instant
- it should explicitly be described as emerging after a few days of use, scans, outfit choices, saves, and refinements

Story message:
- after several days of use, BURS starts understanding fit, taste, silhouette preference, and outfit patterns well enough to become genuinely presentable

Feature points:
- personal style fingerprint
- built from scan + behavior + feedback over time
- improves the quality of future suggestions

Visual treatment:
- slower, more deliberate chapter than the others
- should feel like arrival, not onboarding
- elegant, quiet scene with the strongest sense of trust and polish

## Supporting Feature Atlas

After the five full scenes, the rest of the feature set moves into a calmer atlas section.

Purpose:
- preserve feature coverage without exhausting the reader
- avoid making every feature a full cinematic chapter

Features included here:
- Travel Capsule
- Wardrobe Gaps
- Mood Outfit
- Ghost Mannequin
- Wardrobe Insights & Analytics

Atlas treatment:
- heading such as `More ways BURS works for you`
- tighter modules with short copy
- one clear takeaway per module
- visual modules should feel related to the main story but smaller in scale and lower in motion intensity

The atlas must not feel like leftovers. It should read as supporting depth after the main narrative.

## Final Conversion Section

The pricing viewer stays near the bottom of the page.

Requirements:
- reuse the one-card pricing viewer concept already in progress
- yearly-first toggle remains the default
- discount chip behavior remains consistent with the homepage treatment
- this section should feel quieter than the five scenes so the page resolves cleanly into conversion

## Visual System

### Composition

- full-bleed editorial bands
- one dominant visual idea per section
- no generic alternating left/right feature block template
- no dashboard card mosaic
- no decorative clutter

### Surfaces and Color

- cream and stone-based section planes
- deep charcoal for typography and anchoring contrast
- warm gold used sparingly for emphasis, active states, and select dividers

### Typography

- Playfair Display italic for chapter headlines and high-emphasis statements
- DM Sans for all utility copy, labels, bullets, and navigation

### Devices and Supporting UI

- each major chapter gets one large readable phone mockup
- supporting information appears as restrained micro-labels or cues
- avoid turning scenes into UI collages

## Motion System

Motion should make the page feel cinematic, not busy.

### Core principles

- use 2-3 strong motion ideas consistently instead of many small unrelated effects
- preserve the site-wide motion language already present on the homepage
- prefer scroll-linked reveals and depth over constant looping ornament

### Hero motion

- subtle reveal of headline and support copy
- light background depth drift

### Chapter motion

- text fades and rises into place
- phone enters with restrained depth and lift
- chapter transitions use tonal and positional change so each section feels distinct

### Style DNA motion

- slower reveal than the earlier chapters
- should communicate earned trust rather than speed

### Atlas motion

- lighter reveal behavior
- not as theatrical as the main five scenes

### Reduced motion

- all core content must remain understandable with motion reduced
- animations collapse to direct visibility and low-motion transitions

## Responsive Behavior

### Desktop

- full cinematic bands
- large readable phone mockups
- stronger spacing and scene separation

### Tablet

- preserve full-scene feeling
- reduce secondary floating detail before shrinking primary phone visuals
- maintain strong reading size for the phone screens

### Mobile

- scenes stack cleanly
- each chapter still gets a large primary device visual
- remove non-essential floating accents before shrinking core story elements
- hero, scenes, atlas, and pricing should remain readable without pinch-zooming

## Content Mapping

### Full story chapters

1. Live Garment Scan
2. Outfit of the Day
3. AI Stylist Chat
4. Week Planner / Calendar Sync
5. Style DNA

### Supporting atlas

- Travel Capsule
- Wardrobe Gaps
- Mood Outfit
- Ghost Mannequin
- Wardrobe Insights & Analytics

## Asset Strategy

Use the existing real BURS screenshots where they already exist and fit the selected chapter flow.

Planned mapping:
- Live Garment Scan: wardrobe screen
- AI Stylist Chat: stylist screen
- Week Planner / Calendar Sync: week planner screen
- Style DNA: Style DNA screen

Outfit of the Day:
- use a current approved real screenshot if available during implementation
- otherwise create a refined temporary in-product still that matches the rest of the UI system until the final real screen is supplied

Supporting atlas visuals:
- can use smaller derived product stills, branded app-style visuals, or approved screenshots depending on availability
- should remain visually quieter than the five primary scenes

## Acceptance Criteria

The redesign is successful when:

- `/features` no longer reads as an alternating list of feature blocks
- the page clearly tells a `closet to confidence` story
- there are exactly five major cinematic feature scenes
- Style DNA is explicitly framed as something learned after days of usage, not instantly
- the remaining features are preserved in a supporting atlas below the main story
- the page feels visually aligned with the homepage but is not a copy of it
- motion is noticeable and premium without breaking readability or mobile performance
- the bottom pricing section remains consistent with the site pricing system

## Out of Scope

- backend changes
- auth changes
- Supabase changes
- new CMS or dynamic data work
- rewriting the global brand system
- rebuilding blog or homepage sections as part of this page-specific spec
