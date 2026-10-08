import { db, schema } from '../db';

export interface SmsResult {
  status: 'sent' | 'failed' | 'skipped';
  provider: string;
  error?: string;
  meta?: unknown;
}

interface Provider {
  name: string;
  send(to: string, body: string): Promise<SmsResult>;
}

/* ── dev: never sends, always logs ──────────────────────────────── */

const consoleProvider: Provider = {
  name: 'console',
  async send(to, body) {
    console.log(`[sms:console] → ${to}\n${body}`);
    return { status: 'skipped', provider: 'console' };
  },
};

/* ── Kavenegar (kavenegar.com) ──────────────────────────────────── */

const kavenegar: Provider = {
  name: 'kavenegar',
  async send(to, body) {
    const key = process.env.SMS_API_KEY;
    if (!key) return { status: 'failed', provider: 'kavenegar', error: 'SMS_API_KEY missing' };

    const url = `https://api.kavenegar.com/v1/${key}/sms/send.json`;
    const params = new URLSearchParams({ receptor: to, message: body });
    if (process.env.SMS_SENDER) params.set('sender', process.env.SMS_SENDER);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      const json: any = await res.json().catch(() => null);
      const ok = res.ok && json?.return?.status === 200;
      return ok
        ? { status: 'sent', provider: 'kavenegar', meta: json?.entries?.[0] }
        : { status: 'failed', provider: 'kavenegar', error: json?.return?.message ?? `HTTP ${res.status}` };
    } catch (err) {
      return { status: 'failed', provider: 'kavenegar', error: String(err) };
    }
  },
};

/* ── SMS.ir ─────────────────────────────────────────────────────── */

const smsir: Provider = {
  name: 'smsir',
  async send(to, body) {
    const key = process.env.SMS_API_KEY;
    if (!key) return { status: 'failed', provider: 'smsir', error: 'SMS_API_KEY missing' };

    try {
      const res = await fetch('https://api.sms.ir/v1/send/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({
          lineNumber: process.env.SMS_SENDER,
          messageText: body,
          mobiles: [to],
        }),
      });
      const json: any = await res.json().catch(() => null);
      const ok = res.ok && (json?.status === 1 || json?.status === 200);
      return ok
        ? { status: 'sent', provider: 'smsir', meta: json?.data }
        : { status: 'failed', provider: 'smsir', error: json?.message ?? `HTTP ${res.status}` };
    } catch (err) {
      return { status: 'failed', provider: 'smsir', error: String(err) };
    }
  },
};

const providers: Record<string, Provider> = {
  console: consoleProvider,
  kavenegar,
  smsir,
};

function current(): Provider {
  return providers[process.env.SMS_PROVIDER ?? 'console'] ?? consoleProvider;
}

/* Every outbound message is written to message_log, sent or not, so a
   silent gateway failure is visible instead of losing a booking. */
export async function sendSms(to: string, body: string, meta?: Record<string, unknown>) {
  const provider = current();
  let result: SmsResult;
  try {
    result = await provider.send(to, body);
  } catch (err) {
    result = { status: 'failed', provider: provider.name, error: String(err) };
  }

  try {
    await db.insert(schema.messageLog).values({
      to,
      body,
      provider: result.provider,
      status: result.status,
      error: result.error ?? null,
      meta: { ...(meta ?? {}), providerMeta: result.meta ?? null },
    });
  } catch (err) {
    console.error('[sms] could not write message_log', err);
  }

  return result;
}
