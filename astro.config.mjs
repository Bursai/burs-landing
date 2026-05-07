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
