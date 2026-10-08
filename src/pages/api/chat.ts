import type { APIRoute } from 'astro';
import { handleMessage } from '../../server/chat';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { message, conversationId } = await request.json().catch(() => ({}));
  const text = String(message ?? '').trim();

  if (!text) {
    return new Response(JSON.stringify({ ok: false, error: 'پیام خالی است.' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const result = await handleMessage(conversationId, text);
  return new Response(JSON.stringify({ ok: true, ...result }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
