import { test, expect } from "@playwright/test";
import fs from "node:fs";
const credentials = () =>
  JSON.parse(
    fs.readFileSync(
      process.env.E2E_CREDENTIALS_FILE || "/tmp/midad-e2e-credentials.json",
      "utf8",
    ),
  );
async function login(page: any, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "رواية جديدة", exact: true }),
  ).toBeVisible();
}
async function createNovel(page: any, title: string) {
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill(title);
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await expect(page.locator(".novel-intro h1")).toHaveText(title);
}
async function chapter(page: any, title: string, scenes = false) {
  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill(title);
  const optional = page.getByLabel("أريد تقسيم هذا الفصل إلى مشاهد (اختياري)");
  await expect(optional).not.toBeChecked();
  if (scenes) await optional.check();
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await expect(page.getByRole("textbox", { name: "نص الفصل" })).toBeVisible();
}
test("novel → story → full chapter → optional scenes → merged reading, responsive and local recovery", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "docs/screenshots/v3/login.png" });
  await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
  await createNovel(page, "رواية الذرة — اختبار");
  await expect(
    page.getByRole("button", { name: "إنشاء كتاب", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "قصة الرواية", exact: true }).click();
  await page
    .getByLabel("قصة رواية الذرة — اختبار")
    .fill("بطل يبحث عن سر الذرة في مدينة تتغير كل ليلة.");
  await page
    .getByRole("button", { name: "حفظ قصة الرواية", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "تم حفظ قصة الرواية" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "الفصول", exact: true }).click();
  await chapter(page, "البداية");
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  const long =
    "استيقظ البطل على صوت المطر. قال: «هل هذه هي الذرة؟» MIDAD 2026.\n".repeat(
      220,
    );
  await editor.fill(long);
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await expect(page.locator(".scene-row")).toHaveCount(0);
  await page.screenshot({ path: "docs/screenshots/v3/chapter-desktop.png" });
  await page.getByRole("button", { name: "وضع التركيز", exact: true }).click();
  await expect(editor).toContainText("هل هذه");
  await page.getByRole("button", { name: "مغادرة التركيز" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "رواية الذرة — اختبار", exact: true })
    .first()
    .click();
  await expect(page.locator(".novel-intro h1")).toHaveText(
    "رواية الذرة — اختبار",
  );
  await page.screenshot({ path: "docs/screenshots/v3/novel-desktop.png" });
  await page.getByRole("button", { name: /01 البداية/ }).click();
  await expect(editor).toContainText("هل هذه");
  expect((await editor.innerText()).length).toBeGreaterThan(12000);
  await page
    .getByRole("button", { name: "إضافة مشاهد (اختياري)", exact: true })
    .click();
  await page.getByLabel("العنوان", { exact: true }).fill("وصول الصديق");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await expect(page.locator(".scene-label")).toHaveText("وصول الصديق");
  await editor.fill("وصل صديقه حاملًا رسالة من العالم الآخر.");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "معاينة الفصل كاملًا", exact: true })
    .click();
  await expect(page.locator("dialog .chapter-reading")).toContainText(
    "استيقظ البطل",
  );
  await expect(page.locator("dialog .chapter-reading")).toContainText(
    "وصل صديقه",
  );
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.getByRole("button", { name: "روايتي", exact: true }).click();
  await page.getByRole("button", { name: "أدوات تساعدك", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/v3/tools.png" });
  await page.getByRole("button", { name: "الفصول", exact: true }).click();
  for (const size of [
    { width: 1080, height: 810 },
    { width: 810, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.screenshot({
      path: `docs/screenshots/v3/novel-${size.width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: /01 البداية/ }).click();
  await expect(editor).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/v3/chapter-phone.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("real profiles, invitation, friend reading and coauthor save, explicit publication", async ({
  browser,
}) => {
  test.setTimeout(150000);
  const { emailA, emailB, password } = credentials();
  const a = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    b = await browser.newPage();
  const errors: string[] = [];
  a.on("pageerror", (e) => errors.push(e.message));
  b.on("pageerror", (e) => errors.push(e.message));
  const suffix = Date.now();
  await login(b, emailB, password);
  await b.getByRole("button", { name: "حسابي", exact: true }).click();
  await b.getByLabel("اسمك الظاهر").fill("صديق الكاتب");
  await b
    .getByLabel("اسم المستخدم — لإضافتك إلى رواية")
    .fill("friend_" + suffix);
  await b
    .getByRole("button", { name: "حفظ الملف الشخصي", exact: true })
    .click();
  await expect(
    b.getByRole("button", { name: "تم حفظ الملف", exact: true }),
  ).toBeVisible();
  await login(a, emailA, password);
  await a.getByRole("button", { name: "حسابي", exact: true }).click();
  await a.getByLabel("اسمك الظاهر").fill("كاتب الذرة");
  await a
    .getByLabel("اسم المستخدم — لإضافتك إلى رواية")
    .fill("writer_" + suffix);
  await a
    .getByLabel("عنّي", { exact: true })
    .fill("كاتب عربي يشارك رواياته مع القراء.");
  await a.getByLabel("إظهار ملفي للقراء داخل المنصة").check();
  await a
    .getByRole("button", { name: "حفظ الملف الشخصي", exact: true })
    .click();
  await expect(
    a.getByRole("button", { name: "تم حفظ الملف", exact: true }),
  ).toBeVisible();
  await a.screenshot({ path: "docs/screenshots/v3/profile.png" });
  const profilePage = await browser.newPage();
  await profilePage.goto("/profile?username=writer_" + suffix);
  await expect(profilePage.locator(".public-profile-heading")).toContainText(
    "كاتب عربي يشارك",
  );
  await profilePage.screenshot({
    path: "docs/screenshots/v3/public-profile.png",
  });
  await profilePage.close();
  await a.getByRole("button", { name: "المكتبة", exact: true }).click();
  const title = "رواية مشتركة " + suffix;
  await createNovel(a, title);
  await a.getByRole("button", { name: "قصة الرواية", exact: true }).click();
  await a
    .getByLabel("قصة " + title, { exact: true })
    .fill("قصة محفوظة سحابيًا عن كاتبين يبنيان عالمًا مشتركًا.");
  await a.getByRole("button", { name: "حفظ قصة الرواية", exact: true }).click();
  await expect(
    a.getByRole("button", { name: "تم حفظ قصة الرواية", exact: true }),
  ).toBeVisible();
  await a.getByRole("button", { name: "الفصول", exact: true }).click();
  await chapter(a, "فصل نكتبه معًا");
  await a
    .getByRole("textbox", { name: "نص الفصل" })
    .fill("هذه بداية فصلنا المشترك.");
  await expect(
    a.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await a.getByRole("button", { name: "روايتي", exact: true }).click();
  await a
    .getByRole("button", { name: "المشاركة والقراءة", exact: true })
    .click();
  await a.getByLabel("اسم مستخدم صديقك").fill("friend_" + suffix);
  await a.getByRole("button", { name: "إضافة صديق", exact: true }).click();
  await expect(a.locator(".member-row")).toContainText("صديق الكاتب");
  await a.screenshot({ path: "docs/screenshots/v3/sharing.png" });
  await b.reload();
  await b.getByRole("button", { name: title, exact: true }).first().click();
  await b.getByRole("button", { name: /01 فصل نكتبه معًا/ }).click();
  await expect(b.locator(".chapter-reading")).toContainText("هذه بداية");
  await expect(b.getByRole("textbox", { name: "نص الفصل" })).toHaveCount(0);
  await a.getByLabel("صلاحية friend_" + suffix).selectOption("editor");
  await b.reload();
  await b.getByRole("button", { name: title, exact: true }).first().click();
  await b.getByRole("button", { name: /01 فصل نكتبه معًا/ }).click();
  await b
    .getByRole("textbox", { name: "نص الفصل" })
    .fill("هذه بداية فصلنا المشترك. وأضاف صديقي فقرة جديدة.");
  await expect(
    b.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await a
    .locator(".publication-row")
    .filter({ hasText: "فصل نكتبه معًا" })
    .getByRole("checkbox")
    .check();
  const reader = await browser.newPage();
  const href = await a
    .getByRole("link", { name: "افتح رابط القراءة" })
    .getAttribute("href");
  await reader.goto(href!);
  await expect(reader.locator(".chapter-reading")).toContainText("وأضاف صديقي");
  await reader.screenshot({ path: "docs/screenshots/v3/public-reading.png" });
  await a
    .locator(".publication-row")
    .filter({ hasText: "فصل نكتبه معًا" })
    .getByRole("checkbox")
    .uncheck();
  await reader.reload();
  await expect(
    reader.getByText("لا توجد فصول منشورة متاحة هنا."),
  ).toBeVisible();
  await a.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await expect(
    a.getByRole("button", { name: "دخول إلى مِداد", exact: true }),
  ).toBeVisible();
  await login(a, emailA, password);
  await a.getByRole("button", { name: title, exact: true }).first().click();
  await a.getByRole("button", { name: /01 فصل نكتبه معًا/ }).click();
  await expect(a.getByRole("textbox", { name: "نص الفصل" })).toContainText(
    "وأضاف صديقي",
  );
  expect(errors).toEqual([]);
  await a.close();
  await b.close();
  await reader.close();
});
test("consent uses MIDAD login independently of GPT email and offers account switching", async ({
  page,
}) => {
  test.setTimeout(45000);
  const { nonce } = JSON.parse(
    fs.readFileSync("/tmp/midad-bridge-consent.json", "utf8"),
  );
  const c = credentials();
  await page.goto("/connect?request=" + nonce);
  await page.getByLabel("البريد الإلكتروني").fill(c.emailB);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await expect(page.locator(".midad-account-choice")).toContainText(c.emailB);
  await expect(page.locator(".permission-identity")).toContainText(
    "different-chatgpt-user@midad.example",
  );
  await page
    .getByRole("button", { name: "استخدام حساب مِداد آخر", exact: true })
    .click();
  await page.getByLabel("البريد الإلكتروني").fill(c.emailA);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await expect(page.locator(".midad-account-choice")).toContainText(c.emailA);
  await page
    .getByLabel("اسم يميّز هذا الحساب في ChatGPT")
    .fill("حساب الاختبار المختلف");
  await page.screenshot({
    path: "docs/screenshots/v3/consent.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "موافقة وربط الحساب", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "تم ربط حسابك.", exact: true }),
  ).toBeVisible();
});
