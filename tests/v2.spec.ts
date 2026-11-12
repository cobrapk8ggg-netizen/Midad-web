import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("v2 guest workspace, real tools, backup, immediate signup and cloud transfer", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "الدخول كضيف", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/v2/auth-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
  await expect(
    page.getByText("مساحة الضيف · أعمالك محفوظة على هذا الجهاز"),
  ).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/v2/library-empty.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("ذاكرة الماء");
  await page
    .getByLabel("عن الحكاية (اختياري)")
    .fill("رحلة في المدن التي ابتلعها البحر.");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();

  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("البحر الخافت");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  await editor.fill(
    "في الميناء القديم، كانت ليلى تسمع البحر الخافت. هذه حكاية عربية مع MIDAD 2026.\n".repeat(
      70,
    ),
  );
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "ذاكرة الماء", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(editor).toContainText("البحر الخافت");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/editor-desktop.png" });
  await page
    .getByRole("button", { name: "ابدأ جلسة كتابة", exact: true })
    .click();
  await editor.press("ControlOrMeta+End");
  await editor.press("Enter");
  await editor.pressSequentially("كلمات جديدة في جلسة الكتابة");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "إنهاء وحفظ الجلسة" }).click();
  await expect(
    page.getByText("١ جلسة").or(page.getByText("1 جلسة")),
  ).toBeVisible();
  await editor.click();
  await editor.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "إضافة تعليق أو حاشية" }).click();
  await page.getByLabel("نوع الملاحظة").selectOption("footnote");
  await page
    .getByLabel("نص الملاحظة", { exact: true })
    .fill("الميناء مدينة خيالية على حافة الذاكرة.");
  await page.getByRole("button", { name: "حفظ الملاحظة", exact: true }).click();
  await expect
    .poll(() => page.locator(".annotation-mark").count())
    .toBeGreaterThan(0);
  await expect(
    page.getByText("الميناء مدينة خيالية على حافة الذاكرة.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "إعدادات الرواية", exact: true })
    .click();
  await page.getByLabel("هدف الكلمات").fill("50000");
  await page.getByRole("button", { name: "حفظ إعدادات الرواية" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/editor-annotations.png" });
  await page.getByRole("button", { name: "الشخصيات", exact: true }).click();
  for (const name of ["ليلى", "سليم"]) {
    await page.getByRole("button", { name: "شخصية جديدة" }).click();
    await page.getByLabel("الاسم", { exact: true }).fill(name);
    await page
      .getByLabel("الوصف", { exact: true })
      .fill(
        name === "ليلى"
          ? "تبحث عن مرافئ ذاكرتها."
          : "يحمل خريطة إلى مدينة غائبة.",
      );
    await page.getByLabel("العمر", { exact: true }).fill("٢٧");
    await page.getByLabel("الألقاب والأسماء الأخرى").fill("حارس الذاكرة");
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "العلاقات", exact: true }).click();
  await page.getByRole("button", { name: "علاقة جديدة", exact: true }).click();
  await page.getByLabel("نوع العلاقة").fill("شقيقان");
  await page.getByRole("button", { name: "حفظ العلاقة" }).click();
  await expect(page.locator(".relationship-list")).toContainText("شقيقان");
  await page.getByRole("button", { name: "تحرير علاقة شقيقان" }).click();
  await page.getByLabel("نوع العلاقة").fill("حليفان");
  await page.getByRole("button", { name: "حفظ العلاقة" }).click();
  await expect(page.locator(".relationship-list")).toContainText("حليفان");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/relationships.png" });
  await page.getByRole("button", { name: "الأحداث", exact: true }).click();
  await page.getByRole("button", { name: "خطوط الأحداث", exact: true }).click();
  await page
    .getByRole("button", { name: "خط أحداث جديد", exact: true })
    .click();
  await page.getByLabel("العنوان", { exact: true }).fill("استعادة الذاكرة");
  await page.getByLabel("ما الهدف من هذا الخط؟").fill("العثور على الميناء");
  await page.getByLabel("الصراع", { exact: true }).fill("كل خريطة تمحو ذكرى");
  await page.getByLabel("النتيجة", { exact: true }).fill("تختار المدينة");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "استعادة الذاكرة" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "حدث جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("تصل الخريطة");
  await page
    .getByLabel("التفاصيل", { exact: true })
    .fill("رسالة تفتح باب الحكاية.");
  await page.getByLabel("التاريخ داخل الحكاية").fill("2040-03-21");
  await page
    .getByLabel("خط الأحداث (اختياري)", { exact: true })
    .selectOption({ label: "استعادة الذاكرة" });
  await page
    .getByLabel("جزء الفصل المرتبط (اختياري)", { exact: true })
    .selectOption({ index: 1 });
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await page
    .getByRole("button", { name: "ترتيب الأحداث", exact: true })
    .click();
  await page.getByLabel("حالة تصل الخريطة").selectOption("draft");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/plan.png" });
  await page.getByRole("button", { name: "البحر الخافت", exact: true }).click();
  await expect(editor).toContainText("البحر الخافت");
  await page.getByRole("button", { name: "لوحة الأوامر", exact: true }).click();
  await page.getByLabel("بحث الأوامر").fill("القديم");
  await expect(page.locator(".project-search button")).toHaveCount(1);
  await page.locator(".project-search button").click();
  await expect(editor).toContainText("القديم");
  await page.getByRole("button", { name: "إدارة الفصول" }).click();
  await page.getByRole("button", { name: "تسمية الفصل البحر الخافت" }).click();
  await page.getByLabel("الاسم الجديد").fill("بوابة البحر");
  await page.getByRole("button", { name: "حفظ الاسم" }).click();
  await expect(page.locator(".manuscript-manager")).toContainText(
    "بوابة البحر",
  );
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("button", { name: "المكتبة", exact: true })
    .click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/v2/library-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل نسخة احتياطية" }).click();
  const download = await downloading;
  const content = fs.readFileSync((await download.path())!);
  const backup = JSON.parse(content.toString());
  expect(
    backup.rows.some((r: any) => r._table === "relationships"),
  ).toBeTruthy();
  expect(backup.rows.some((r: any) => r._table === "annotations")).toBeTruthy();
  await page.getByLabel("ملف النسخة الاحتياطية").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: content,
  });
  await page.getByRole("button", { name: "استيراد كنسخة جديدة" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "تمت استعادة" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await expect(page.locator(".book-item")).toHaveCount(2, { timeout: 90000 });
  await page
    .getByRole("button", { name: "ذاكرة الماء", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(editor).toContainText("البحر الخافت");
  await page.getByRole("button", { name: "أنشئ حسابًا لحفظها سحابيًا" }).click();
  await page.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
  const email = "midad.v2.browser." + Date.now() + "@gmail.com",
    password = "Midad!" + crypto.randomUUID();
  fs.writeFileSync(
    "/workspace/scratch/v2-browser-account.json",
    JSON.stringify({ email, password }),
  );
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "إنشاء حساب والبدء", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "نقل أعمال الضيف إلى حسابي" }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "نقل أعمال الضيف إلى حسابي" }).click();
  await expect(
    page.getByRole("button", { name: "نقل أعمال الضيف إلى حسابي" }),
  ).not.toBeVisible({ timeout: 90000 });
  await expect(page.locator(".book-item")).toHaveCount(2, { timeout: 90000 });
  await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await page
    .getByRole("button", { name: "ذاكرة الماء", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(editor).toContainText("البحر الخافت");
  await expect(
    page.getByText("الميناء مدينة خيالية على حافة الذاكرة.", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 810, height: 1080 });
  await page.getByRole("button", { name: "إظهار التفاصيل" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/editor-ipad.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.locator(".binder").isVisible())
    await page.getByRole("button", { name: "إظهار قائمة الفصول" }).click();
  if (await page.locator(".context-panel").isVisible())
    await page.getByRole("button", { name: "إظهار التفاصيل" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/v2/editor-phone.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("guest storage saves offline and refuses stale edits from a second tab", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("تعارض محلي");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();

  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("فصل");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const e1 = page.getByRole("textbox", { name: "نص الفصل" });
  await expect(e1).toBeVisible();
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: "تعارض محلي", exact: true })
    .first()
    .click();
  await second.getByRole("button", { name: "الكتابة", exact: true }).click();
  const e2 = second.getByRole("textbox", { name: "نص الفصل" });
  await expect(e2).toBeVisible();
  await context.setOffline(true);
  await e1.fill("أحدث نسخة محلية محفوظة دون اتصال");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await e2.fill("تعديل متأخر من نافذة أخرى");
  await expect(
    second.getByRole("status").filter({ hasText: "توجد نسخة أحدث" }),
  ).toBeVisible({ timeout: 15000 });
  const downloadPromise = second.waitForEvent("download");
  await second.getByRole("button", { name: "تنزيل نسختي المحلية" }).click();
  const download = await downloadPromise;
  expect(fs.readFileSync((await download.path())!, "utf8")).toContain(
    "تعديل متأخر",
  );
  await context.setOffline(false);
  await page.reload();
  await page
    .getByRole("button", { name: "تعارض محلي", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(e1).toContainText("أحدث نسخة محلية محفوظة");
  await expect(e1).not.toContainText("تعديل متأخر");
});
