// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

/* One switch decides where this deploys. Nothing else in the codebase knows
   or cares — moving to a VPS is `DEPLOY_TARGET=node` plus a DATABASE_URL. */
const target = process.env.DEPLOY_TARGET ?? 'node';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://sarah-mousavi.github.io',
  output: 'static',
  adapter: target === 'vercel' ? vercel() : node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
