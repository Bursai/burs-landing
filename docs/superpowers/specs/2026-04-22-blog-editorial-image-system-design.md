# Blog Editorial Image System Design

Date: 2026-04-22
Project: BURS landing and blog
Scope: Replace placeholder blog visuals with generated editorial imagery for all six live blog posts

## Goal

Create a premium editorial image system for the BURS blog that matches the current site design and gives every post two real assets:

- one wide hero image for the article page
- one tighter card image for the blog index

The images should feel like one coherent visual world while still reflecting the specific subject of each article.

## Current Context

The live blog currently contains six posts:

1. `smarter-wardrobe`
2. `ai-styling`
3. `capsule-wardrobe`
4. `wear-more-buy-less`
5. `outfit-planning`
6. `style-feedback`

Current state:

- the blog index uses generic cream-and-gold placeholder thumbnails
- each article page uses a styled `.article-visual` block instead of a real image
- article OG and Twitter images still point to the BURS logo instead of post-specific assets

## Chosen Direction

Use a single editorial fashion still-life system with selective human presence depending on the post.

This means:

- the base language is still-life composition
- some posts may include hands, torso crops, or partial model presence if the story benefits from it
- full-body model shots are not the default
- every image should feel quiet, expensive, restrained, and useful to the editorial subject

## Visual Thesis

Soft daylight editorial fashion photography built around cream surfaces, charcoal wardrobe anchors, tactile fabrics, and restrained warm gold accents. The imagery should feel like a premium magazine still-life rather than stock content, ad creative, or generic lifestyle photography.

## Content Plan

- blog index cards: sharp, tighter crops with immediate visual identity
- article heroes: wider, slower compositions with more breathing room
- each post gets one clear image concept, expressed as two crops rather than two unrelated scenes

## Interaction Thesis

The images do not add new interface behavior. Their job is to make the blog feel authored, luxurious, and intentional without competing with existing page motion.

## Hard Visual Rules

- Stay within the BURS tonal world: editorial cream, deep charcoal, restrained warm gold
- Avoid loud color accents, purple lighting, neon palettes, glossy tech visuals, and overt ad styling
- Prefer real wardrobe objects, fabric texture, paper, mirrors, hangers, rails, suitcases, planners, and soft shadows
- Human presence is allowed only when it improves the story
- No embedded UI mockups inside the images
- No visible brand logos, watermarks, or text baked into the image
- No generic flat vector illustration style

## Asset System

Each of the six posts gets two assets:

- hero image: `1600x900`
- card image: `900x1200`

Output format:

- `.jpg` for photographic/editorial assets

Output location:

- `assets/blog/`

File naming:

- `assets/blog/<slug>-hero.jpg`
- `assets/blog/<slug>-card.jpg`

Examples:

- `assets/blog/smarter-wardrobe-hero.jpg`
- `assets/blog/smarter-wardrobe-card.jpg`

## Per-Post Art Direction

### 1. Smarter Wardrobe

Article: `How to build a smarter wardrobe`

Story:
Turn a closet into a clearer system.

Visual direction:

- edited wardrobe essentials arranged with visible structure
- rail, folded stack, tags, notebook, or modular grouping
- still-life first, no model required

Hero image:

- wider composition with wardrobe pieces grouped into a calm system
- sense of order, visibility, and useful restraint

Card image:

- tighter crop focusing on a few key garments and a planning object

### 2. AI Styling

Article: `What AI styling gets right`

Story:
AI works best when it starts from constraints and context.

Visual direction:

- wardrobe objects, printed references, styling notes, or image cards laid out with analytical precision
- optional subtle hand presence moving or selecting one item

Hero image:

- broader editorial desk or styling-table composition
- intelligent but tactile, not futuristic

Card image:

- tighter crop of garment pairings, references, and decision cues

### 3. Capsule Wardrobe

Article: `The modern capsule wardrobe`

Story:
A capsule as a flexible outfit engine.

Visual direction:

- open suitcase, edited pieces, shoes, soft travel cues
- no airport cliches
- still-life only unless a torso crop helps

Hero image:

- wide travel-preparation composition with calm spacing

Card image:

- tighter crop on the best grouping of packed pieces

### 4. Wear More Buy Less

Article: `Wear more. Buy less.`

Story:
Longevity, repair, use, and better buying.

Visual direction:

- worn garments, mending tools, fabric texture, folded denim, repair materials
- tactile sustainability, not activist poster language

Hero image:

- wider composition showing care, repair, and continued use

Card image:

- tighter crop emphasizing texture, wear, and mending detail

### 5. Outfit Planning

Article: `Outfit planning without overthinking`

Story:
A calm weekly dressing routine built around real life.

Visual direction:

- planner or calendar cues with garments sequenced in an elegant editorial layout
- optional hand presence pointing, arranging, or pinning

Hero image:

- wide composition with weekly planning rhythm and wardrobe structure

Card image:

- tighter crop around one planned grouping and a scheduling cue

### 6. Style Feedback

Article: `Teaching your stylist what you like`

Story:
Feedback loops that train personal style memory.

Visual direction:

- two or three outfit alternatives with subtle comparison logic
- hands or torso crop are appropriate here if needed

Hero image:

- wide composition of alternatives and a clear refinement gesture

Card image:

- tighter crop on one decision point between looks

## Integration Design

Implementation will update the blog in four places:

1. Blog index cards
   - replace placeholder `.thumb` treatments with real card images

2. Article hero blocks
   - replace decorative `.article-visual` block styling with real hero imagery

3. Article metadata
   - update `og:image`, `og:image:alt`, `twitter:image`, and JSON-LD `image`

4. Accessibility copy
   - provide descriptive alt text per image that matches the article concept

## Accessibility Requirements

- Every inserted image must have descriptive alt text
- Card image alt text should identify the editorial subject succinctly
- Hero image alt text should describe the wardrobe scene in plain language
- No decorative image should carry misleading narrative content

## Quality Bar

An image is acceptable only if it:

- feels consistent with the landing page brand system
- reads clearly on a cream background
- avoids visual clutter at both hero and card scales
- supports the article subject without repeating the headline literally
- looks premium on both desktop and mobile crops

## Generation Workflow

1. Generate hero and card image prompts from the approved art direction
2. Produce assets for all six posts
3. Review for consistency as a set
4. Regenerate any weak outliers before integration
5. Integrate the final twelve assets into the blog pages

## Risks And Mitigations

### Risk: the set feels inconsistent

Mitigation:

- use one shared lighting and material language
- keep the same palette discipline across all posts

### Risk: the images look like stock lifestyle photography

Mitigation:

- prioritize composed still-life scenes over generic people imagery
- use human presence only where it is editorially justified

### Risk: card crops lose the subject

Mitigation:

- design the hero and card versions as distinct crops, not automatic resizes

### Risk: images overpower the blog typography

Mitigation:

- keep composition calm, avoid dominant dark masses or loud contrast spikes

## Out Of Scope

- adding new blog posts
- changing article copy
- redesigning the article layout beyond image integration
- adding animation tied specifically to the new images

## Recommendation

Proceed with one coherent editorial still-life image family for all six posts, with selective hands or body fragments only when the article concept benefits from them. This gives the blog a premium, authored identity while staying aligned with the quiet luxury tone already established on the BURS site.
