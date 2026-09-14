// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: for a user site (saramousavi.github.io) `base` stays '/'.
// For a project site (…github.io/sara) set base: '/sara'.
export default defineConfig({
  site: 'https://saramousavi.github.io',
  base: '/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
