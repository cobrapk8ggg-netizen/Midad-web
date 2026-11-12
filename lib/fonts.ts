export const FONT_OPTIONS = [
  {
    id: "amiri",
    family: "Amiri",
    name: "أميري",
    description: "حكايات بطابع أدبي",
  },
  {
    id: "naskh",
    family: "Noto Naskh Arabic",
    name: "نوتو نسخ",
    description: "قراءة عربية طويلة",
  },
  { id: "cairo", family: "Cairo", name: "القاهرة", description: "واضح ومعاصر" },
  {
    id: "tajawal",
    family: "Tajawal",
    name: "تجوال",
    description: "خفيف ومريح",
  },
  {
    id: "plex",
    family: "Plex",
    name: "IBM Plex عربي",
    description: "متوازن ودقيق",
  },
  {
    id: "system",
    family: "Arial",
    name: "خط النظام",
    description: "بسيط وسريع",
  },
] as const;
export const fontFamily = (id: string) =>
  FONT_OPTIONS.find((f) => f.id === id)?.family || "Amiri";
export const safeFont = (value: unknown) =>
  FONT_OPTIONS.some((f) => f.family === value) ? String(value) : null;
export const safeColor = (v: unknown) =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
export const safeLink = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
