import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("V4 global ranking, private reading shelf and following feed use actual signed-in account", async ({
  page,
}) => {
  const c = JSON.parse(
    fs.readFileSync("/tmp/midad-e2e-credentials.json", "utf8"),
  );
  await page.goto("/");
  await page.getByLabel("البريد الإلكتروني").fill(c.emailB);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "رواية جديدة", exact: true }),
  ).toBeVisible();
  await page.goto("/discover");
  await page
    .getByRole("button", { name: "الترتيب العام", exact: true })
    .click();
  await expect(page.locator(".novel-rank").first()).toContainText(/[١1]/);
  await expect(page.locator(".novel-discovery-grid")).toContainText(
    "ريش من زجاج",
  );
  await page
    .getByRole("button", { name: "كيف يعمل الترتيب؟", exact: true })
    .click();
  await expect(page.locator(".ranking-explainer")).toContainText("3.5");
  await page.screenshot({
    path: "docs/screenshots/v4/ranking.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "قائمة قراءتي", exact: true }).click();
  await expect(page.locator(".novel-discovery-grid")).toContainText(
    "ريش من زجاج",
  );
  await page.getByRole("button", { name: "كتّاب أتابعهم", exact: true }).click();
  await expect(page.locator(".novel-discovery-grid")).toContainText(
    "ريش من زجاج",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/v4/discover-phone.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "الترتيب العام", exact: true })
    .click();
  await expect(page.locator(".novel-rank").first()).toBeVisible();
});
test("V4 large Arabic chapter, paragraph formatting, safe link, undo and reload preserve actual content", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("مدينة الحبر");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page
    .getByLabel("العنوان", { exact: true })
    .fill("حين تفتح المدينة عينيها");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const e = page.getByRole("textbox", { name: "نص الفصل" });
  const paragraph =
    "في تلك الليلة، لم تنم المدينة. كانت النوافذ تضيء واحدة تلو الأخرى، كأن أحدًا يكتب رسالة طويلة فوق جدرانها. توقفت ليان عند الباب الذي لم يكن هنا بالأمس، ومدّت يدها إلى الاسم المحفور عليه. «كل حكاية تبدأ بخطوة»، قالت. وفي جيبها ورقة تحمل كلمة واحدة: العودة. MIDAD 2026.\n";
  const text = paragraph.repeat(600);
  const start = Date.now();
  await e.fill(text);
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible({ timeout: 30000 });
  const saveMs = Date.now() - start;
  expect((await e.innerText()).length).toBeGreaterThan(150000);
  await e.press("Control+Home");
  await e.press("Control+Shift+ArrowDown");
  await page.getByLabel("نمط الفقرة", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "تسطير", exact: true }).click();
  await page.getByLabel("اتجاه الفقرة", { exact: true }).selectOption("auto");
  await page
    .getByRole("button", { name: "مسافة بداية الفقرة", exact: true })
    .click();
  await page.getByRole("button", { name: "إضافة رابط", exact: true }).click();
  await page
    .getByLabel("عنوان الرابط", { exact: true })
    .fill("https://example.com/story");
  await page.getByRole("button", { name: "حفظ الرابط", exact: true }).click();
  await expect(e.locator("h2").first()).toHaveAttribute("dir", "auto");
  await expect(e.locator("h2").first()).toHaveAttribute(
    "style",
    /text-indent: 1em/,
  );
  await expect(e.locator("a").first()).toHaveAttribute(
    "href",
    "https://example.com/story",
  );
  await e.press("Control+End");
  await e.press("End");
  await e.press("Enter");
  await e.pressSequentially("نهاية الاختبار");
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await expect(e).not.toContainText("نهاية الاختبار");
  await page.getByRole("button", { name: "إعادة", exact: true }).click();
  await expect(e).toContainText("نهاية الاختبار");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "مدينة الحبر", exact: true })
    .first()
    .click();
  await page.locator(".novel-chapter-row").first().click();
  await expect(e).toContainText("نهاية الاختبار");
  await expect(e.locator("h2").first()).toHaveAttribute("dir", "auto");
  expect((await e.innerText()).length).toBeGreaterThan(150000);
  expect(errors).toEqual([]);
  fs.writeFileSync(
    "docs/v4-large-editor-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        characters: text.length,
        paragraphs: 600,
        localSaveMilliseconds: saveMs,
        reloaded: true,
        paragraphDirection: "auto",
        firstIndent: "1em",
        linkPersisted: true,
        undoRedo: true,
        pageErrors: errors.length,
        environment:
          "Chromium on cloud Linux; not a physical iPad performance measurement",
      },
      null,
      2,
    ),
  );
  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("رسالة لم تصل");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await e.fill(
    "لم تكن المدينة كما تركتها. عند أول الشارع، اختفت شجرة التوت، وبقي ظلها مرسومًا على الجدار. توقفت ليان طويلًا؛ تعرف هذا الظل، وتعرف النافذة التي كانت أمها تفتحها كل صباح.\nفي جيبها رسالة لم تصل إلى صاحبها. مرّت على الورق بأصابعها، تبحث بين الثنيات عن كلمة لم تقرأها من قبل. في الأعلى، كان اسمها مكتوبًا بخط لا يشبه خط أحد.\n«لعل الحكايات لا تنتهي حين نغادرها»، قالت. ثم دفعت الباب، ودخلت.",
  );
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await page
    .getByLabel("خط صفحة الكتابة", { exact: true })
    .selectOption("naskh");
  await page.getByLabel("تباعد سطور الصفحة", { exact: true }).selectOption("2");
  await page
    .getByRole("button", { name: "إعدادات صفحة الكتابة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إظهار التفاصيل", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "docs/screenshots/v4/editor-compose.png" });
});
