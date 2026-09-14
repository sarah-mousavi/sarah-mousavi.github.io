# سایت دکتر سارا موسوی

سایت معرفی و رزرو وقت — ساخته‌شده با **Astro**، راست‌چین (فارسی)، خروجی کاملاً استاتیک.

```
src/pages/index.astro     صفحهٔ اصلی + اسکریپت‌های کلاینت (منو، انیمیشن، scrollspy)
src/layouts/Base.astro    قالب پایه، متاتگ‌ها، فونت، Schema.org
src/components/*.astro    بخش‌های صفحه (Hero، About، Approach، …)
src/data/site.ts          تمام متن‌های قابل‌ویرایش (خدمات، سوالات متداول، حوزه‌های کاری)
src/styles/global.css     استایل‌ها + متغیرهای رنگ در :root
src/assets/sara.png       عکس پروفایل (توسط astro:assets بهینه می‌شود)
reference/                اسکرین‌شات‌های اینستاگرام (منبع محتوا، در سایت استفاده نمی‌شود)
```

برای تغییر متن‌ها معمولاً فقط لازم است `src/data/site.ts` را ویرایش کنید.

## اجرا

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # خروجی در dist/
npm run preview
```

## انتشار روی GitHub Pages

`.github/workflows/deploy.yml` با هر push روی شاخهٔ `main` سایت را build و منتشر می‌کند.

مراحل یک‌بار برای همیشه:

1. مخزن را روی حساب مقصد بسازید — برای آدرس `saramousavi.github.io` نام مخزن باید دقیقاً
   `saramousavi.github.io` باشد و مخزن باید متعلق به همان حساب کاربری باشد.
2. در `Settings → Pages` گزینهٔ **Source** را روی **GitHub Actions** بگذارید.
3. کد را push کنید.

اگر به‌جای user site از project site استفاده می‌کنید (مثلاً `username.github.io/sara`)،
در `astro.config.mjs` مقدار `base` را به `'/sara'` و `site` را به آدرس حساب خودتان تغییر دهید.

## کارهای باقی‌مانده

- **فرم رزرو**: فعلاً فقط سمت کلاینت اعتبارسنجی می‌شود و پیام موفقیت نشان می‌دهد.
  در `src/components/Contact.astro` بخش `TODO` را به یک endpoint واقعی وصل کنید
  (Formspree، اسکریپت PHP روی هاست، یا یک API اختصاصی).
- **شمارهٔ تماس / واتس‌اپ / آدرس دقیق کلینیک** در بخش `#contact` اضافه شود.
- **مدارک و سوابق تحصیلی**: متن «درباره من» عمداً کلی نوشته شده؛ با مدارک واقعی جایگزین شود.
- **عکس با کیفیت بالاتر**: `src/assets/sara.png` از اسکرین‌شات اینستاگرام برش خورده و رزولوشن پایینی دارد.
- **بازبینی محتوا**: بخش‌های «رویکرد ISTDP»، «خدمات» و «پرسش‌های متداول» پیش‌نویس هستند و
  باید توسط خود دکتر موسوی تأیید شوند.

## نکات فنی

- فونت: Vazirmatn از Google Fonts.
- رنگ‌ها در `:root` فایل `src/styles/global.css` تعریف شده‌اند (`--accent` رنگ قرمز برند).
- ساختار‌دادهٔ Schema.org از نوع `Psychologist` در `Base.astro`؛ آدرس و شمارهٔ تماس را آنجا هم اضافه کنید.
- دسترس‌پذیری: skip link، فوکوس قابل‌مشاهده، و احترام به `prefers-reduced-motion`.
