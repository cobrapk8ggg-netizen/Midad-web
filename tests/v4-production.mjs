import fs from "node:fs";
import { chromium } from "@playwright/test";
const c = JSON.parse(
    fs.readFileSync("/tmp/midad-e2e-credentials.json", "utf8"),
  ),
  f = JSON.parse(fs.readFileSync("/tmp/midad-v4-fixture.json", "utf8"));
const base = process.env.BASE_URL || "https://midad-writing.vercel.app",
  browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  }),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  p = await context.newPage();
const errors = [],
  checks = [];
p.on("pageerror", (e) => errors.push(e.message));
const check = (name, v) => {
  if (!v) throw Error(name);
  checks.push(name);
};
const login = async (page, email) => {
  await page.goto(base);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page
    .getByRole("button", { name: "دخول إلى مِداد", exact: true })
    .click();
  await page
    .getByRole("button", { name: "رواية جديدة", exact: true })
    .waitFor();
};
try {
  await login(p, c.emailA);
  await p.locator(".avatar>img").waitFor();
  check(
    "Account photo visible in main navigation",
    await p.locator(".avatar>img").evaluate((i) => i.naturalWidth > 0),
  );
  await p.getByRole("button", { name: "حسابي", exact: true }).click();
  await p.locator(".writer-identity h1").waitFor();
  check(
    "Real profile identity survives login",
    (await p.locator(".writer-identity h1").innerText()) === "ليان السامر",
  );
  await p
    .locator(".account-topline")
    .getByRole("button", { name: "تعديل الملف", exact: true })
    .click();
  await p
    .getByLabel("كلمات تعرّف بك", { exact: true })
    .fill("أكتب لأجد أبوابًا لم تُفتح بعد.");
  await p
    .getByRole("button", { name: "حفظ الملف الشخصي", exact: true })
    .click();
  await p
    .getByRole("status")
    .filter({ hasText: "تم حفظ ملفك ورف رواياتك." })
    .waitFor();
  check("Published build saves real profile", true);
  await p.getByRole("button", { name: "المكتبة", exact: true }).click();
  const title = "تحقق النسخة المنشورة " + Date.now();
  await p.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await p.getByLabel("العنوان", { exact: true }).fill(title);
  await p.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await p.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await p.getByLabel("العنوان", { exact: true }).fill("الباب الأول");
  await p.getByRole("button", { name: "حفظ ومتابعة" }).click();
  let e = p.getByRole("textbox", { name: "نص الفصل" });
  await e.fill(
    "هذه فقرة عربية حقيقية من اختبار النشر. تبقى محفوظة بعد الخروج والدخول. MIDAD 2026.",
  );
  await e.press("Control+A");
  await p.getByLabel("خط النص المحدد", { exact: true }).selectOption("Cairo");
  await p.getByLabel("حجم النص المحدد", { exact: true }).selectOption("28px");
  await p.getByRole("status").filter({ hasText: "محفوظ في حسابك" }).waitFor();
  await p.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await login(p, c.emailA);
  await p.getByRole("button", { name: title, exact: true }).first().click();
  await p.locator(".novel-chapter-row").first().click();
  e = p.getByRole("textbox", { name: "نص الفصل" });
  await e.locator('span[style*="font-family: Cairo"]').first().waitFor();
  check(
    "Cloud chapter and selected font survive logout login",
    (await e.innerText()).includes("محفوظة بعد الخروج"),
  );
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: "docs/screenshots/v4/production-editor.png" });
  await p.setViewportSize({ width: 390, height: 844 });
  if (await p.locator(".binder").isVisible())
    await p
      .getByRole("button", { name: "إظهار قائمة الفصول", exact: true })
      .click();
  if (await p.locator(".context-panel").isVisible())
    await p
      .getByRole("button", { name: "إظهار التفاصيل", exact: true })
      .click();
  check(
    "Production editor has no horizontal overflow at phone size",
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.screenshot({
    path: "docs/screenshots/v4/production-editor-phone.png",
  });
  const anon = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    r = await anon.newPage();
  r.on("pageerror", (e) => errors.push(e.message));
  await r.goto(base + "/profile?username=" + f.handle);
  await r.locator(".writer-portrait img").waitFor();
  await r.waitForFunction(
    () => document.querySelector(".writer-portrait img")?.naturalWidth > 100,
  );
  check("Anonymous visitors load explicitly public avatar", true);
  check(
    "Only two chosen novels appear",
    (await r.locator(".novel-discovery-grid .discovery-novel").count()) === 2,
  );
  check(
    "Unchosen published novel absent from author shelf",
    !(await r.locator(".novel-discovery-grid").innerText()).includes(
      "ريش من زجاج",
    ),
  );
  await r.evaluate(() => document.fonts.ready);
  await r.screenshot({
    path: "docs/screenshots/v4/production-profile.png",
    fullPage: true,
  });
  for (const size of [
    { width: 1080, height: 810 },
    { width: 810, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    await r.setViewportSize(size);
    check(
      "Production profile width " + size.width,
      await r.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await r.screenshot({
    path: "docs/screenshots/v4/production-profile-phone.png",
    fullPage: true,
  });
  await r.goto(base + "/novel?id=" + f.teaser);
  await r
    .getByRole("heading", { name: "الحكاية تتكوّن على مهل.", exact: true })
    .waitFor();
  check(
    "Showcase teaser does not publish private chapter",
    (await r
      .getByRole("link", { name: "ابدأ القراءة", exact: true })
      .count()) === 0,
  );
  await r.goto(base + "/read?novel=" + f.novel);
  await r.locator(".chapter-reading").waitFor();
  check(
    "Published reader loads actual Arabic chapter",
    (await r.locator(".chapter-reading").innerText()).includes("المدينة"),
  );
  await anon.close();
  const reader = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  reader.on("pageerror", (e) => errors.push(e.message));
  await login(reader, c.emailB);
  await reader.goto(base + "/novel?id=" + f.novel);
  await reader
    .getByRole("button", { name: "تقييم 3 من 5", exact: true })
    .click();
  await reader.waitForFunction(
    () =>
      document
        .querySelector('button[aria-label="تقييم 3 من 5"]')
        ?.getAttribute("aria-pressed") === "true",
  );
  check("Rating updates from published build", true);
  await reader.goto(base + "/discover");
  await reader
    .getByRole("button", { name: "الترتيب العام", exact: true })
    .click();
  await reader.locator(".novel-rank").first().waitFor();
  check("Global MIDAD ranking lists rated novels", true);
  await reader
    .getByRole("button", { name: "قائمة قراءتي", exact: true })
    .click();
  await reader
    .getByRole("heading", { name: "ريش من زجاج", exact: true })
    .waitFor();
  check("Private reading list survives new login", true);
  await reader.close();
  check("No page errors during production journeys", errors.length === 0);
  const result = {
    date: new Date().toISOString(),
    base,
    passed: checks.length,
    checks,
    pageErrors: errors,
  };
  fs.writeFileSync(
    "docs/v4-production-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
