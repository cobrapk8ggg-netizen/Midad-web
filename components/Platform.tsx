"use client";
import { useEffect, useState } from "react";
import {
  UserRound,
  Users,
  Link2,
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Globe,
  FileText,
} from "lucide-react";
import { list, supabase, update } from "../lib/supabase";
import { Field, errorMessage } from "./ui";
import type { Project, Chapter, Scene } from "../lib/types";
type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  is_public: boolean;
};
type App = {
  id: string;
  site_url: string;
  project_id: string | null;
  allow_write: boolean;
};
type Member = {
  member_id: string;
  role: string;
  username: string;
  display_name: string;
};
export function Sharing({
  project,
  chapters,
  onError,
}: {
  project: Project;
  chapters: Chapter[];
  onError: (s: string) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]),
    [published, setPublished] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await supabase.rpc("midad_project_members", { pid: project.id });
    if (r.error) throw r.error;
    setMembers(r.data || []);
    const { data, error } = await supabase
      .from("midad_publications")
      .select("chapter_id")
      .in(
        "chapter_id",
        chapters.map((c) => c.id),
      );
    if (error) throw error;
    setPublished(data?.map((x) => x.chapter_id) || []);
  }
  useEffect(() => {
    void load().catch((e) => onError(errorMessage(e)));
  }, [project.id, chapters.length]);
  return (
    <section className="novel-sharing">
      <div className="section-heading">
        <Users size={22} />
        <h2>اكتبها مع صديق</h2>
      </div>
      <p className="muted">
        يحتاج صديقك إلى حساب واسم مستخدم من «حسابي». تظهر الرواية في مكتبته بعد
        إضافته. المشاركة تشمل الفصول؛ ملاحظاتك وتخطيطك تبقى خاصة بك.
      </p>
      <form
        className="invite-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            const r = await supabase.rpc("midad_find_profile", {
              handle: String(f.get("username")).toLowerCase().trim(),
            });
            if (r.error) throw r.error;
            const p = r.data?.[0];
            if (!p)
              throw Error(
                "لم يُعثر على هذا الاسم. اطلب من صديقك حفظ ملفه الشخصي أولًا.",
              );
            const { error } = await supabase.from("midad_members").upsert(
              {
                project_id: project.id,
                member_id: p.user_id,
                role: f.get("role"),
              },
              { onConflict: "project_id,member_id" },
            );
            if (error) throw error;
            await load();
          } catch (e) {
            onError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="اسم مستخدم صديقك" name="username" dir="ltr" required />
        <label className="field">
          الصلاحية
          <select name="role">
            <option value="reader">يقرأ الفصول فقط</option>
            <option value="editor">يكتب الفصول ويعدّلها معي</option>
          </select>
        </label>
        <button className="primary" disabled={busy}>
          <Plus size={17} />
          إضافة صديق
        </button>
      </form>
      {members.map((m) => (
        <div className="member-row" key={m.member_id}>
          <div>
            <strong>{m.display_name || m.username || "كاتب مشارك"}</strong>
            <small dir="ltr">@{m.username}</small>
          </div>
          <label className="field">
            الصلاحية
            <select
              aria-label={"صلاحية " + m.username}
              value={m.role}
              onChange={async (e) => {
                const { error } = await supabase
                  .from("midad_members")
                  .update({ role: e.target.value })
                  .eq("project_id", project.id)
                  .eq("member_id", m.member_id);
                if (error) onError(errorMessage(error));
                else await load();
              }}
            >
              <option value="reader">قراءة</option>
              <option value="editor">كتابة</option>
            </select>
          </label>
          <button
            aria-label={"إزالة " + m.username}
            onClick={async () => {
              const { error } = await supabase
                .from("midad_members")
                .delete()
                .eq("project_id", project.id)
                .eq("member_id", m.member_id);
              if (error) onError(errorMessage(error));
              else await load();
            }}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <p className="help-callout">
        إذا عدّلتما الفصل نفسه معًا، يحمي الحفظ النسخة الأحدث ويطلب من صاحب النسخة
        الأقدم مراجعة التغييرات. لا توجد مؤشرات تحرير لحظية مشتركة بعد.
      </p>
      <div className="section-heading">
        <Globe size={22} />
        <h2>فصول أختار نشرها للقراءة</h2>
      </div>
      <p className="muted">
        هذه الفصول فقط ستظهر في صفحة «للقراءة» عبر رابط عام. إلغاء النشر يخفي
        الفصل فورًا. لا تُنشر المسودات البديلة أو الملاحظات.
      </p>
      {chapters
        .filter((c) => !c.draft_id)
        .map((c) => (
          <label className="publication-row" key={c.id}>
            <input
              type="checkbox"
              checked={published.includes(c.id)}
              onChange={async (e) => {
                const enabled = e.target.checked;
                const previous = published;
                setBusy(true);
                setPublished((xs) =>
                  enabled ? [...xs, c.id] : xs.filter((id) => id !== c.id),
                );
                try {
                  const r = enabled
                    ? await supabase
                        .from("midad_publications")
                        .insert({ chapter_id: c.id, user_id: project.user_id })
                    : await supabase
                        .from("midad_publications")
                        .delete()
                        .eq("chapter_id", c.id);
                  if (r.error) throw r.error;
                  await load();
                } catch (e) {
                  setPublished(previous);
                  onError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            />
            <FileText size={17} />
            {c.title}
            <small>
              {busy
                ? "جارٍ تحديث النشر…"
                : published.includes(c.id)
                  ? "منشور للقراءة"
                  : "خاص"}
            </small>
          </label>
        ))}
      {!busy && published.length > 0 && (
        <a
          className="primary"
          href={"/read?novel=" + project.id}
          target="_blank"
          rel="noreferrer"
        >
          افتح رابط القراءة <ArrowLeft size={17} />
        </a>
      )}
    </section>
  );
}
export type PublishedNovel = {
  id: string;
  title: string;
  description: string;
  author_name: string;
  author_username: string;
  chapter_count: number;
};

export { default as ChapterText } from "./ChapterText";
export { default as PublicReader } from "./EnhancedReader";
export { Account, PublicProfile } from "./WriterProfile";
export { Community } from "./Discover";
