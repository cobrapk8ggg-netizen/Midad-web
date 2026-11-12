"use client";
import { useState } from "react";
import {
  Feather,
  Plus,
  BookOpen,
  Users,
  UserRound,
  Waypoints,
  FileText,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { update } from "../lib/supabase";
import type { Project, Chapter, Scene } from "../lib/types";
import { errorMessage } from "./ui";
import { Sharing } from "./Platform";
import { countWords } from "../lib/words";
import { PrivateImage } from "./Assets";
export default function NovelHome({
  project,
  chapters,
  scenes,
  guest,
  onSaved,
  onError,
  onCreate,
  onChapter,
  onNavigate,
  onSettings,
  onManage,
}: {
  project: Project;
  chapters: Chapter[];
  scenes: Scene[];
  guest: boolean;
  onSaved: (p: Project) => void;
  onError: (s: string) => void;
  onCreate: () => void;
  onChapter: (c: Chapter) => void;
  onNavigate: (v: string) => void;
  onSettings: () => void;
  onManage: () => void;
}) {
  const [tab, setTab] = useState("chapters"),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const owner =
      project.access_role !== "reader" && project.access_role !== "editor",
    canWrite = project.access_role !== "reader";
  return (
    <main className="novel-home">
      <header className="novel-hero">
        <div className="novel-cover">
          <PrivateImage path={project.cover_path} className="cover-art" />
          <Feather size={35} />
          <h2>{project.title}</h2>
          <small>رواية في مِداد</small>
        </div>
        <div className="novel-intro">
          <p className="eyebrow">
            {owner
              ? "روايتك، من أول فكرة إلى آخر فصل"
              : project.access_role === "editor"
                ? "تكتبها مع صديقك"
                : "رواية شاركها معك صديقك"}
          </p>
          <h1>{project.title}</h1>
          <p>
            {project.description ||
              "لكل رواية بداية. ضع فكرتها هنا وابدأ الفصل الأول."}
          </p>
          <div className="novel-meta">
            <span>{chapters.length.toLocaleString("ar")} فصل</span>
            <span>
              {scenes
                .reduce((n, s) => n + countWords(s.plain_text), 0)
                .toLocaleString("ar")}{" "}
              كلمة
            </span>
            <span>
              {owner
                ? "خاصة حتى تختار مشاركتها"
                : project.access_role === "editor"
                  ? "صلاحية كتابة الفصول"
                  : "صلاحية قراءة الفصول"}
            </span>
          </div>
          <div className="inline-actions">
            {canWrite && (
              <button className="primary" onClick={onCreate}>
                <Plus size={17} />
                فصل جديد
              </button>
            )}
            {owner && (
              <button onClick={onSettings}>
                <Settings size={17} />
                تفاصيل الرواية وغلافها
              </button>
            )}
          </div>
        </div>
      </header>
      <div
        className="novel-tabs glass"
        role="navigation"
        aria-label="داخل الرواية"
      >
        <button
          className={tab === "chapters" ? "active" : ""}
          onClick={() => setTab("chapters")}
        >
          <BookOpen size={18} />
          الفصول
        </button>
        <button
          className={tab === "story" ? "active" : ""}
          onClick={() => setTab("story")}
        >
          <Feather size={18} />
          قصة الرواية
        </button>
        {owner && !guest && (
          <button
            className={tab === "sharing" ? "active" : ""}
            onClick={() => setTab("sharing")}
          >
            <Users size={18} />
            المشاركة والقراءة
          </button>
        )}
        {owner && (
          <button
            className={tab === "tools" ? "active" : ""}
            onClick={() => setTab("tools")}
          >
            <FileText size={18} />
            أدوات تساعدك
          </button>
        )}
      </div>
      {tab === "chapters" ? (
        <div className="novel-chapter-layout">
          <section className="novel-chapters">
            <div className="section-heading">
              <h2>الفصول</h2>
              {canWrite && (
                <button onClick={onManage}>ترتيب الفصول وتعديل أسمائها</button>
              )}
            </div>
            <p className="muted">
              اكتب كل فصل كاملًا. تقسيمه إلى مشاهد خيار إضافي؛ تُجمع المشاهد
              بالترتيب في القراءة والتصدير.
            </p>
            {chapters.map((c, i) => (
              <button
                className="novel-chapter-row"
                key={c.id}
                onClick={() => onChapter(c)}
              >
                <span className="chapter-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{c.title}</h3>
                  <small>
                    {scenes
                      .filter((s) => s.chapter_id === c.id)
                      .reduce((n, s) => n + countWords(s.plain_text), 0)
                      .toLocaleString("ar")}{" "}
                    كلمة ·{" "}
                    {c.writing_mode === "scenes"
                      ? "مقسّم إلى مشاهد"
                      : "فصل كامل"}
                  </small>
                </div>
                <span>{canWrite ? "فتح الفصل" : "قراءة الفصل"}</span>
                <ArrowLeft size={18} />
              </button>
            ))}
            {!chapters.length && (
              <div className="novel-empty">
                <BookOpen size={40} />
                <h2>فصلك الأول ينتظرك.</h2>
                <p>
                  اختر عنوانًا وابدأ الكتابة مباشرة. لا تحتاج إلى إنشاء كتاب أو
                  مشاهد.
                </p>
                {canWrite && (
                  <button className="primary" onClick={onCreate}>
                    <Plus size={17} />
                    اكتب الفصل الأول
                  </button>
                )}
              </div>
            )}
          </section>
          <aside className="novel-story-preview glass">
            <Feather size={24} />
            <p className="eyebrow">الفكرة التي بدأت منها الحكاية</p>
            <h2>قصة الرواية</h2>
            <p>
              {project.story
                ? project.story.slice(0, 450) +
                  (project.story.length > 450 ? "…" : "")
                : "اكتب الفكرة العامة لروايتك. عمّن تتحدث؟ وما الرحلة التي تنتظر بطلها؟"}
            </p>
            <button onClick={() => setTab("story")}>
              {owner ? "كتابة قصة الرواية" : "قراءة قصة الرواية"}
              <ArrowLeft size={16} />
            </button>
          </aside>
        </div>
      ) : tab === "story" ? (
        <form
          className="novel-story"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!owner) return;
            setBusy(true);
            setSaved(false);
            try {
              const story = String(
                new FormData(e.currentTarget).get("story") || "",
              );
              await update("projects", project.id, { story });
              onSaved({ ...project, story });
              setSaved(true);
            } catch (e) {
              onError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>قصة الرواية</h2>
          <p className="muted">
            الفكرة العامة: عمّن تتحدث روايتك؟ ماذا يريد بطلها؟ وما الذي يقف في
            طريقه؟ هذه المساحة لك، ولا تُنشر مع الفصول.
          </p>
          <label className="field">
            قصة {project.title}
            <textarea
              key={project.id}
              name="story"
              defaultValue={project.story || ""}
              placeholder="اكتب الفكرة كما تراها…"
              rows={12}
              readOnly={!owner}
            />
          </label>
          {owner && (
            <button className="primary" disabled={busy}>
              {busy
                ? "جارٍ الحفظ…"
                : saved
                  ? "تم حفظ قصة الرواية"
                  : "حفظ قصة الرواية"}
            </button>
          )}
        </form>
      ) : tab === "sharing" ? (
        <Sharing project={project} chapters={chapters} onError={onError} />
      ) : (
        <section className="novel-tools">
          <h2>استخدم ما تحتاجه فقط.</h2>
          <p className="muted">
            هذه أدوات اختيارية لتتذكّر تفاصيل روايتك. يمكنك كتابة رواية كاملة دون
            استخدامها.
          </p>
          {[
            {
              v: "world",
              icon: UserRound,
              title: "الشخصيات والأماكن",
              body: "من هو بطلك؟ كيف يبدو؟ وأين تجري القصة؟ احتفظ بالتفاصيل هنا لتعود إليها أثناء الكتابة.",
            },
            {
              v: "plan",
              icon: Waypoints,
              title: "أحداث الرواية",
              body: "رتّب ما سيحدث: بداية المشكلة، تصاعدها، ثم نتيجتها. يمكنك ربط الحدث بجزء من الفصل أو تركه فكرة مستقلة.",
            },
            {
              v: "notes",
              icon: FileText,
              title: "ملاحظاتي",
              body: "دوّن فكرة عابرة أو حوارًا أو تفاصيل لا تريد نسيانها. لا تظهر للقراء أو المشاركين.",
            },
            {
              v: "publish",
              icon: BookOpen,
              title: "نقل الرواية وتصديرها",
              body: "استورد نصوصك أو نزّل فصولك في ملف واحد. المشاهد الاختيارية تُجمع داخل فصلها بالترتيب.",
            },
          ].map((t) => (
            <button
              className="novel-tool-card glass"
              key={t.v}
              onClick={() => onNavigate(t.v)}
            >
              <t.icon size={26} />
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              <span>
                فتح الأداة <ArrowLeft size={16} />
              </span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
