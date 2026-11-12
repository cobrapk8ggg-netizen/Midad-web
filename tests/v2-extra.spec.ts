import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("independent drafts, private cover and editor preferences across browser contexts", async ({
  page,
  browser,
}) => {
  test.setTimeout(150000);
  const c = JSON.parse(
    fs.readFileSync(process.env.E2E_CREDENTIALS_FILE!, "utf8"),
  );
  async function login(p: any) {
    await p.goto("/");
    await p.getByLabel("البريد الإلكتروني").fill(c.emailA);
    await p.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
    await p.getByRole("button", { name: "دخول إلى مِداد", exact: true }).click();
  }
  await login(page);
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("كتاب المرايا");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();

  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("المشهد الأصلي");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  await editor.fill("هذا النص الأصلي يجب أن يبقى دون أي تغيير.");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await page.locator(".advanced-drafts summary").click();
  await page
    .getByRole("button", { name: "نسخة بديلة جديدة", exact: true })
    .click();
  await page.getByLabel("العنوان", { exact: true }).fill("المسودة البديلة");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  await expect(
    page.getByRole("heading", { name: "مسودة جديدة", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByLabel("النسخة", { exact: true }).locator("option:checked"),
  ).toHaveText("المسودة البديلة");
  await expect(editor).toContainText("النص الأصلي");
  await editor.fill("هذا نص مختلف يخص المسودة البديلة وحدها.");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await page
    .getByLabel("النسخة", { exact: true })
    .selectOption({ label: "الفصول الأصلية" });
  await expect(editor).toContainText("هذا النص الأصلي");
  await expect(editor).not.toContainText("المسودة البديلة وحدها");
  await page
    .getByLabel("النسخة", { exact: true })
    .selectOption({ label: "المسودة البديلة" });
  await expect(editor).toContainText("المسودة البديلة وحدها");
  await page.screenshot({ path: "docs/screenshots/v2/drafts.png" });
  await page.getByRole("button", { name: "حذف النسخة البديلة" }).click();
  await page.getByRole("button", { name: "حذف نهائي", exact: true }).click();
  await expect(editor).toContainText("هذا النص الأصلي");
  await expect(
    page.getByLabel("النسخة", { exact: true }).locator("option"),
  ).toHaveCount(1);
  await page.getByLabel("تباعد السطور").focus();
  await page.getByLabel("تباعد السطور").press("End");
  await expect(page.getByLabel("تباعد السطور")).toHaveValue("3");
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  await page.getByRole("button", { name: "حفظ إعدادات المحرر" }).click();
  const other = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const p = await other.newPage();
  await login(p);
  await p
    .getByRole("button", { name: "كتاب المرايا", exact: true })
    .first()
    .click();
  await p.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(p.getByLabel("تباعد السطور")).toHaveValue("3");
  await other.close();
  await page
    .getByRole("button", { name: "إعدادات الرواية", exact: true })
    .click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6l8AAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("رفع صورة خاصة").setInputFiles({
    name: "private-cover.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByRole("heading", { name: "إعدادات الرواية", exact: true }),
  ).not.toBeVisible({ timeout: 20000 });
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("button", { name: "المكتبة", exact: true })
    .click();
  const item = page.locator(".book-item").filter({
    has: page.getByRole("heading", { name: "كتاب المرايا", exact: true }),
  });
  await expect(item.locator("img.cover-art")).toBeVisible();
  await expect
    .poll(() =>
      item
        .locator("img.cover-art")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await item
    .getByRole("button", { name: "كتاب المرايا", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await page
    .getByRole("button", { name: "إعدادات الرواية", exact: true })
    .click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "حذف الصورة", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "إعدادات الرواية", exact: true }),
  ).not.toBeVisible();
});
