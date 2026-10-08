import type { APIRoute } from 'astro';
import { destroySession } from '../../../server/auth';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  await destroySession(ctx);
  return ctx.redirect('/', 303);
};
