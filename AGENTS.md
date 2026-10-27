# Souk Lens Indie — Session Rules (ثابتة)

## القاعدة الثابتة: دفع تلقائي إلى GitHub
- الريبو: `https://github.com/DhabtPlatform/souk-lens-indie` — الفرع: `main`
- مع **نهاية كل جلسة عمل** (وبعد أي تغيير مهم)، نفّذ تلقائيًا بدون ما تستنى طلب:
  1. `git status --short` للمراجعة
  2. `git add -A` (مع احترام `.gitignore` — ممنوع دفع `.env` أو `node_modules` أو `.next`)
  3. `git commit -m "<وصف مختصر بالعربي/إنجليزي>"` — لو مفيش تغييرات تخطَّ
  4. `git pull --rebase origin main` ثم `git push origin main`
- لو الـ push فشل (مصادقة/نت)، بلّغ المستخدم فورًا بالخطأ والحل، ولا تعتبر الجلسة مكتملة.
- قبل الدفع: `npm run typecheck` وإن أمكن `npm run build` للتأكد.
