"use client";
import { useEffect, useState } from "react";
import { supabase, list } from "../lib/supabase";
import type { Project } from "../lib/types";
import Auth from "./Auth";
import { Brand, errorMessage } from "./ui";
import { ShieldCheck, Link2 } from "lucide-react";
export default function Connect() {
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [user, setUser] = useState<string | null>(null),
    [ready, setReady] = useState(false),
    [request, setRequest] = useState(""),
    [details, setDetails] = useState<{
      requester_email: string;
      site_url: string;
    } | null>(null),
    [novels, setNovels] = useState<Project[]>([]),
    [novel, setNovel] = useState(""),
    [write, setWrite] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setRequest(new URLSearchParams(location.search).get("request") || "");
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user?.id || null);
      setEmail(data.user?.email || "");
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_, s) => {
      setUser(s?.user.id || null);
      setEmail(s?.user.email || "");
      setDetails(null);
      setNovel("");
      setError("");
      setDone(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user || !request) return;
    void (async () => {
      const { data, error } = await supabase.rpc("midad_bridge_link_details", {
        request_nonce: request,
      });
      if (error) {
        setError(errorMessage(error));
        return;
      }
      if (!data?.[0]) {
        setError("انتهت صلاحية الرابط أو استُخدم. اطلب رابطًا جديدًا من ChatGPT.");
        return;
      }
      setDetails(data[0]);
      setNovels(
        (await list<Project>("projects")).filter((p) => p.user_id === user),
      );
    })().catch((e) => setError(errorMessage(e)));
  }, [user, request]);
  if (!ready)
    return (
      <main className="loading">
        <Brand />
      </main>
    );
  if (!user) return <Auth />;
  return (
    <main className="connect-page">
      <Brand />
      <section className="permission-panel glass">
        <Link2 size={32} />
        <p className="eyebrow">مِداد × ChatGPT</p>
        <h1>
          {done ? "تم ربط حسابك." : "أنت تختار ما يستطيع مساعدك الوصول إليه."}
        </h1>
        {done ? (
          <>
            <p>
              ارجع إلى المحادثة واطلب عرض حسابات مِداد المرتبطة، ثم اختر الحساب
              ورواياته. يمكنك إلغاء الربط من «حسابي» في أي وقت.
            </p>
            <a className="primary" href="/">
              العودة إلى مِداد
            </a>
          </>
        ) : (
          <>
            <p>
              سيقرأ المساعد الرواية التي تختارها. تفعيل الكتابة يسمح له بإنشاء
              الفصول وتعديل نصوصها وقصة الرواية. لا يسمح له بالنشر أو حذف
              رواياتك.
            </p>
            <div className="midad-account-choice">
              <strong>حساب مِداد الذي ستربطه</strong>
              <p dir="ltr">{email}</p>
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) setError(errorMessage(error));
                }}
              >
                استخدام حساب مِداد آخر
              </button>
              <p className="muted">
                يمكن أن يختلف بريد مِداد عن بريد ChatGPT. يمكنك ربط عدة حسابات
                وإعطاء كل حساب اسمًا.
              </p>
            </div>
            {details && (
              <>
                <div className="permission-identity">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>حساب ChatGPT الطالب للربط</strong>
                    <p dir="ltr">
                      {details.requester_email || "حساب موثّق عبر ChatGPT"}
                    </p>
                    <small dir="ltr">{details.site_url}</small>
                  </div>
                </div>
                <label className="field">
                  اسم يميّز هذا الحساب في ChatGPT
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    maxLength={80}
                    placeholder="مثال: حسابي الرئيسي أو حساب الروايات المشتركة"
                  />
                </label>
                <label className="field">
                  نطاق الوصول
                  <select
                    value={novel}
                    onChange={(e) => setNovel(e.target.value)}
                  >
                    <option value="">
                      جميع رواياتي — يشمل إنشاء روايات جديدة
                    </option>
                    {novels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={write}
                    onChange={(e) => setWrite(e.target.checked)}
                  />
                  أسمح بكتابة الفصول وتعديل بيانات الرواية
                </label>
                <p className="muted">
                  اترك الخيار مغلقًا للقراءة فقط. الروابط الخاصة لا تُنشر للآخرين.
                </p>
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const { error } = await supabase.rpc(
                        "midad_bridge_authorize",
                        {
                          request_nonce: request,
                          novel_id: novel || null,
                          write_access: write,
                          account_label: label.trim() || email,
                        },
                      );
                      if (error) throw error;
                      setDone(true);
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "جارٍ الربط…" : "موافقة وربط الحساب"}
                </button>
              </>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
