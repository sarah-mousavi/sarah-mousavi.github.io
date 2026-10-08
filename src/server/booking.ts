import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import { sendSms } from './sms';
import { normalizePhone, displayPhone } from './phone';
import { services } from '../data/clinic';

export interface BookingInput {
  name?: string;
  phone?: string;
  education?: string;
  occupation?: string;
  service?: string;
  mode?: string;
  preferredDays?: string;
  preferredTime?: string;
  message?: string;
  /* honeypot — real people never fill this */
  website?: string;
}

export type FieldErrors = Partial<Record<keyof BookingInput | 'form', string>>;

const MODES = new Set(['in-person', 'online']);
const clean = (v?: string, max = 500) => (v ?? '').trim().slice(0, max) || null;

export function validate(input: BookingInput) {
  const errors: FieldErrors = {};

  const name = (input.name ?? '').trim();
  if (name.length < 3) errors.name = 'لطفاً نام و نام خانوادگی را کامل بنویسید.';

  const phone = normalizePhone(input.phone ?? '');
  if (!phone) errors.phone = 'شمارهٔ موبایل معتبر نیست.';

  const service = (input.service ?? '').trim();
  const known = services.some((s) => s.slug === service) || service === 'unsure';
  if (!known) errors.service = 'لطفاً نوع خدمت را انتخاب کنید.';

  const mode = (input.mode ?? 'in-person').trim();
  if (!MODES.has(mode)) errors.mode = 'نحوهٔ برگزاری معتبر نیست.';

  return { errors, name, phone, service, mode };
}

export async function createBooking(input: BookingInput) {
  if (input.website) return { ok: true as const, id: -1, spam: true };

  const { errors, name, phone, service, mode } = validate(input);
  if (Object.keys(errors).length) return { ok: false as const, errors };

  /* Attach to an existing client record when the phone is already known,
     so reception sees history instead of a duplicate stranger. */
  const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, phone!) });

  const [row] = await db
    .insert(schema.bookingRequests)
    .values({
      userId: existing?.id ?? null,
      name,
      phone: phone!,
      education: clean(input.education, 120),
      occupation: clean(input.occupation, 120),
      service,
      mode,
      preferredDays: clean(input.preferredDays, 160),
      preferredTime: clean(input.preferredTime, 160),
      message: clean(input.message, 2000),
    })
    .returning({ id: schema.bookingRequests.id });

  const label = services.find((s) => s.slug === service)?.title ?? 'نامشخص';
  const when = [input.preferredDays, input.preferredTime].filter(Boolean).join(' — ') || 'اعلام نشده';

  /* Reception is told; the client is reassured. Neither blocks the response. */
  const reception = process.env.RECEPTION_PHONE;
  const notify: Promise<unknown>[] = [];

  if (reception) {
    notify.push(
      sendSms(
        reception,
        `درخواست جدید رزرو — دل‌آسا\n` +
          `نام: ${name}\n` +
          `تماس: ${displayPhone(phone!)}\n` +
          `خدمت: ${label}\n` +
          `نحوه: ${mode === 'online' ? 'آنلاین' : 'حضوری'}\n` +
          `زمان پیشنهادی: ${when}`,
        { kind: 'booking-reception', bookingId: row.id }
      )
    );
  }

  notify.push(
    sendSms(
      phone!,
      `${name} عزیز، درخواست شما در کلینیک دل‌آسا ثبت شد. ` +
        `پذیرش برای هماهنگی زمان جلسهٔ ارزیابی با شما تماس می‌گیرد.`,
      { kind: 'booking-client', bookingId: row.id }
    )
  );

  await Promise.allSettled(notify);
  return { ok: true as const, id: row.id };
}
