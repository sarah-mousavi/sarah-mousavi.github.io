import type { APIRoute } from 'astro';
import { verifyLoginCode, setSessionCookie } from '../../../server/auth';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { phone, code } = await ctx.request.json().catch(() => ({}));
  const result = await verifyLoginCode(String(phone ?? ''), String(code ?? ''));

  if (!result.ok) {
    return new Response(JSON.stringify(result), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  setSessionCookie(ctx, result.sessionId);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
