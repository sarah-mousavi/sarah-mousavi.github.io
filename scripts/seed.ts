import 'dotenv/config';
import { db, schema } from '../src/server/db';

const items = [
  { slug: 'book-attached', title: 'تحلیل کتاب «دلبستگی»', kind: 'reading', summary: 'خلاصه و تحلیل کاربردی سبک‌های دلبستگی در رابطهٔ بزرگسالی.', minTier: 'bronze', url: '#' },
  { slug: 'video-anxiety-basics', title: 'اضطراب چطور در بدن کار می‌کند', kind: 'video', summary: 'ویدیو ۱۲ دقیقه‌ای دربارهٔ نشانه‌های بدنی اضطراب.', minTier: 'bronze', url: '#' },
  { slug: 'video-defenses', title: 'دفاع‌ها را بشناس', kind: 'video', summary: 'سکوت، توجیه، حمله — و اینکه هرکدام از چه چیزی محافظت می‌کنند.', minTier: 'bronze', url: '#' },
  { slug: 'worksheet-feelings', title: 'کاربرگ ثبت احساس روزانه', kind: 'worksheet', summary: 'تمرین بین‌جلسه‌ای برای تشخیص احساس در لحظه.', minTier: 'silver', url: '#' },
  { slug: 'video-conflict-cycle', title: 'چرخهٔ دعوای تکراری', kind: 'video', summary: 'چطور یک الگوی آشنا در زوج‌ها شکل می‌گیرد و کجا می‌شود شکستش.', minTier: 'silver', url: '#' },
  { slug: 'course-emotion', title: 'دورهٔ کوتاه تنظیم هیجان', kind: 'video', summary: 'شش جلسهٔ ویدیویی، مخصوص مراجعان فعال.', minTier: 'gold', url: '#' },
];

const [staffPhone] = process.argv.slice(2);

for (const item of items) {
  await db.insert(schema.libraryItems).values(item).onConflictDoNothing();
}
console.log(`seeded ${items.length} library items`);

if (staffPhone) {
  const { eq } = await import('drizzle-orm');
  const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, staffPhone) });
  if (existing) {
    await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, existing.id));
    console.log(`${staffPhone} is now admin`);
  } else {
    await db.insert(schema.users).values({ phone: staffPhone, role: 'admin', name: 'پذیرش دل‌آسا' });
    console.log(`created admin ${staffPhone}`);
  }
}
process.exit(0);
