import "./globals.css";
import "./liquid.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "مِداد — مساحة لروايتك",
  description: "مساحة عربية للكتابة وبناء العوالم",
  manifest: "/manifest.webmanifest",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
