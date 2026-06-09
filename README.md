# BURS — Landing

Marketing site for **BURS**, an AI wardrobe stylist. Built with [Astro 4](https://astro.build) and deployed on Vercel.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run check    # astro + type check
npm test         # unit tests (Vitest)
```

## Structure

- `src/pages` — routes (home, manifesto, method, pricing, press, faq, blog, …)
- `src/components` — UI components (`HeroVideo`, `HeroRack`, `ActsScroll`, `Nav`, …)
- `src/content/blog` — MDX blog posts
- `src/styles` — design tokens, typography, utilities
- `public/assets` — hero film poster, act screenshots, rack image

## Notes

- The home hero is a background film (`HeroVideo`); the editorial rack image (`HeroRack`) appears in the mid‑page reprise band.
- Production deploys run automatically from `main` via Vercel.
