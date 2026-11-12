import { test, expect } from "@playwright/test";
import fs from "node:fs";
const creds = () =>
  JSON.parse(fs.readFileSync("/tmp/midad-e2e-credentials.json", "utf8"));
const fixture = () =>
  JSON.parse(fs.readFileSync("/tmp/midad-v4-fixture.json", "utf8"));
async function login(p: any, email: string, password: string) {
  await p.goto("/");
  await p.getByLabel("البريد الإلكتروني").fill(email);
  await p.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await p.getByRole("button", { name: "دخول إلى مِداد", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "رواية جديدة", exact: true }),
  ).toBeVisible();
}
async function save(p: any) {
  await expect(
    p
      .getByRole("status")
      .filter({ hasText: /محفوظ (في حسابك|على هذا الجهاز)/ }),
  ).toBeVisible({ timeout: 20000 });
}
test("V4: advanced Arabic formatting, visible font choices, persistence, taxonomy backup and cloud transfer", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("مدائن الغيم");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("أبجدية المدينة");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  await expect(editor).toBeVisible();
  await editor.fill(
    "حين فتحت ليان باب المدينة، وجدت كلماتها معلّقة على الزجاج. وقالت: «أيّ عالم هذا؟» MIDAD 2026.\n".repeat(
      160,
    ),
  );
  await save(page);
  await editor.press("ControlOrMeta+A");
  await page
    .getByLabel("خط النص المحدد", { exact: true })
    .selectOption("Cairo");
  await page
    .getByLabel("حجم النص المحدد", { exact: true })
    .selectOption("32px");
  await page.getByRole("button", { name: "عريض", exact: true }).click();
  await page.getByLabel("لون النص", { exact: true }).fill("#e5cb93");
  await page.getByRole("button", { name: "تظليل النص", exact: true }).click();
  await page.getByRole("button", { name: "ضبط السطور", exact: true }).click();
  await save(page);
  await expect(
    editor.locator('span[style*="font-family: Cairo"]').first(),
  ).toBeVisible();
  await expect(editor.locator("mark").first()).toBeVisible();
  expect(
    await editor.evaluate(
      (e: any) =>
        getComputedStyle(e.querySelector('span[style*="font-family"]'))
          .fontFamily,
    ),
  ).toContain("Cairo");
  await page.evaluate(() => document.fonts.load("24px Cairo"));
  expect(
    await page.evaluate(() => document.fonts.check("24px Cairo")),
  ).toBeTruthy();
  await page.screenshot({ path: "docs/screenshots/v4/editor-desktop.png" });
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await page
    .getByLabel("خط صفحة الكتابة", { exact: true })
    .selectOption("naskh");
  await page
    .getByLabel("تباعد سطور الصفحة", { exact: true })
    .selectOption("2.5");
  await page.screenshot({ path: "docs/screenshots/v4/editor-fonts.png" });
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await page.getByRole("button", { name: "وضع التركيز", exact: true }).click();
  await expect(editor).toContainText("كلماتها");
  await page.screenshot({ path: "docs/screenshots/v4/focus.png" });
  await page
    .getByRole("button", { name: "مغادرة التركيز", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "مدائن الغيم", exact: true })
    .first()
    .click();
  await page.locator(".novel-chapter-row").first().click();
  await expect(
    editor.locator('span[style*="font-family: Cairo"]').first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await expect(page.getByLabel("خط صفحة الكتابة", { exact: true })).toHaveValue(
    "naskh",
  );
  await expect(
    page.getByLabel("تباعد سطور الصفحة", { exact: true }),
  ).toHaveValue("2.5");
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إعدادات الرواية", exact: true })
    .click();
  await page.getByLabel("نوع فانتازيا", { exact: true }).check();
  await page
    .getByLabel("حالة روايتي", { exact: true })
    .selectOption("completed");
  await page.getByLabel("عمر قرّاء روايتي", { exact: true }).selectOption("16+");
  await page
    .getByLabel("وسوم الرواية", { exact: true })
    .fill("غيوم، مدينة، صداقة");
  await page
    .getByRole("button", { name: "حفظ تصنيف الرواية", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "تم حفظ التصنيف", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/v4/classification.png" });
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  const dp = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل نسخة احتياطية", exact: true })
    .click();
  const d = await dp;
  const backup = JSON.parse(fs.readFileSync((await d.path())!, "utf8"));
  expect(
    backup.rows.find((r: any) => r._table === "novel_metadata").status,
  ).toBe("completed");
  expect(
    backup.rows.find((r: any) => r._table === "project_genres").genre_code,
  ).toBe("fantasy");
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.getByRole("button", { name: "أنشئ حسابًا لحفظها سحابيًا" }).click();
  const c = creds();
  await page.getByLabel("البريد الإلكتروني").fill(c.emailA);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await page
    .getByRole("button", { name: "نقل أعمال الضيف إلى حسابي", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "نقل أعمال الضيف إلى حسابي",
      exact: true,
    }),
  ).not.toBeVisible({ timeout: 90000 });
  await page
    .getByRole("button", { name: "مدائن الغيم", exact: true })
    .first()
    .click();
  await page.locator(".novel-chapter-row").first().click();
  await expect(
    editor.locator('span[style*="font-family: Cairo"]').first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "إعدادات الرواية", exact: true })
    .click();
  await expect(page.getByLabel("نوع فانتازيا", { exact: true })).toBeChecked();
  await expect(page.getByLabel("حالة روايتي", { exact: true })).toHaveValue(
    "completed",
  );
  await expect(page.getByLabel("وسوم الرواية", { exact: true })).toHaveValue(
    "صداقة، غيوم، مدينة",
  );
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.locator(".binder").isVisible())
    await page
      .getByRole("button", { name: "إظهار قائمة الفصول", exact: true })
      .click();
  if (await page.locator(".context-panel").isVisible())
    await page
      .getByRole("button", { name: "إظهار التفاصيل", exact: true })
      .click();
  await page.screenshot({ path: "docs/screenshots/v4/editor-phone.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("V4: real author photos, links, selected private novels, public profile, follow rating bookmarks discovery and reader", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const c = creds(),
    f = fixture(),
    errors: string[] = [];
  const owner = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  owner.on("pageerror", (e) => errors.push(e.message));
  await login(owner, c.emailA, c.password);
  await owner.getByRole("button", { name: "حسابي", exact: true }).click();
  await expect(owner.locator(".writer-identity h1")).toHaveText("ليان السامر");
  await owner
    .locator(".account-topline")
    .getByRole("button", { name: "تعديل الملف", exact: true })
    .click();
  await owner
    .getByLabel("كلمات تعرّف بك", { exact: true })
    .fill("أكتب لأجد أبوابًا لم تُفتح بعد.");
  await owner
    .getByRole("textbox", { name: "عنّي", exact: true })
    .fill(
      "أحب الحكايات التي تترك نافذة مفتوحة. أكتب روايات عربية بين الخيال العلمي والفانتازيا.",
    );
  await owner
    .getByLabel("صورة البروفايل", { exact: true })
    .setInputFiles("/tmp/midad-v4-media/avatar.png");
  await owner
    .getByLabel("غلاف البروفايل", { exact: true })
    .setInputFiles("/tmp/midad-v4-media/banner.png");
  await owner.getByRole("button", { name: "إضافة رابط", exact: true }).click();
  await owner.getByLabel("اسم الرابط 2", { exact: true }).fill("موقعي");
  await owner
    .getByLabel("عنوان الرابط 2", { exact: true })
    .fill("https://example.com/writer");
  await owner
    .getByRole("button", { name: "حفظ الملف الشخصي", exact: true })
    .click();
  await expect(
    owner.getByRole("status").filter({ hasText: "تم حفظ ملفك ورف رواياتك." }),
  ).toBeVisible({ timeout: 30000 });
  await owner.screenshot({
    path: "docs/screenshots/v4/profile-editor.png",
    fullPage: true,
  });
  await owner.getByRole("button", { name: "رف رواياتي", exact: true }).click();
  await owner
    .getByLabel("إظهار ريش من زجاج في ملفي", { exact: true })
    .uncheck();
  await owner
    .getByLabel("إظهار دفتر خاص لا يظهر في ملفي", { exact: true })
    .check();
  await owner
    .getByRole("button", { name: "تمييز دفتر خاص لا يظهر", exact: true })
    .click();
  await owner
    .getByRole("button", { name: "حفظ الملف الشخصي", exact: true })
    .click();
  await expect(
    owner.getByRole("status").filter({ hasText: "تم حفظ ملفك ورف رواياتك." }),
  ).toBeVisible();
  await owner.screenshot({
    path: "docs/screenshots/v4/showcase-editor.png",
    fullPage: true,
  });
  const reader = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  reader.on("pageerror", (e) => errors.push(e.message));
  await reader.goto("/profile?username=" + f.handle);
  await expect(reader.locator(".writer-identity h1")).toHaveText("ليان السامر");
  await expect(reader.locator(".writer-bio")).toContainText("نافذة مفتوحة");
  await expect(reader.locator(".writer-portrait img")).toBeVisible();
  await expect
    .poll(() =>
      reader
        .locator(".writer-portrait img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(100);
  await expect(
    reader.getByRole("link", { name: "موقعي", exact: false }),
  ).toHaveAttribute("href", "https://example.com/writer");
  await expect(
    reader.locator(".novel-discovery-grid .discovery-novel"),
  ).toHaveCount(2);
  await expect(reader.locator(".novel-discovery-grid")).not.toContainText(
    "ريش من زجاج",
  );
  await expect(
    reader.locator(".novel-discovery-grid .discovery-novel").first(),
  ).toContainText("دفتر خاص");
  await reader.evaluate(() => document.fonts.ready);
  await reader.screenshot({
    path: "docs/screenshots/v4/public-profile-desktop.png",
    fullPage: true,
  });
  for (const size of [
    { width: 1080, height: 810 },
    { width: 810, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    await reader.setViewportSize(size);
    await reader.screenshot({
      path: `docs/screenshots/v4/profile-${size.width}.png`,
      fullPage: true,
    });
    expect(
      await reader.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await reader.setViewportSize({ width: 1440, height: 1000 });
  await reader
    .getByRole("button", { name: "متابعة الكاتب", exact: true })
    .click();
  await reader.getByLabel("البريد الإلكتروني", { exact: true }).fill(c.emailB);
  await reader.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await reader
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await expect(reader.getByRole("dialog")).not.toBeVisible();
  await expect(
    reader.getByRole("button", { name: "تتابعه", exact: true }),
  ).toBeVisible();
  await reader.getByRole("button", { name: "تتابعه", exact: true }).click();
  await expect(
    reader.getByRole("button", { name: "متابعة الكاتب", exact: true }),
  ).toBeVisible();
  await reader
    .getByRole("button", { name: "متابعة الكاتب", exact: true })
    .click();
  await expect(
    reader.getByRole("button", { name: "تتابعه", exact: true }),
  ).toBeVisible();
  await reader.goto("/novel?id=" + f.teaser);
  await expect(
    reader.getByRole("heading", {
      name: "الحكاية تتكوّن على مهل.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reader.getByRole("link", { name: "ابدأ القراءة", exact: true }),
  ).toHaveCount(0);
  await reader.goto("/novel?id=" + f.novel);
  await reader
    .getByRole("button", { name: "تقييم 4 من 5", exact: true })
    .click();
  await expect(
    reader.getByRole("button", { name: "تقييم 4 من 5", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await reader
    .getByRole("button", { name: "في قائمة قراءتي", exact: true })
    .click();
  await expect(
    reader.getByRole("button", { name: "احفظ للقراءة", exact: true }),
  ).toBeVisible();
  await reader
    .getByRole("button", { name: "احفظ للقراءة", exact: true })
    .click();
  await expect(
    reader.getByRole("button", { name: "في قائمة قراءتي", exact: true }),
  ).toBeVisible();
  await reader.screenshot({
    path: "docs/screenshots/v4/novel-public.png",
    fullPage: true,
  });
  await reader.goto("/discover");
  await reader
    .getByLabel("ابحث عن رواية أو كاتب أو وسم", { exact: true })
    .fill("ارتقاء");
  await reader.getByRole("button", { name: "فانتازيا", exact: true }).click();
  await reader.getByLabel("الفئة العمرية", { exact: true }).selectOption("16+");
  await reader
    .getByLabel("ترتيب الروايات", { exact: true })
    .selectOption("rating");
  await expect(reader.locator(".discovery-results-heading")).toContainText(
    /[١1] رواية/,
  );
  await expect(reader.locator(".novel-discovery-grid")).toContainText(
    "ريش من زجاج",
  );
  await reader.screenshot({
    path: "docs/screenshots/v4/discover.png",
    fullPage: true,
  });
  await reader.goto("/read?novel=" + f.novel);
  await expect(reader.locator(".chapter-reading")).toContainText("المدينة");
  await reader
    .getByRole("button", { name: "تخصيص القراءة", exact: true })
    .click();
  await reader
    .getByLabel("خط القراءة", { exact: true })
    .selectOption("tajawal");
  await reader.getByLabel("تباعد القراءة", { exact: true }).selectOption("1.8");
  await reader.screenshot({
    path: "docs/screenshots/v4/reader.png",
    fullPage: true,
  });
  await reader.reload();
  await reader
    .getByRole("button", { name: "تخصيص القراءة", exact: true })
    .click();
  await expect(reader.getByLabel("خط القراءة", { exact: true })).toHaveValue(
    "tajawal",
  );
  await expect(reader.getByLabel("تباعد القراءة", { exact: true })).toHaveValue(
    "1.8",
  );
  expect(errors).toEqual([]);
  await owner.close();
  await reader.close();
});
