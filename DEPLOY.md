# النشر على Botkeep (أو أي استضافة)

## 0. أول حاجة: غيّر المفاتيح
أي مفتاح اتكتب في محادثة أو في ملف اتشارك يعتبر مكشوف. غيّر كل دول قبل النشر:
- التوكن: من BotFather بأمر `/revoke`، وبعدين توكن جديد.
- مفاتيح Gemini وGroq وOpenRouter: من مكان إنشاء كل مفتاح، وامسح القديم.
- `ADMIN_TOKEN` و`CASH_SMS_SECRET`: ولّد قيم جديدة بـ `openssl rand -hex 24`.

**متكتبش المفاتيح في الشات ولا في ملف داخل الكود.** ولا تعمل ملف `.env` داخل الـ zip.

## 1. الكود على GitHub (خاص)
الخطأ "Repository or branch not found" معناه إن الاستضافة مش متوصلة بمستودع. اعمل التالي:
1. اعمل مستودع **Private** على GitHub.
2. ارفع المجلد كله. ملف `.gitignore` بيستبعد `.env` و`data` و`node_modules`، فلو شفت `.env` في الرفع، امسحه قبل الرفع.
3. من جهازك شغّل `npm install` مرة واحدة، وارفع `package-lock.json` المحدّث.
4. في Botkeep، وصّل حساب GitHub وامنح الصلاحية للمستودع ده بالذات.

## 2. المتغيرات في لوحة الاستضافة
ضيف المتغيرات من تبويب **Environment** (Key / Value أو Bulk Import). **ما تحطهاش في ملف في الكود.** استخدم القيم الجديدة اللي ولّدتها في الخطوة 0.

المتغيرات الأساسية:
```
TELEGRAM_BOT_TOKEN
GEMINI_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
BOT_MODE=polling
ADMIN_TELEGRAM_IDS
ADMIN_TOKEN
CASH_NUMBER
CASH_SMS_SECRET
REQUIRE_PHONE=on
FREE_FILES_PER_DAY=2
GEMINI_MODEL_FAST=<موديل خفيف شغال من check-ai>
GEMINI_MODEL_QUALITY=<موديل قوي شغال من check-ai>
GEMINI_MODELS=<القائمة الاحتياطية>
```
باقي المتغيرات في `.env.example` ليها قيم افتراضية معقولة.

## 3. تشغيل الموديلات قبل النشر
من جهازك، بالمفاتيح الجديدة (من غير ما تحطها في الكود):
```bash
node --env-file=.env scripts/check-ai.js
```
النتيجة بتقولك أي موديل شغال. الأسماء اللي مش موجودة متستخدمش. ضبط `GEMINI_MODEL_FAST` و`GEMINI_MODEL_QUALITY` على الأسماء الشغالة.

## 4. أمر التشغيل
- Install: `npm install --omit=dev`
- Start: `node src/index.js`
- Port: نفس `PORT` في المتغيرات (الافتراضي 8080). الـ `/health` بيرد `{"ok":true}`.

## 5. وقف النسخة المحلية الأول
نفس التوكن مينفعش يشتغل في مكانين في نفس الوقت (polling). **أوقف البوت على جهازك قبل ما تشغّل على Botkeep**، وإلا هتشوف خطأ "terminated by other getUpdates request".

## 6. قبل ما تفتح للناس
- `/start` وتتأكد من رقم التليفون.
- ملف نصي وملف ممسوح (scan) وملف فيه صور.
- كويز 5 و10، وملخص، وPDF.
- `/admin` بالـ `ADMIN_TOKEN` وتتأكد إن الأرقام والاستخدام بيظهروا.

## 7. حاجات ممكن Botkeep ما يوفرهاش
- **pdftoppm** (poppler): محتاجه لقراءة الملفات الممسوحة. لو مش متاح، الملفات الممسوحة مش هتتقرأ وهيقولك السبب في الرسالة.
- **Chrome**: محتاجه لـ PDF. لو مش متاح، الـ PDF هيرجع HTML مع سبب.
- **تخزين دائم**: الملفات في `./data` ممكن تتمسح مع كل ريستارت. استخدم `REDIS_URL` (Upstash مجاني) لو عايز الجلسات والاشتراكات تفضل.
- إذا Botkeep بيدعم Docker، استخدم `Dockerfile` في المشروع، لأنه بيركّب poppler وChrome.

## 8. ابدأ بمجموعة مغلقة
ادخل 5 إلى 10 أشخاص بس، وراقب السجلات أسبوع قبل ما تفتح للعامة.
