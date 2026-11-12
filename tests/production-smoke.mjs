import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const url = process.env.BASE_URL || "https://midad-writing.vercel.app";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url);
await page.getByRole("button", { name: "الدخول كضيف", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: "docs/screenshots/v2/production-auth.png",
  fullPage: true,
});
await page.getByRole("button", { name: "الدخول كضيف", exact: true }).click();
await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
await page.getByLabel("العنوان", { exact: true }).fill("اختبار مِداد المنشور");
await page.getByRole("button", { name: "حفظ ومتابعة" }).click();

await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
await page.getByLabel("العنوان", { exact: true }).fill("الفصل الأول");
await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
const editor = page.getByRole("textbox", { name: "نص الفصل" });
const prose =
  "في هذا العالم الجديد، كانت الكلمات تفتح نوافذ الضوء. تحقق عربي حقيقي من الرابط المنشور.\n";
await editor.fill(prose.repeat(80));
await expect(
  page.getByRole("status").filter({ hasText: "محفوظ على هذا الجهاز" }),
).toBeVisible();
await page.reload();
await page
  .getByRole("button", { name: "اختبار مِداد المنشور", exact: true })
  .first()
  .click();
await page.getByRole("button", { name: "الكتابة", exact: true }).click();
await expect(editor).toContainText("نوافذ الضوء");
await page.getByRole("button", { name: "أنشئ حسابًا لحفظها سحابيًا" }).click();
await page.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
const email = "midad.v2.production." + Date.now() + "@gmail.com",
  password = "Midad!" + crypto.randomUUID();
fs.writeFileSync(
  "/workspace/scratch/v2-production-account.json",
  JSON.stringify({ email, password }),
  { mode: 0o600 },
);
await page.getByLabel("البريد الإلكتروني").fill(email);
await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
await page
  .getByRole("button", { name: "إنشاء حساب والبدء", exact: true })
  .click();
await page
  .getByRole("button", { name: "نقل أعمال الضيف إلى حسابي" })
  .waitFor({ timeout: 30000 });
await page.getByRole("button", { name: "نقل أعمال الضيف إلى حسابي" }).click();
await expect(page.locator(".book-item")).toHaveCount(1, { timeout: 90000 });
await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
await page.getByLabel("البريد الإلكتروني").fill(email);
await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
await page.getByRole("button", { name: "دخول إلى مِداد", exact: true }).click();
await page
  .getByRole("button", { name: "اختبار مِداد المنشور", exact: true })
  .first()
  .click();
await page.getByRole("button", { name: "الكتابة", exact: true }).click();
await expect(editor).toContainText("نوافذ الضوء");
await editor.press("ControlOrMeta+End");
await editor.press("Enter");
await editor.pressSequentially("تعديل سحابي بعد نقل الضيف وتسجيل الدخول.");
await expect(
  page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
).toBeVisible();
await page.reload();
await page
  .getByRole("button", { name: "اختبار مِداد المنشور", exact: true })
  .first()
  .click();
await page.getByRole("button", { name: "الكتابة", exact: true }).click();
await expect(editor).toContainText("تعديل سحابي بعد نقل الضيف");
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: "docs/screenshots/v2/production-editor.png" });
await page.setViewportSize({ width: 390, height: 844 });
if (await page.locator(".binder").isVisible())
  await page.getByRole("button", { name: "إظهار قائمة الفصول" }).click();
if (await page.locator(".context-panel").isVisible())
  await page.getByRole("button", { name: "إظهار التفاصيل" }).click();
await page.screenshot({ path: "docs/screenshots/v2/production-phone.png" });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
const result = {
  url,
  date: new Date().toISOString(),
  guest: true,
  localReload: true,
  signupWithoutEmail: true,
  guestTransfer: true,
  login: true,
  cloudSaveAndReload: true,
  phoneOverflow: overflow,
  pageErrors: errors,
};
if (errors.length || overflow) throw new Error(JSON.stringify(result));
fs.writeFileSync(
  "docs/v2-production-results.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
await browser.close();
