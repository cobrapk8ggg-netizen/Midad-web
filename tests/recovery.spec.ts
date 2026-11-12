import { test, expect } from "@playwright/test";
import fs from "node:fs";
const c = JSON.parse(
  fs.readFileSync(
    process.env.E2E_CREDENTIALS_FILE ||
      "/workspace/scratch/qa-credentials.json",
    "utf8",
  ),
);
async function login(page: any) {
  await page.goto("/");
  await page.getByLabel("البريد الإلكتروني").fill(c.emailA);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page.getByRole("button", { name: "دخول إلى مِداد" }).click();
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "نص الفصل" })).toBeVisible();
}
test("offline draft survives reload and history restores protected current version", async ({
  page,
  context,
}) => {
  await login(page);
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  await editor.press("ControlOrMeta+End");
  await editor.press("Enter");
  await editor.pressSequentially("نسخة قبل الانقطاع");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await context.setOffline(true);
  await editor.press("ControlOrMeta+End");
  await editor.press("Enter");
  await editor.pressSequentially("مسودة محلية محفوظة أثناء انقطاع الشبكة");
  await expect(
    page.getByRole("status").filter({ hasText: "تعذر الحفظ" }),
  ).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: "docs/screenshots/save-offline.png" });
  await context.setOffline(false);
  await page.reload();
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "نص الفصل" })).toBeVisible();
  const restore = page.getByRole("button", {
    name: "استعادة المسودة",
    exact: true,
  });
  if (await restore.isVisible()) {
    await restore.click();
  }
  await expect(editor).toContainText("مسودة محلية محفوظة");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "النسخ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "سجل النسخ" })).toBeVisible();
  await page
    .locator(".revision-list button")
    .filter({ hasText: /نسخة [١1] ·/ })
    .first()
    .click();
  await page.screenshot({ path: "docs/screenshots/history.png" });
  await page.getByRole("button", { name: "استعادة هذه النسخة" }).click();
  await expect(
    page.getByRole("heading", { name: "سجل النسخ" }),
  ).not.toBeVisible();
  await expect(editor).toContainText("المدينة");
  await expect(editor).not.toContainText("مسودة محلية محفوظة");
});
test("second tab edit is rejected without overwriting newer manuscript", async ({
  page,
  context,
}) => {
  await login(page);
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await second.getByRole("button", { name: "الكتابة", exact: true }).click();
  const e1 = page.getByRole("textbox", { name: "نص الفصل" }),
    e2 = second.getByRole("textbox", { name: "نص الفصل" });
  await expect(e2).toBeVisible();
  await e1.press("ControlOrMeta+End");
  await e1.press("Enter");
  await e1.pressSequentially("النص الأحدث من الجلسة الأولى");
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible();
  await e2.press("ControlOrMeta+End");
  await e2.press("Enter");
  await e2.pressSequentially("تعديل الجلسة الثانية المتأخر");
  await expect(
    second.getByRole("status").filter({ hasText: "توجد نسخة أحدث" }),
  ).toBeVisible({ timeout: 15000 });
  await second.screenshot({ path: "docs/screenshots/save-conflict.png" });
  await page.reload();
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(e1).toContainText("النص الأحدث من الجلسة الأولى");
  await expect(e1).not.toContainText("تعديل الجلسة الثانية المتأخر");
});
