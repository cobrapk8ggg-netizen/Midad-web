"use client";
import { useEffect, useState } from "react";
import { Download, Upload, BookOpen } from "lucide-react";
import { list, insert } from "../lib/supabase";
import { plainDocument } from "../lib/words";
import type { Project, Book, Chapter, Scene } from "../lib/types";
import { errorMessage } from "./ui";
import type { Draft } from "../lib/drafts";
export default function Publish({
  project,
  books,
  onError,
  initialBookId,
  initialDraftId,
}: {
  initialBookId?: string;
  initialDraftId?: string | null;
  project: Project;
  books: Book[];
  onError: (s: string) => void;
}) {
  const [bookId, setBookId] = useState(initialBookId || books[0]?.id || "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId || null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState("docx");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [importText, setImportText] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => {
    if (!bookId) return;
    void (async () => {
      try {
        setDrafts(await list<Draft>("drafts", { book_id: bookId }));
        const cs = (await list<Chapter>("chapters", { book_id: bookId }))
          .filter((c) => (c.draft_id || null) === draftId)
          .sort((a, b) => a.position - b.position);
        setChapters(cs);
        setSelected(cs.map((c) => c.id));
        setTarget(cs[0]?.id || "");
        setScenes(
          (
            await Promise.all(
              cs.map((c) => list<Scene>("scenes", { chapter_id: c.id })),
            )
          ).flat(),
        );
      } catch (e) {
        onError(errorMessage(e));
      }
    })();
  }, [bookId, draftId]);
  async function exportFile() {
    setBusy(true);
    setStatus("جارٍ إعداد المخطوطة…");
    try {
      const { exportBook } = await import("../lib/export");
      const annotations = (
        await Promise.all(
          scenes
            .filter((s) => selected.includes(s.chapter_id))
            .map((s) =>
              list<{ id: string; kind: string; body: string; quote: string }>(
                "annotations",
                { scene_id: s.id },
              ).then((notes) =>
                notes.map((n) => ({ ...n, chapter_id: s.chapter_id })),
              ),
            ),
        )
      ).flat();
      const blob = await exportBook(
        project.title,
        chapters
          .filter((c) => selected.includes(c.id))
          .map((c) => ({
            title: c.title,
            notes: annotations.filter((n) => n.chapter_id === c.id),
            documents: scenes
              .filter((s) => s.chapter_id === c.id)
              .sort((a, b) => a.position - b.position)
              .map((s) => s.content),
            text: scenes
              .filter((s) => s.chapter_id === c.id)
              .sort((a, b) => a.position - b.position)
              .map((s) => s.plain_text)
              .join("\n\n"),
          })),
        format,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = project.title + "." + format;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
      setStatus("تم تجهيز الملف وتنزيله.");
    } catch (e) {
      onError(errorMessage(e));
      setStatus("تعذر التصدير.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="collection">
      <div className="collection-heading">
        <div>
          <div className="eyebrow">من المسودة إلى القارئ</div>
          <h1>حكايتك، خارج مِداد.</h1>
          <p className="muted">
            اختر الفصول، واصطحب كلماتك أينما شئت. تُجمع الحواشي والتعليقات في
            نهاية كل فصل.
          </p>
        </div>
        <BookOpen size={40} />
      </div>
      <div className="publish-grid">
        <section className="publish-panel">
          <h2>تصدير المخطوطة</h2>
          <label className="field">
            الكتاب
            <select
              value={bookId}
              onChange={(e) => {
                setBookId(e.target.value);
                setDraftId(null);
              }}
            >
              {books.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            المسودة
            <select
              aria-label="مسودة التصدير"
              value={draftId || ""}
              onChange={(e) => setDraftId(e.target.value || null)}
            >
              <option value="">المسودة الأصلية</option>
              {drafts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <div className="chapter-checkboxes">
            {chapters.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, c.id]
                        : s.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.title}
              </label>
            ))}
          </div>
          <label className="field">
            تنسيق الملف
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="docx">Word — DOCX</option>
              <option value="epub">كتاب إلكتروني — EPUB</option>
              <option value="md">Markdown</option>
              <option value="txt">نص عادي — TXT</option>
            </select>
          </label>
          <button
            className="primary full"
            disabled={busy || !selected.length}
            onClick={() => void exportFile()}
          >
            <Download size={17} />
            تنزيل المخطوطة
          </button>
          <p role="status">{status}</p>
        </section>
        <section className="publish-panel">
          <h2>استيراد نص</h2>
          <p className="muted">
            TXT أو Markdown أو DOCX. راجع النص قبل إضافته كمشهد جديد؛ لن تُستبدل
            مشاهدك الحالية.
          </p>
          <input
            aria-label="ملف الاستيراد"
            type="file"
            accept=".txt,.md,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                onError("الحد الأقصى للملف 10 ميغابايت.");
                return;
              }
              setImportTitle(file.name.replace(/\.[^.]+$/, ""));
              void (async () => {
                try {
                  if (file.name.endsWith(".docx")) {
                    const mammoth = await import("mammoth");
                    const r = await mammoth.extractRawText({
                      arrayBuffer: await file.arrayBuffer(),
                    });
                    setImportText(r.value);
                  } else setImportText(await file.text());
                } catch (e) {
                  onError(errorMessage(e));
                }
              })();
            }}
          />
          {importText && (
            <>
              <label className="field">
                عنوان المشهد
                <input
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                />
              </label>
              <label className="field">
                معاينة النص وتحريره
                <textarea
                  aria-label="معاينة النص وتحريره"
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </label>
              <label className="field">
                إضافة إلى الفصل
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="primary full"
                disabled={!target || busy || !importTitle.trim()}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    try {
                      await insert("scenes", {
                        chapter_id: target,
                        title: importTitle,
                        content: plainDocument(importText),
                        plain_text: importText,
                        position: scenes.length,
                      });
                      setImportText("");
                      setStatus(
                        "أُضيف النص كمشهد جديد. افتح الكتاب مجددًا لقراءته.",
                      );
                    } catch (e) {
                      onError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                <Upload size={17} />
                إضافة النص إلى الرواية
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
