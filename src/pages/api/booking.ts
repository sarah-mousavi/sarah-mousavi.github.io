import type { APIRoute } from 'astro';
import { createBooking } from '../../server/booking';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let input: Record<string, string> = {};

  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    input = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    input = Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
  }

  const result = await createBooking(input);

  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, errors: result.errors }), {
      status: 422,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: result.id }), {
    status: 201,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
