// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: for a user/org site (sarah-mousavi.github.io) `base` stays '/'.
// For a project site (…github.io/sara) set base: '/sara'.
export default defineConfig({
  site: 'https://sarah-mousavi.github.io',
  base: '/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
