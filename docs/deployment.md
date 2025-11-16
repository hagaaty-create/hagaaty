# نشر المشروع

هذا الدليل يشرح كيفية نشر مشروعك على Vercel ورفعه على GitHub.

## المتطلبات الأساسية

1.  **Git**: تأكد من أن Git مثبت على جهازك.
2.  **حساب GitHub**: ستحتاج إلى حساب على [GitHub](https://github.com).
3.  **حساب Vercel**: ستحتاج إلى حساب على [Vercel](https://vercel.com) (يمكنك التسجيل باستخدام حساب GitHub الخاص بك).

---

## الخطوة 1: رفع المشروع على GitHub

أولاً، ستحتاج إلى إنشاء مستودع (repository) جديد على GitHub ورفع كود المشروع إليه.

1.  **إنشاء مستودع جديد على GitHub**:
    *   اذهب إلى [github.com/new](https://github.com/new).
    *   أعطِ المستودع اسمًا (مثلاً: `hagaaty-ai-blog`).
    *   اجعله `Public` أو `Private` حسب رغبتك.
    *   **لا تقم** بتهيئة المستودع بملف `README` أو `.gitignore` أو `license`، لأن المشروع يحتوي عليها بالفعل.
    *   اضغط على "Create repository".

2.  **ربط مشروعك المحلي بالمستودع ورفع الكود**:
    *   افتح الطرفية (Terminal) في مجلد مشروعك.
    *   قم بتنفيذ الأوامر التالية بالترتيب، مع استبدال `YOUR_USERNAME` و `YOUR_REPOSITORY` بالقيم الصحيحة من المستودع الذي أنشأته:

    ```bash
    # تهيئة مستودع Git محليًا
    git init
    git add .
    git commit -m "Initial commit"

    # ربط المستودع المحلي بالمستودع على GitHub
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

    # تعيين الفرع الرئيسي
    git branch -M main

    # رفع الكود إلى GitHub
    git push -u origin main
    ```

---

## الخطوة 2: النشر على Vercel

الآن بعد أن أصبح الكود على GitHub، يمكنك نشره بسهولة على Vercel.

1.  **استيراد المشروع في Vercel**:
    *   اذهب إلى لوحة تحكم Vercel الخاصة بك وانقر على "**Add New...**" ثم اختر "**Project**".
    *   ابحث عن المستودع الذي أنشأته على GitHub (`hagaaty-ai-blog` مثلاً) وانقر على "**Import**".

2.  **تكوين المشروع**:
    *   سيقوم Vercel تلقائيًا باكتشاف أن هذا مشروع Next.js. لا تحتاج عادةً لتغيير أي إعدادات بناء.
    *   **الأهم**: افتح قسم "**Environment Variables**".

3.  **إضافة متغيرات البيئة (Environment Variables)**:
    *   ستحتاج إلى إضافة جميع المتغيرات الموجودة في ملف `.env.local` الخاص بك إلى إعدادات Vercel. هذه المتغيرات ضرورية لكي يعمل Firebase و Genkit AI بشكل صحيح.
    *   لكل متغير، قم بإضافته بالاسم والقيمة الصحيحين. على سبيل المثال:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `GEMINI_API_KEY`
        *   ... وهكذا لجميع المتغيرات الأخرى.

4.  **النشر**:
    *   بعد إضافة جميع متغيرات البيئة، انقر على زر "**Deploy**".
    *   سيقوم Vercel ببناء ونشر مشروعك. بعد اكتمال العملية، ستحصل على رابط لموقعك المباشر.

---

مبروك! مشروعك الآن مباشر على الإنترنت وموجود على GitHub. أي تعديلات مستقبلية تقوم برفعها إلى فرع `main` على GitHub سيتم نشرها تلقائيًا على Vercel.
