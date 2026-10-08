# دل‌آسا — مرکز روان‌درمانی و سلامت روان

سایت کلینیک: صفحات معرفی ایستا + بخش سمت سرور (رزرو، ورود مراجعان، پذیرش، ربات راهنما).
ساخته‌شده با Astro، PostgreSQL و Drizzle.

```
src/pages/            صفحات و مسیرهای API
src/components/       اجزای مشترک
src/content/blog/     مقالات (Markdown — افزودن مقاله = یک فایل)
src/data/clinic.ts    تمام متن‌ها و اطلاعات قابل‌ویرایش کلینیک
src/server/           منطق سمت سرور: پایگاه‌داده، پیامک، احراز هویت، ربات
src/styles/global.css طراحی و متغیرهای رنگ
drizzle/              مهاجرت‌های پایگاه‌داده
```

## اجرای محلی

```bash
npm install
cp .env.example .env          # حداقل DATABASE_URL و SESSION_SECRET

# یک Postgres محلی (یا هر Postgres دیگری)
docker run -d --name delasa-pg -e POSTGRES_PASSWORD=delasa \
  -e POSTGRES_USER=delasa -e POSTGRES_DB=delasa -p 55432:5432 postgres:16-alpine

npm run db:migrate
npm run db:seed +98912XXXXXXX   # شمارهٔ ادمین پذیرش
npm run dev
```

با `SMS_PROVIDER=console` هیچ پیامکی ارسال نمی‌شود؛ کدهای ورود در لاگ سرور چاپ می‌شوند.

## استقرار

راهنمای کامل Vercel و VPS در [`DEPLOY.md`](./DEPLOY.md).
فهرست کارهای باقی‌مانده پیش از انتشار در [`LAUNCH.md`](./LAUNCH.md).

## نکات فنی

- فونت‌ها: Amiri (سریف فارسی، برای تیترها) و Vazirmatn — هر دو SIL OFL و self-host،
  چون دسترسی به Google Fonts از داخل ایران پایدار نیست.
- رنگ‌ها و تایپوگرافی در `:root` فایل `src/styles/global.css`.
- داده‌ساختاری `MedicalClinic` با ساعت کار در `Base.astro`.
- دسترس‌پذیری: skip link، فوکوس قابل‌مشاهده، احترام به `prefers-reduced-motion`،
  برچسب برای همهٔ فیلدها.
