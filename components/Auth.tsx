"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Feather,
  ShieldCheck,
  ArrowUpLeft,
  HardDrive,
  Cloud,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Brand, Field, errorMessage } from "./ui";
import LiquidSculpture from "./LiquidSculpture";
export default function Auth({
  recovery = false,
  onGuest,
}: {
  recovery?: boolean;
  onGuest?: () => void;
}) {
  const [mode, setMode] = useState(recovery ? "new" : "login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    try {
      if (mode === "signup") {
        const response = await fetch(
          process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/midad-signup",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify({ email, password }),
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "تعذر إنشاء الحساب");
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "new") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        location.assign("/");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/?recovery=1",
        });
        if (error) throw error;
        setMessage("إذا كان البريد مسجّلًا، ستصلك رسالة استعادة.");
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth auth-v2">
      <div className="auth-grid" aria-hidden="true" />
      <header>
        <Brand />
        <span className="auth-top-note">
          <span className="status-orb" />
          مساحة مستقلة للخيال
        </span>
      </header>
      <section className="auth-stage">
        <div className="stage-heading">
          <span className="eyebrow">للأفكار التي تستحق أن تصبح عوالم</span>
          <h2>
            كلّ عالمٍ عظيم،
            <br />
            <span>كان فكرةً في رأس كاتب.</span>
          </h2>
        </div>
        <LiquidSculpture />
        <div className="stage-bottom">
          {onGuest ? (
            <button className="stage-guest" onClick={onGuest}>
              ابدأ كضيف
              <ArrowLeft size={14} />
            </button>
          ) : (
            <span>
              <Feather size={16} />
              اكتب. تخيّل. اترك أثرًا.
            </span>
          )}
          <span className="stage-line" />
          <span>مساحة لروايتك القادمة</span>
        </div>
      </section>
      <section className="auth-form auth-glass">
        <div className="glass-corner" />
        <div className="auth-form-symbol">
          <Feather size={25} />
        </div>
        <span className="eyebrow">مرحبًا بك في مِداد</span>
        <h1>
          {mode === "signup"
            ? "ابدأ حكايتك."
            : mode === "reset"
              ? "استعد مساحتك."
              : mode === "new"
                ? "بداية أكثر أمانًا."
                : "عد إلى حكايتك."}
        </h1>
        <p className="muted">
          {mode === "signup"
            ? "حسابك جاهز فورًا. بلا رسالة تأكيد."
            : "كل ما كتبته، وكل ما لم تكتبه بعد."}
        </p>
        {["login", "signup"].includes(mode) && (
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              تسجيل الدخول
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              إنشاء حساب
            </button>
          </div>
        )}
        <form onSubmit={submit}>
          {mode !== "new" && (
            <Field
              label="البريد الإلكتروني"
              name="email"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          )}
          {mode !== "reset" && (
            <div className="password">
              <Field
                label="كلمة المرور"
                name="password"
                type={show ? "text" : "password"}
                minLength={8}
                maxLength={128}
                placeholder="ثمانية أحرف على الأقل"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              <button
                type="button"
                aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode("reset");
                setMessage("");
              }}
            >
              نسيت كلمة المرور؟
            </button>
          )}
          <p role="status" className="message">
            {message}
          </p>
          <button className="primary full auth-submit" disabled={busy}>
            {busy
              ? "نفتح لك المساحة…"
              : mode === "signup"
                ? "إنشاء حساب والبدء"
                : mode === "reset"
                  ? "إرسال رابط الاستعادة"
                  : mode === "new"
                    ? "حفظ كلمة المرور"
                    : "دخول إلى مِداد"}
            <ArrowLeft size={18} />
          </button>
        </form>
        {["new", "reset"].includes(mode) && (
          <button className="full" onClick={() => setMode("login")}>
            العودة لتسجيل الدخول
          </button>
        )}
        {onGuest && (
          <>
            <div className="auth-divider">
              <span />
              أو ابدأ بالكتابة الآن
              <span />
            </div>
            <button
              aria-label="الدخول كضيف"
              className="guest-entry full"
              onClick={onGuest}
            >
              <span className="guest-icon">
                <ArrowUpLeft size={19} />
              </span>
              <span>
                <strong>الدخول كضيف</strong>
                <small>مساحة كتابة كاملة على هذا الجهاز</small>
              </span>
              <ArrowLeft size={17} />
            </button>
          </>
        )}
        <div className="auth-trust">
          <ShieldCheck size={14} />
          <span>حكاياتك ملكك. تبقى مساحتك خاصة.</span>
        </div>
      </section>
      <footer>
        <span>مِداد — حيث تأخذ الأفكار شكلها.</span>
        <span>
          <HardDrive size={13} />
          للضيف: حفظ محلي
          <Cloud size={13} />
          للحساب: حفظ سحابي
        </span>
      </footer>
    </main>
  );
}
