"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Type, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { catalog, type CatalogNovel } from "../lib/social";
import { FONT_OPTIONS, fontFamily } from "../lib/fonts";
import { errorMessage } from "./ui";
import ChapterText from "./ChapterText";
import type { JSONContent } from "@tiptap/react";
type ChapterIndex = {
  id: string;
  title: string;
  position: number;
  word_count: number;
};
type ReadingChapter = {
  id: string;
  title: string;
  content: JSONContent;
  plain_text: string;
};
export default function PublicReader() {
  const [novel, setNovel] = useState<CatalogNovel | null>(null),
    [chapters, setChapters] = useState<ChapterIndex[]>([]),
    [selected, setSelected] = useState(""),
    [current, setCurrent] = useState<ReadingChapter | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [font, setFont] = useState("amiri"),
    [size, setSize] = useState(24),
    [line, setLine] = useState(2.2),
    [prefs, setPrefs] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("midad:reader:v1") || "{}");
      if (p.font) setFont(p.font);
      if (p.size >= 16 && p.size <= 36) setSize(p.size);
      if (p.line >= 1.4 && p.line <= 3) setLine(p.line);
    } catch {}
    setReady(true);
    void (async () => {
      const params = new URLSearchParams(location.search),
        id = params.get("novel");
      const [ns, cs] = await Promise.all([
        catalog({ p_novel: id, p_limit: 1 }),
        supabase.rpc("midad_public_chapter_index", { pid: id }),
      ]);
      if (cs.error) throw cs.error;
      setNovel(ns[0] || null);
      const xs = cs.data || [];
      setChapters(xs);
      setSelected(
        xs.some((c: ChapterIndex) => c.id === params.get("chapter"))
          ? params.get("chapter")!
          : xs[0]?.id || "",
      );
      if (!xs.length) setLoading(false);
    })().catch((e) => {
      setError(errorMessage(e));
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "midad:reader:v1",
        JSON.stringify({ font, size, line }),
      );
  }, [font, size, line, ready]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setCurrent(null);
    setLoading(true);
    setError("");
    void supabase
      .rpc("midad_read_public_chapter", { cid: selected })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errorMessage(error));
        else setCurrent(data?.[0] || null);
        setLoading(false);
        const url = new URL(location.href);
        url.searchParams.set("chapter", selected);
        history.replaceState(null, "", url);
        scrollTo({ top: 0, behavior: "instant" });
      });
    return () => {
      active = false;
    };
  }, [selected]);
  const index = chapters.findIndex((c) => c.id === selected);
  return (
    <main className="public-reader enhanced-reader">
      <header className="public-reader-nav glass">
        <a href="/">مِداد</a>
        <a
          className="reader-novel-link"
          href={novel ? "/novel?id=" + novel.id : "/discover"}
        >
          {novel?.title || "قراءة الرواية"}
        </a>
        <select
          aria-label="الفصل المقروء"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          aria-label="تخصيص القراءة"
          aria-expanded={prefs}
          onClick={() => setPrefs(!prefs)}
        >
          <Type size={20} />
        </button>
      </header>
      {prefs && (
        <section className="reader-preferences glass">
          <label className="field">
            خط القراءة
            <select
              aria-label="خط القراءة"
              value={font}
              onChange={(e) => setFont(e.target.value)}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            حجم القراءة
            <input
              aria-label="حجم القراءة"
              type="range"
              min="16"
              max="36"
              value={size}
              onChange={(e) => setSize(+e.target.value)}
            />
          </label>
          <label className="field">
            تباعد القراءة
            <select
              aria-label="تباعد القراءة"
              value={line}
              onChange={(e) => setLine(+e.target.value)}
            >
              {[1.4, 1.6, 1.8, 2, 2.2, 2.5, 3].map((n) => (
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {novel && (
        <p className="reader-author">
          بقلم{" "}
          {novel.author_username ? (
            <a
              href={
                "/profile?username=" + encodeURIComponent(novel.author_username)
              }
            >
              {novel.author_name}
            </a>
          ) : (
            novel.author_name
          )}
        </p>
      )}
      {loading ? (
        <p className="reader-loading" role="status">
          نجهّز لك الفصل…
        </p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : current ? (
        <div
          className="reader-document"
          style={
            {
              "--reading-font": fontFamily(font),
              "--reading-size": size + "px",
              "--reading-line": line,
            } as React.CSSProperties
          }
        >
          <ChapterText
            title={current.title}
            scenes={[{ ...current, position: 0 }]}
          />
        </div>
      ) : (
        <p className="small-empty">لا توجد فصول منشورة متاحة هنا.</p>
      )}
      {chapters.length > 0 && (
        <footer className="reader-pagination">
          <div className="reader-progress">
            <span>
              الفصل {(index + 1).toLocaleString("ar")} من{" "}
              {chapters.length.toLocaleString("ar")}
            </span>
            <progress value={index + 1} max={chapters.length} />
          </div>
          <div>
            {index > 0 && (
              <button onClick={() => setSelected(chapters[index - 1].id)}>
                <ArrowRight size={17} />
                الفصل السابق
              </button>
            )}
            {index >= 0 && index < chapters.length - 1 && (
              <button
                className="primary"
                onClick={() => setSelected(chapters[index + 1].id)}
              >
                الفصل التالي <ArrowLeft size={17} />
              </button>
            )}
            <a href={novel ? "/novel?id=" + novel.id : "/discover"}>
              <BookOpen size={16} />
              فهرس الرواية
            </a>
          </div>
        </footer>
      )}
    </main>
  );
}
