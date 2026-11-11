import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
const c = JSON.parse(
  fs.readFileSync(
    process.env.E2E_CREDENTIALS_FILE ||
      "/workspace/scratch/qa-credentials.json",
    "utf8",
  ),
);
test("authentication error, notes CRUD, verified download and import preview", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("البريد الإلكتروني").fill(c.emailA);
  await page
    .getByLabel("كلمة المرور", { exact: true })
    .fill("incorrectPassword!123");
  await page.getByRole("button", { name: "دخول إلى مِداد" }).click();
  await expect(page.getByRole("status")).toContainText("غير صحيحة");
  await page.screenshot({ path: "docs/screenshots/auth-error.png" });
  await page.getByLabel("كلمة المرور", { exact: true }).fill(c.password);
  await page.getByRole("button", { name: "دخول إلى مِداد" }).click();
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "ملاحظات الرواية" }).click();
  await page.getByRole("button", { name: "ملاحظة جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("ملاحظة الاختبار");
  await page
    .getByLabel("التفاصيل", { exact: true })
    .fill("فكرة محفوظة لاختبار الإعادة");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "ملاحظة الاختبار" }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "تحرير", exact: true })
    .first()
    .click();
  await page.getByLabel("التفاصيل", { exact: true }).fill("فكرة بعد التحرير");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(
    page.getByText("فكرة بعد التحرير", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "التصدير", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/publish.png" });
  await page.getByLabel("تنسيق الملف").selectOption("epub");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل المخطوطة" }).click();
  const download = await downloadPromise;
  const bytes = fs.readFileSync((await download.path())!);
  const zip = unzipSync(bytes);
  expect(strFromU8(zip["OEBPS/c0.xhtml"])).toContain("المدينة");
  await page.getByLabel("ملف الاستيراد").setInputFiles({
    name: "رسالة.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("رسالة عربية جديدة\n\nفقرة ثانية مع English 2026."),
  });
  await expect(page.getByLabel("معاينة النص وتحريره")).toContainText(
    "رسالة عربية جديدة",
  );
  await page.getByRole("button", { name: "إضافة النص إلى الرواية" }).click();
  await expect(page.getByRole("status")).toContainText("أُضيف النص");
});
