import type { APIRoute } from 'astro';
import { requestLoginCode } from '../../../server/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { phone } = await request.json().catch(() => ({ phone: '' }));
  const result = await requestLoginCode(String(phone ?? ''));
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 422,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
