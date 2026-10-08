import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { APIContext } from 'astro';
import { db, schema } from './db';
import { sendSms } from './sms';
import { normalizePhone } from './phone';

const CODE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
export const SESSION_COOKIE = 'delasa_session';

const hash = (value: string) =>
  createHash('sha256').update(`${value}:${process.env.SESSION_SECRET ?? ''}`).digest('hex');

/* ── requesting a code ──────────────────────────────────────────── */

export async function requestLoginCode(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false as const, error: 'شمارهٔ موبایل معتبر نیست.' };

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({ createdAt: schema.loginCodes.createdAt })
    .from(schema.loginCodes)
    .where(and(eq(schema.loginCodes.phone, phone), gt(schema.loginCodes.createdAt, hourAgo)))
    .orderBy(desc(schema.loginCodes.createdAt));

  if (recent.length >= MAX_CODES_PER_HOUR)
    return { ok: false as const, error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.' };

  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS)
    return { ok: false as const, error: 'کد قبلی هنوز معتبر است. یک دقیقه صبر کنید.' };

  /* 5 digits, never logged in clear anywhere but the SMS itself */
  const code = String(randomBytes(4).readUInt32BE(0) % 100000).padStart(5, '0');

  await db.insert(schema.loginCodes).values({
    phone,
    codeHash: hash(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  await sendSms(phone, `کد ورود شما به دل‌آسا: ${code}\nاین کد تا ۵ دقیقه معتبر است.`, {
    kind: 'login-code',
  });

  return { ok: true as const, phone };
}

/* ── verifying ──────────────────────────────────────────────────── */

export async function verifyLoginCode(rawPhone: string, code: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false as const, error: 'شمارهٔ موبایل معتبر نیست.' };

  const row = await db.query.loginCodes.findFirst({
    where: and(
      eq(schema.loginCodes.phone, phone),
      isNull(schema.loginCodes.consumedAt),
      gt(schema.loginCodes.expiresAt, new Date())
    ),
    orderBy: desc(schema.loginCodes.createdAt),
  });

  if (!row) return { ok: false as const, error: 'کدی برای این شماره فعال نیست. دوباره درخواست کنید.' };
  if (row.attempts >= MAX_ATTEMPTS)
    return { ok: false as const, error: 'تعداد تلاش‌ها زیاد است. کد تازه بگیرید.' };

  const given = Buffer.from(hash(code.trim()));
  const expected = Buffer.from(row.codeHash);
  const match = given.length === expected.length && timingSafeEqual(given, expected);

  if (!match) {
    await db
      .update(schema.loginCodes)
      .set({ attempts: sql`${schema.loginCodes.attempts} + 1` })
      .where(eq(schema.loginCodes.id, row.id));
    return { ok: false as const, error: 'کد وارد‌شده درست نیست.' };
  }

  await db
    .update(schema.loginCodes)
    .set({ consumedAt: new Date() })
    .where(eq(schema.loginCodes.id, row.id));

  let user = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
  if (!user) {
    /* carry over the name they already gave when booking, if any */
    const booking = await db.query.bookingRequests.findFirst({
      where: eq(schema.bookingRequests.phone, phone),
      orderBy: desc(schema.bookingRequests.createdAt),
    });
    [user] = await db
      .insert(schema.users)
      .values({
        phone,
        name: booking?.name ?? null,
        education: booking?.education ?? null,
        occupation: booking?.occupation ?? null,
      })
      .returning();
  }

  const sessionId = randomBytes(32).toString('hex');
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return { ok: true as const, sessionId, user };
}

/* ── session plumbing ───────────────────────────────────────────── */

export function setSessionCookie(ctx: APIContext, sessionId: string) {
  ctx.cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(ctx: APIContext) {
  const id = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (id) await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function getUser(ctx: { cookies: APIContext['cookies'] }) {
  const id = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const row = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, id),
    with: { },
  });
  if (!row || row.expiresAt < new Date()) return null;

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, row.userId) });
  return user ?? null;
}
