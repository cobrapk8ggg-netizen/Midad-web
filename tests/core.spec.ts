import { test, expect } from "@playwright/test";
import fs from "node:fs";
const creds = JSON.parse(
  fs.readFileSync(
    process.env.E2E_CREDENTIALS_FILE ||
      "/workspace/scratch/qa-credentials.json",
    "utf8",
  ),
);
test("Arabic author journey, revisions, offline recovery and responsive screens", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "عد إلى حكايتك." }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/auth-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("البريد الإلكتروني").fill(creds.emailA);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "دخول إلى مِداد" }).click();
  await expect(
    page.getByRole("button", { name: "رواية جديدة", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/library-empty.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "رواية جديدة", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("أطلس الغياب");
  await page
    .getByLabel("عن الحكاية (اختياري)")
    .fill("رواية عن الذاكرة والمدن التي تسكننا");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();

  await page.getByRole("button", { name: "فصل جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("حين نامت المدينة");
  await page.getByRole("button", { name: "حفظ ومتابعة" }).click();
  const editor = page.getByRole("textbox", { name: "نص الفصل" });
  await expect(editor).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/editor-empty.png",
    fullPage: true,
  });
  const prose =
    "في آخر الليل، كانت المدينة تُصغي إلى وقع خطواته. لم يكن يعرف أن الرسالة التي حملها ستغيّر مصير الجميع. MIDAD 2026 — حكاية لا تنتهي.\n";
  await editor.fill(prose.repeat(180));
  await expect(
    page.getByRole("status").filter({ hasText: "محفوظ في حسابك" }),
  ).toBeVisible({ timeout: 20000 });
  await page.screenshot({
    path: "docs/screenshots/editor-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "وضع التركيز", exact: true }).click();
  await expect(editor).toContainText("المدينة");
  await page.screenshot({ path: "docs/screenshots/focus.png", fullPage: true });
  await page.getByRole("button", { name: "مغادرة التركيز" }).click();
  await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "دخول إلى مِداد" }),
  ).toBeVisible();
  await page.getByLabel("البريد الإلكتروني").fill(creds.emailA);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "دخول إلى مِداد" }).click();
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await page.getByRole("button", { name: "إدارة الفصول" }).waitFor();
  await expect(editor).toContainText("المدينة");
  expect((await editor.innerText()).length).toBeGreaterThan(20000);
  await page.getByRole("button", { name: "الشخصيات", exact: true }).click();
  await page.getByRole("button", { name: "شخصية جديدة" }).click();
  await page.getByLabel("الاسم", { exact: true }).fill("ليلى");
  await page
    .getByLabel("الوصف", { exact: true })
    .fill("تجمع خرائط المدن المنسية.");
  await page.getByLabel("الخلفية والمظهر").fill("نشأت قرب البحر.");
  await page.getByLabel("الأهداف والدوافع").fill("العثور على أخيها.");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ليلى" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/world.png", fullPage: true });
  await page.getByRole("button", { name: "الأحداث", exact: true }).click();
  await page.getByRole("button", { name: "حدث جديد", exact: true }).click();
  await page.getByLabel("العنوان", { exact: true }).fill("وصول الرسالة");
  await page
    .getByLabel("التفاصيل", { exact: true })
    .fill("تتلقى ليلى رسالة من مدينة لم تعد موجودة.");
  await page.getByLabel("التاريخ داخل الحكاية").fill("2040-03-21");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "وصول الرسالة" }),
  ).toBeVisible();
  await page.getByLabel("حالة وصول الرسالة").selectOption("draft");
  await page.screenshot({ path: "docs/screenshots/plan.png", fullPage: true });
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("button", { name: "المكتبة", exact: true })
    .click();
  await page.screenshot({
    path: "docs/screenshots/library-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 810, height: 1080 });
  await page.screenshot({
    path: "docs/screenshots/library-ipad.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "أطلس الغياب", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "الكتابة", exact: true }).click();
  await expect(editor).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/editor-ipad.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "إظهار قائمة الفصول" }).click();
  await page.screenshot({
    path: "docs/screenshots/editor-phone.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
