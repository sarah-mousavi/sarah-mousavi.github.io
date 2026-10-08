import { randomUUID } from 'node:crypto';
import { db, schema } from './db';
import { services, process as steps, clinic } from '../data/clinic';

/* A deliberately narrow bot. It triages, answers practical questions and
   helps people book. It does not do therapy, does not interpret symptoms,
   and hands anything resembling crisis straight to emergency numbers. */

const CRISIS = [
  'خودکشی', 'خودکُشی', 'بمیرم', 'مرگ خودم', 'تمومش کنم', 'به خودم آسیب',
  'خودزنی', 'رگ', 'قرص خوردم', 'نمیخوام زنده', 'نمی‌خوام زنده', 'بکشم خودم',
  'کشتن خودم', 'جون خودم',
];

const CRISIS_REPLY =
  'چیزی که نوشتی نگرانم کرد و نمی‌خواهم با یک ربات تنها بمانی.\n\n' +
  'اگر همین حالا در خطر آسیب به خودت هستی، لطفاً فوری تماس بگیر:\n' +
  '• اورژانس اجتماعی — ۱۲۳\n' +
  '• اورژانس — ۱۱۵\n\n' +
  `اگر در خطر فوری نیستی ولی حالت بد است، با پذیرش دل‌آسا تماس بگیر: ${clinic.phone.display} (${clinic.hoursShort}).`;

interface Rule {
  id: string;
  match: RegExp;
  reply: () => string;
}

const serviceList = () => services.map((s) => `• ${s.title} — ${s.short}`).join('\n');

const RULES: Rule[] = [
  {
    id: 'therapy-advice',
    match: /چیکار کنم|چه کار کنم|نظرت چیه|نظرت چیست|راهنمایی|توصیه|مشاوره بده/,
    reply: () =>
      'من یک ربات راهنمای پذیرش هستم و نمی‌توانم مشاوره بدهم — این کار درمانگر است، ' +
      'و درست هم همین است.\nآنچه می‌توانم: کمک به انتخاب خدمت مناسب و رزرو وقت. ' +
      'می‌خواهی وقت ارزیابی بگیری؟',
  },
  {
    id: 'hours',
    match: /ساعت|کِی باز|کی باز|تعطیل|چه ساعت|وقت کاری/,
    reply: () => `کلینیک ${clinic.hours} باز است. برای رزرو می‌توانی همین حالا فرم را پر کنی: /booking`,
  },
  {
    id: 'address',
    match: /کجا|آدرس|نشانی|موقعیت/,
    reply: () => `${clinic.address}\nبرای مسیر دقیق با پذیرش تماس بگیر: ${clinic.phone.display}`,
  },
  {
    id: 'price',
    match: /هزینه|قیمت|تعرفه|چقدر میشه|چند/,
    reply: () =>
      'تعرفهٔ جلسات را پذیرش اعلام می‌کند، چون به نوع جلسه و درمانگر بستگی دارد. ' +
      `با ${clinic.phone.display} تماس بگیر یا در واتس‌اپ بپرس.`,
  },
  {
    id: 'process',
    match: /چطور شروع|مراحل|پذیرش|اولین جلسه|ارزیابی چیست|روند/,
    reply: () =>
      'مسیر کار پنج مرحله است:\n' +
      steps.map((s) => `${s.num}. ${s.title} — ${s.body}`).join('\n') +
      '\n\nتوضیح کامل: /process',
  },
  {
    id: 'online',
    match: /آنلاین|اینترنتی|غیرحضوری|از راه دور|شهرستان/,
    reply: () =>
      'بله، جلسات آنلاین هم برگزار می‌شود. ساختار کار تا حد زیادی مشابه جلسهٔ حضوری است و ' +
      'در جلسهٔ ارزیابی با هم مشخص می‌کنیم کدام برای تو مناسب‌تر است.',
  },
  {
    id: 'services',
    match: /خدمات|چه خدمات|درمان‌ها|تخصص‌ها/,
    reply: () => `خدمات دل‌آسا:\n${serviceList()}\n\nجزئیات هر کدام: /services`,
  },
  {
    id: 'couples',
    match: /همسر|زوج|رابطه‌?ام|دعوا|طلاق|نامزد|ازدواج/,
    reply: () =>
      'به نظر می‌رسد موضوع به رابطه مربوط است. زوج‌درمانی دل‌آسا دقیقاً برای همین است: ' +
      '/services/couples\nبرای شروع، یک جلسهٔ ارزیابی لازم است: /booking',
  },
  {
    id: 'child',
    match: /بچه|فرزند|کودک|نوجوان|مدرسه|پسرم|دخترم/,
    reply: () =>
      'برای کودک و نوجوان، کار با خود بچه همراه با جلسات والدین پیش می‌رود: ' +
      '/services/child-adolescent\nجلسهٔ اول معمولاً فقط با والدین است.',
  },
  {
    id: 'anxiety',
    match: /اضطراب|استرس|پانیک|وسواس|ترس|تپش قلب/,
    reply: () =>
      'اضطراب یکی از رایج‌ترین دلایل مراجعه است و در روان‌درمانی فردی روی آن کار می‌شود: ' +
      '/services/individual\nبرای شروع یک جلسهٔ ارزیابی رزرو کن: /booking',
  },
  {
    id: 'depression',
    match: /افسرد|بی‌انگیز|بی انگیز|حوصله|غمگین|ناامید/,
    reply: () =>
      'این‌ها را در جلسات فردی بررسی می‌کنیم: /services/individual\n' +
      'اولین قدم یک جلسهٔ ارزیابی است تا روشن شود دقیقاً با چه چیزی روبه‌روییم.',
  },
  {
    id: 'sex',
    match: /جنسی|سکس|میل|نزدیکی|زناشویی/,
    reply: () =>
      'سکس‌تراپی یک روان‌درمانی تخصصی و کاملاً گفت‌وگومحور است؛ هیچ معاینه یا تماس فیزیکی در کار نیست: ' +
      '/services/sex-therapy',
  },
  {
    id: 'test',
    match: /تست|آزمون|MMPI|نئو|NEO|یونگ|شخصیت/i,
    reply: () =>
      'آزمون‌ها بخشی از مرحلهٔ ارزیابی‌اند و در کلینیک زیر نظر متخصص اجرا و تفسیر می‌شوند، ' +
      'نه به‌صورت آنلاین: /services/tests',
  },
  {
    id: 'booking',
    match: /نوبت|رزرو|وقت بگیرم|وقت میخوام|قرار/,
    reply: () =>
      `برای رزرو وقت ارزیابی فرم را پر کن: /booking\nیا با پذیرش تماس بگیر: ${clinic.phone.display} (${clinic.hours}).`,
  },
];

const FALLBACK =
  'مطمئن نیستم درست متوجه شدم. می‌توانم دربارهٔ این‌ها کمک کنم:\n' +
  '• خدمات و اینکه کدام مناسب توست\n• مراحل پذیرش\n• ساعت کار و نشانی\n• رزرو وقت\n\n' +
  `اگر سؤالت چیز دیگری است، پذیرش ${clinic.hoursShort} پاسخگوست: ${clinic.phone.display}`;

export const GREETING =
  'سلام 👋 من راهنمای پذیرش دل‌آسا هستم.\n' +
  'می‌توانم کمک کنم بفهمی کدام خدمت مناسب توست و چطور وقت بگیری.\n\n' +
  'توجه: این گفت‌وگو درمان نیست و محرمانه‌بودن جلسهٔ درمان را ندارد.';

export function isCrisis(text: string) {
  const t = text.replace(/‌/g, ' ');
  return CRISIS.some((w) => t.includes(w.replace(/‌/g, ' ')));
}

export function replyTo(text: string) {
  if (isCrisis(text)) return { body: CRISIS_REPLY, flagged: true };
  const rule = RULES.find((r) => r.match.test(text));
  return { body: rule ? rule.reply() : FALLBACK, flagged: false };
}

export async function handleMessage(conversationId: string | undefined, text: string) {
  const id = conversationId && /^[a-f0-9-]{36}$/.test(conversationId) ? conversationId : randomUUID();
  const trimmed = text.trim().slice(0, 1000);
  const { body, flagged } = replyTo(trimmed);

  try {
    await db.insert(schema.chatMessages).values([
      { conversationId: id, role: 'user', body: trimmed, flagged },
      { conversationId: id, role: 'bot', body, flagged },
    ]);
  } catch (err) {
    console.error('[chat] could not log transcript', err);
  }

  return { conversationId: id, reply: body, crisis: flagged };
}
