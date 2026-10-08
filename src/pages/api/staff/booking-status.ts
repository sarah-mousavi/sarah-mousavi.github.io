import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../server/db';

export const prerender = false;

const ALLOWED = new Set(['new', 'contacted', 'scheduled', 'closed']);

export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user;
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return new Response('forbidden', { status: 403 });
  }

  const form = await ctx.request.formData();
  const id = Number(form.get('id'));
  const status = String(form.get('status') ?? '');

  if (!Number.isInteger(id) || !ALLOWED.has(status)) {
    return new Response('bad request', { status: 400 });
  }

  await db.update(schema.bookingRequests).set({ status }).where(eq(schema.bookingRequests.id, id));
  return ctx.redirect(ctx.request.headers.get('referer') ?? '/staff', 303);
};
