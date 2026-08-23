// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.burs.me',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto'
  },
  integrations: [
    mdx(),
    sitemap({
      // `/juicebox/` is a private creator dashboard — it carries noindex, but
      // listing it in the sitemap would be actively inviting a crawl of the
      // one URL we do not want discovered.
      filter: (page) => !page.includes('/draft/') && !page.includes('/juicebox/')
    })
  ],
  vite: {
    server: { fs: { strict: false } }
  }
});
