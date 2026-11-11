"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { User } from "@supabase/supabase-js";
import {
  BookOpen,
  Plus,
  Search,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Feather,
  Command,
  Library,
  Globe,
  Waypoints,
  Settings,
  PanelRightClose,
  PanelLeftClose,
  Maximize2,
  Minimize2,
  Download,
  History,
  ChevronDown,
  FileText,
  Trash2,
  MoreHorizontal,
  Pencil,
  Upload,
  Check,
} from "lucide-react";
import { supabase, list, insert, update, remove } from "../lib/supabase";
import type { Project, Book, Chapter, Scene, Revision } from "../lib/types";
import { countWords } from "../lib/words";
import { Brand, Dialog, Field, errorMessage } from "./ui";
import Auth from "./Auth";
import Writer, { type WriterHandle } from "./Writer";
import Workspace from "./Workspace";
import LiquidSculpture from "./LiquidSculpture";
import { setGuestActive, guestList } from "../lib/guest";
import { transferGuestToAccount } from "../lib/supabase";
import Publish from "./Publish";
import Sprint from "./Sprint";
import ProjectSettings from "./ProjectSettings";
import Plan from "./Plan";
import ManuscriptManager from "./ManuscriptManager";
import ProjectSearch from "./ProjectSearch";
import Annotations from "./Annotations";
import BackupManager from "./BackupManager";
import { cloneDraft, type Draft } from "../lib/drafts";
import { PrivateImage } from "./Assets";
export default function Midad() {
  const [cloudUser, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  const [guestAvailable, setGuestAvailable] = useState(false);
  const user =
    cloudUser || (guest ? { id: "guest-local", email: undefined } : null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [view, setView] = useState("library");
  const [modal, setModal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [paletteQuery, setPaletteQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [binder, setBinder] = useState(true);
  const [context, setContext] = useState(true);
  const [size, setSize] = useState(24);
  const [font, setFont] = useState("amiri");
  const [width, setWidth] = useState(720);
  const [lineHeight, setLineHeight] = useState(2.2);
  const [prefsReady, setPrefsReady] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [preview, setPreview] = useState<Revision | null>(null);
  const [recovery, setRecovery] = useState(false);
  const writer = useRef<WriterHandle>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  useEffect(() => {
    if (innerWidth < 1101) setContext(false);
    if (innerWidth < 761) setBinder(false);
    setRecovery(new URLSearchParams(location.search).has("recovery"));
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      const local =
        !data.session && localStorage.getItem("midad:guest-session") === "1";
      setGuest(local);
      setGuestActive(local);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setUser(session?.user || null);
      if (session) {
        setGuest(false);
        setGuestActive(false);
        Promise.all([guestList<Project>("projects"), list<Project>("projects")])
          .then(([local, remote]) =>
            setGuestAvailable(
              local.some((p) => !remote.some((r) => r.id === p.id)),
            ),
          )
          .catch((e) => setError(errorMessage(e)));
      }
      if (!session) {
        setScene(null);
        setBook(null);
        setChapters([]);
        setScenes([]);
        setProject(null);
        setView("library");
        setProjects([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user)
      list<Project>("projects")
        .then(setProjects)
        .catch((e) => setError(errorMessage(e)));
  }, [user?.id]);
  useEffect(() => {
    if (!user) return;
    setPrefsReady(false);
    try {
      const p = JSON.parse(
        localStorage.getItem("midad:editor:" + user.id) || "null",
      );
      if (p) {
        setSize(p.size || 24);
        setWidth(p.width || 720);
        setFont(p.font || "amiri");
        setLineHeight(p.lineHeight || 2.2);
      }
    } catch {}
    setPrefsReady(true);
    if (!guest)
      list<{
        id: string;
        settings: {
          size?: number;
          width?: number;
          font?: string;
          lineHeight?: number;
        };
      }>("preferences")
        .then((rows) => {
          const p = rows[0]?.settings;
          if (p) {
            setSize(p.size || 24);
            setWidth(p.width || 720);
            setFont(p.font || "amiri");
            setLineHeight(p.lineHeight || 2.2);
          }
        })
        .catch((e) => setError(errorMessage(e)));
  }, [user?.id]);
  useEffect(() => {
    if (prefsReady && user)
      localStorage.setItem(
        "midad:editor:" + user.id,
        JSON.stringify({ size, width, font, lineHeight }),
      );
  }, [size, width, font, lineHeight, prefsReady, user?.id]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal((m) => (m === "command" ? "" : "command"));
      }
      if (e.key === "Escape") setFocus(false);
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        setFocus((x) => !x);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  async function guard() {
    const ok = await writer.current?.flush();
    if (ok === false) {
      setError(
        "لم تُرفع التعديلات بعد. احتفظ بالمشهد مفتوحًا حتى نجاح الحفظ أو نزّل نسختك المحلية.",
      );
      return false;
    }
    return true;
  }
  async function run(fn: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadBook(b: Book, requestedDraft?: string | null) {
    setScene(null);
    const ds = await list<Draft>("drafts", { book_id: b.id });
    setDrafts(ds);
    const preference =
      requestedDraft === undefined
        ? localStorage.getItem("midad:draft:" + user!.id + ":" + b.id)
        : requestedDraft;
    const selected = ds.some((d) => d.id === preference) ? preference : null;
    setDraftId(selected);
    localStorage.setItem(
      "midad:draft:" + user!.id + ":" + b.id,
      selected || "",
    );
    const cs = (await list<Chapter>("chapters", { book_id: b.id }))
      .filter((c) => (c.draft_id || null) === selected)
      .sort((a, b) => a.position - b.position);
    const ss = (
      await Promise.all(
        cs.map((c) => list<Scene>("scenes", { chapter_id: c.id })),
      )
    )
      .flat()
      .sort((a, b) => a.position - b.position);
    setBook(b);
    setChapters(cs);
    setScenes(ss);
    setScene(ss[0] || null);
  }
  async function openLinkedScene(target: Scene, b: Book) {
    if (!(await guard())) return;
    const [c] = await list<Chapter>("chapters", { id: target.chapter_id });
    await loadBook(b, c?.draft_id || null);
    setScene(target);
    setView("write");
    setModal("");
  }
  async function openProject(p: Project) {
    if (!(await guard())) return;
    await run(async () => {
      const bs = (await list<Book>("books", { project_id: p.id })).sort(
        (a, b) => a.position - b.position,
      );
      setProject(p);
      setBooks(bs);
      setView("write");
      if (bs[0]) await loadBook(bs[0]);
      else {
        setBook(null);
        setChapters([]);
        setScenes([]);
        setScene(null);
      }
      localStorage.setItem("midad:last:" + user!.id, p.id);
    });
  }
  async function navigate(v: string) {
    if (!(await guard())) return;
    setView(v);
    setModal("");
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title")).trim();
    if (!title) return;
    await run(async () => {
      if (modal === "project") {
        const p = await insert<Project>("projects", {
          title,
          description: String(f.get("description") || ""),
        });
        setProjects((x) => [p, ...x]);
        await openProject(p);
      } else if (modal === "book" && project) {
        const b = await insert<Book>("books", {
          project_id: project.id,
          title,
          position: books.length,
        });
        setBooks((x) => [...x, b]);
        await loadBook(b);
      } else if (modal === "draft" && book) {
        const d = await cloneDraft(
          book.id,
          draftId,
          title,
          f.get("draftMode") !== "empty",
        );
        await loadBook(book, d.id);
      } else if (modal === "chapter" && book) {
        const c = await insert<Chapter>("chapters", {
          book_id: book.id,
          draft_id: draftId,
          title,
          position: chapters.length,
        });
        setChapters((x) => [...x, c]);
        const s = await insert<Scene>("scenes", {
          chapter_id: c.id,
          title: "المشهد الأول",
          position: 0,
        });
        setScenes((x) => [...x, s]);
        setScene(s);
      } else if (modal.startsWith("scene:")) {
        const s = await insert<Scene>("scenes", {
          chapter_id: modal.slice(6),
          title,
          position: scenes.length,
        });
        setScenes((x) => [...x, s]);
        setScene(s);
      } else if (modal === "rename" && scene) {
        await update("scenes", scene.id, { title });
        setScene({ ...scene, title });
        setScenes((x) =>
          x.map((s) => (s.id === scene.id ? { ...s, title } : s)),
        );
      }
      setModal("");
    });
  }
  async function showHistory() {
    if (!(await guard()) || !scene) return;
    await run(async () => {
      setRevisions(
        (await list<Revision>("revisions", { scene_id: scene.id })).sort(
          (a, b) => b.version - a.version,
        ),
      );
      setPreview(null);
      setModal("history");
    });
  }
  async function moveScene(s: Scene, delta: number) {
    const siblings = scenes
      .filter((x) => x.chapter_id === s.chapter_id)
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((x) => x.id === s.id);
    const other = siblings[index + delta];
    if (!other) return;
    await run(async () => {
      await update("scenes", s.id, { position: other.position });
      await update("scenes", other.id, { position: s.position });
      setScenes((xs) =>
        xs.map((x) =>
          x.id === s.id
            ? { ...x, position: other.position }
            : x.id === other.id
              ? { ...x, position: s.position }
              : x,
        ),
      );
    });
  }
  if (loading)
    return (
      <main className="loading">
        <Brand />
        <p>نفتح لك مساحة الحكاية…</p>
      </main>
    );
  if (!user || recovery)
    return (
      <Auth
        recovery={recovery}
        onGuest={() => {
          setGuestActive(true);
          setGuest(true);
          setView("library");
        }}
      />
    );
  const total = scenes.reduce((sum, s) => sum + countWords(s.plain_text), 0);
  const currentChapter = chapters.find((c) => c.id === scene?.chapter_id);
  const last = projects.find(
    (p) =>
      typeof window !== "undefined" &&
      p.id === localStorage.getItem("midad:last:" + user.id),
  );
  return (
    <div
      className={
        "app " +
        (focus ? "focus-mode " : "") +
        (view === "write" ? "writing-view" : "")
      }
    >
      <header className="topbar glass">
        <button
          className="brand-button"
          onClick={() => void navigate("library")}
        >
          <Brand />
        </button>
        <nav aria-label="التنقل الرئيسي">
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => void navigate("library")}
          >
            <Library size={17} />
            المكتبة
          </button>
          {project &&
            [
              { v: "write", l: "الكتابة", i: Feather },
              { v: "plan", l: "التخطيط", i: Waypoints },
              { v: "world", l: "العالم", i: Globe },
              { v: "publish", l: "التصدير", i: Download },
            ].map((n) => (
              <button
                key={n.v}
                className={view === n.v ? "active" : ""}
                onClick={() => void navigate(n.v)}
              >
                <n.i size={17} />
                {n.l}
              </button>
            ))}
        </nav>
        <div className="top-actions">
          <button
            title="الأوامر ⌘K"
            aria-label="لوحة الأوامر"
            onClick={() => setModal("command")}
          >
            <Command size={18} />
          </button>
          <button aria-label="الإعدادات" onClick={() => setModal("settings")}>
            <Settings size={18} />
          </button>
          <button
            aria-label="تسجيل الخروج"
            onClick={() =>
              void run(async () => {
                if (await guard()) {
                  if (guest) {
                    setGuestActive(false);
                    setGuest(false);
                    setScene(null);
                    setProject(null);
                    setProjects([]);
                    setView("library");
                  } else {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                  }
                }
              })
            }
          >
            <LogOut size={18} />
          </button>
          <span className="avatar">
            {guest ? "ض" : user.email?.slice(0, 1).toUpperCase()}
          </span>
        </div>
      </header>
      {guest && (
        <div className="guest-banner">
          <span>مساحة الضيف · أعمالك محفوظة على هذا الجهاز</span>
          <button
            onClick={() =>
              void run(async () => {
                if (await guard()) {
                  setGuestActive(false);
                  setGuest(false);
                  setProject(null);
                  setScene(null);
                  setProjects([]);
                }
              })
            }
          >
            أنشئ حسابًا لحفظها سحابيًا <ArrowLeft size={14} />
          </button>
        </div>
      )}
      {!guest && guestAvailable && (
        <div className="guest-banner">
          <span>لديك أعمال كتبتها كضيف على هذا الجهاز.</span>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await transferGuestToAccount();
                setProjects(await list<Project>("projects"));
                setGuestAvailable(false);
              })
            }
          >
            {busy ? "جارٍ النقل…" : "نقل أعمال الضيف إلى حسابي"}
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError("")}>إغلاق</button>
        </div>
      )}
      {view === "library" ? (
        <main className="library">
          <div className="library-atmosphere" aria-hidden="true" />
          <div className="library-heading">
            <div>
              <div className="eyebrow">مساحة لأفكارك، وفسحة لخيالك</div>
              <h1>
                عوالم تنتظر
                <br />
                <span>أن تكتبها أنت.</span>
              </h1>
              <p className="library-intro">
                من الفكرة الأولى إلى الكلمة الأخيرة. هذه مساحتك.
              </p>
            </div>
            <button className="primary" onClick={() => setModal("project")}>
              <Plus size={18} />
              رواية جديدة
            </button>
          </div>
          <div className="library-monument">
            <LiquidSculpture compact />
          </div>
          {last && (
            <button
              className="continue-panel"
              onClick={() => void openProject(last)}
            >
              <div className="mini-cover">
                <Feather size={28} />
              </div>
              <div>
                <span className="eyebrow">من حيث توقفت</span>
                <h2>{last.title}</h2>
                <p className="muted">عُد إلى عالمك. هناك حكاية تستحق أن تُروى.</p>
              </div>
              <span className="continue-link">
                متابعة الكتابة <ArrowLeft size={18} />
              </span>
            </button>
          )}
          <div className="shelf-heading">
            <h2>
              مكتبتك{" "}
              <span className="count">
                {projects.length.toLocaleString("ar")}
              </span>
            </h2>
            <div className="search">
              <Search size={17} />
              <input
                aria-label="البحث في المكتبة"
                placeholder="ابحث عن حكاية…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          {projects.length === 0 ? (
            <div className="empty-library">
              <div className="empty-symbol">
                <BookOpen size={42} />
              </div>
              <h2>حكايتك الأولى تبدأ هنا.</h2>
              <p>امنح فكرتك عنوانًا، واترك لبقية الحكاية أن تأتي.</p>
              <button onClick={() => setModal("project")}>
                أنشئ روايتك الأولى <ArrowLeft size={18} />
              </button>
            </div>
          ) : (
            <div className="bookshelf">
              {projects
                .filter((p) => p.title.includes(query))
                .map((p, i) => (
                  <div className="book-item" key={p.id}>
                    <button
                      className={"book-cover cover-" + (i % 3)}
                      onClick={() => void openProject(p)}
                    >
                      <span className="cover-kicker">مخطوطة أدبية</span>
                      <PrivateImage path={p.cover_path} className="cover-art" />
                      <div className="cover-geometry" aria-hidden="true" />
                      <span className="cover-title">{p.title}</span>
                      <span className="cover-brand">مِداد</span>
                    </button>
                    <div className="book-info">
                      <button onClick={() => void openProject(p)}>
                        <h3>{p.title}</h3>
                      </button>
                      <button
                        aria-label={"حذف " + p.title}
                        onClick={() => setModal("delete-project:" + p.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                    <p className="muted">
                      {p.description || "مساحة لعالم جديد"}
                    </p>
                    <span className="book-date">
                      أُنشئت{" "}
                      {new Date(p.created_at).toLocaleDateString("ar", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                ))}
              <button className="new-book" onClick={() => setModal("project")}>
                <span>
                  <Plus size={25} />
                </span>
                حكاية لم تُكتب بعد
              </button>
            </div>
          )}
          <footer className="library-footer">
            <span>اكتب على مهل. اترك أثرًا.</span>
            <span>MIDAD — A SPACE FOR STORIES</span>
          </footer>
        </main>
      ) : project && view === "write" ? (
        <main className="writing">
          <div className="workspace-heading">
            <div className="breadcrumbs">
              <button onClick={() => void navigate("library")}>المكتبة</button>
              <span>/</span>
              <span>{project.title}</span>
              <span>/</span>
              <span>{currentChapter?.title || "المخطوطة"}</span>
            </div>
            <div>
              <button
                aria-label="إظهار قائمة الفصول"
                aria-pressed={binder}
                onClick={() => {
                  setBinder(!binder);
                  if (innerWidth < 761) setContext(false);
                }}
              >
                <PanelRightClose size={18} />
              </button>
              <button
                aria-label="إظهار التفاصيل"
                aria-pressed={context}
                onClick={() => {
                  setContext(!context);
                  if (innerWidth < 761) setBinder(false);
                }}
              >
                <PanelLeftClose size={18} />
              </button>
              <button aria-label="وضع التركيز" onClick={() => setFocus(!focus)}>
                {focus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
          <div
            className={
              "writing-layout " +
              (!binder ? "no-binder " : "") +
              (!context ? "no-context" : "")
            }
          >
            {binder && (
              <aside className="binder">
                <div className="panel-title">
                  <span>المخطوطة</span>
                  <button
                    aria-label="إدارة الكتب والفصول"
                    onClick={() =>
                      void run(async () => {
                        if (await guard()) setModal("manage-manuscript");
                      })
                    }
                  >
                    <BookOpen size={16} />
                  </button>
                  <button
                    aria-label="إضافة كتاب"
                    onClick={() => setModal("book")}
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <select
                  aria-label="الكتاب الحالي"
                  value={book?.id || ""}
                  onChange={(e) => {
                    const nextBook = e.currentTarget.value;
                    void run(async () => {
                      if (await guard())
                        await loadBook(books.find((b) => b.id === nextBook)!);
                    });
                  }}
                >
                  <option value="" disabled>
                    اختر كتابًا
                  </option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                {book && (
                  <div className="draft-picker">
                    <label className="field">
                      المسودة
                      <select
                        aria-label="المسودة الحالية"
                        value={draftId || ""}
                        onChange={(e) => {
                          const nextDraft = e.currentTarget.value;
                          void run(async () => {
                            if (await guard())
                              await loadBook(book, nextDraft || null);
                          });
                        }}
                      >
                        <option value="">المسودة الأصلية</option>
                        {drafts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      aria-label="مسودة جديدة"
                      onClick={() =>
                        void run(async () => {
                          if (await guard()) setModal("draft");
                        })
                      }
                    >
                      <Plus size={15} />
                    </button>
                    {draftId && (
                      <button
                        aria-label="حذف المسودة الحالية"
                        onClick={() => setModal("delete-draft")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
                {chapters.map((c, i) => (
                  <section className="chapter" key={c.id}>
                    <div className="chapter-name">
                      <ChevronDown size={14} />
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <strong>{c.title}</strong>
                      <button
                        aria-label={"إضافة مشهد إلى " + c.title}
                        onClick={() =>
                          void run(async () => {
                            if (await guard()) setModal("scene:" + c.id);
                          })
                        }
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    {scenes
                      .filter((s) => s.chapter_id === c.id)
                      .sort((a, b) => a.position - b.position)
                      .map((s) => (
                        <div
                          className={
                            "scene-row " +
                            (scene?.id === s.id ? "selected" : "")
                          }
                          key={s.id}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData("text/plain", s.id)
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = scenes.find(
                              (x) =>
                                x.id === e.dataTransfer.getData("text/plain"),
                            );
                            if (from && from.chapter_id === s.chapter_id)
                              void moveScene(
                                from,
                                from.position > s.position ? -1 : 1,
                              );
                          }}
                        >
                          <button
                            className="scene-open"
                            onClick={() =>
                              void run(async () => {
                                if (await guard()) setScene(s);
                              })
                            }
                          >
                            <FileText size={14} />
                            <span>{s.title}</span>
                          </button>
                          <button
                            className="reorder"
                            aria-label={"تقديم " + s.title}
                            onClick={() => void moveScene(s, -1)}
                          >
                            ↑
                          </button>
                          <button
                            className="reorder"
                            aria-label={"تأخير " + s.title}
                            onClick={() => void moveScene(s, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      ))}
                  </section>
                ))}
                {book && (
                  <button
                    className="add-chapter"
                    onClick={() =>
                      void run(async () => {
                        if (await guard()) setModal("chapter");
                      })
                    }
                  >
                    <Plus size={16} />
                    فصل جديد
                  </button>
                )}
                {!book && (
                  <div className="small-empty">
                    <p>ابدأ بكتاب لروايتك.</p>
                    <button onClick={() => setModal("book")}>إنشاء كتاب</button>
                  </div>
                )}
                <div className="binder-bottom">
                  <span>{total.toLocaleString("ar")} كلمة في الكتاب</span>
                  <progress value={total} max={project.goal} />
                  <small>
                    هدف الرواية: {project.goal.toLocaleString("ar")} كلمة
                  </small>
                </div>
              </aside>
            )}
            <section className="editor-area">
              {scene ? (
                <Writer
                  key={scene.id}
                  ref={writer}
                  scene={scene}
                  userId={user.id}
                  size={size}
                  font={font}
                  width={width}
                  lineHeight={lineHeight}
                  onReady={setActiveEditor}
                  onSaved={(s) => {
                    setScene((current) => (current?.id === s.id ? s : current));
                    setScenes((xs) => xs.map((x) => (x.id === s.id ? s : x)));
                  }}
                />
              ) : (
                <div className="editor-empty">
                  <Feather size={35} />
                  <h2>كل شيء يبدأ بسطر.</h2>
                  <p>أنشئ {book ? "فصلًا" : "كتابًا"} لتبدأ الكتابة.</p>
                  <button
                    className="primary"
                    onClick={() => setModal(book ? "chapter" : "book")}
                  >
                    <Plus size={17} />
                    {book ? "إنشاء فصل" : "إنشاء كتاب"}
                  </button>
                </div>
              )}
            </section>
            {context && (
              <aside className="context-panel">
                <div className="panel-title">
                  مساحة الحكاية{" "}
                  <button
                    aria-label="إعدادات الرواية"
                    onClick={() => setModal("project-settings")}
                  >
                    <Settings size={16} />
                  </button>
                </div>
                <div className="context-block">
                  <span className="eyebrow">المشهد الحالي</span>
                  <h3>{scene?.title || "لم يُحدد مشهد"}</h3>
                  {scene && (
                    <div className="inline-actions">
                      <button onClick={() => setModal("rename")}>
                        <Pencil size={14} />
                        تسمية
                      </button>
                      <button onClick={() => void showHistory()}>
                        <History size={14} />
                        النسخ
                      </button>
                      <button
                        aria-label="حذف المشهد"
                        onClick={() => setModal("delete-scene")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="context-block">
                  <span className="eyebrow">بيئة الكتابة</span>
                  <label className="field">
                    حجم النص{" "}
                    <input
                      type="range"
                      min="18"
                      max="36"
                      value={size}
                      onChange={(e) => setSize(+e.target.value)}
                    />
                  </label>
                  <label className="field">
                    خط المخطوطة
                    <select
                      value={font}
                      onChange={(e) => setFont(e.target.value)}
                    >
                      <option value="amiri">أميري — أدبي</option>
                      <option value="plex">IBM Plex — معاصر</option>
                    </select>
                  </label>
                  <label className="field">
                    عرض الصفحة
                    <input
                      type="range"
                      min="420"
                      max="900"
                      step="20"
                      value={width}
                      onChange={(e) => setWidth(+e.target.value)}
                    />
                  </label>
                </div>
                <div className="context-block">
                  <label className="field">
                    تباعد السطور
                    <input
                      type="range"
                      min="1.4"
                      max="3"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(+e.target.value)}
                    />
                  </label>
                </div>
                <div className="context-block">
                  <span className="eyebrow">عالمك قريب منك</span>
                  <p className="muted">
                    احتفظ بالشخصيات والأماكن والأفكار في متناول حكايتك.
                  </p>
                  <button
                    className="full"
                    onClick={() => void navigate("world")}
                  >
                    <Globe size={16} />
                    فتح دليل العالم
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    className="full"
                    onClick={() => void navigate("notes")}
                  >
                    <FileText size={16} />
                    ملاحظات الرواية
                    <ArrowLeft size={16} />
                  </button>
                </div>
                {scene && (
                  <Annotations
                    sceneId={scene.id}
                    editor={
                      activeEditor && !activeEditor.isDestroyed
                        ? activeEditor
                        : null
                    }
                    onError={setError}
                  />
                )}
                <Sprint
                  key={book?.id}
                  bookId={book?.id || ""}
                  projectId={project.id}
                  userId={user.id}
                  getWords={() =>
                    scenes
                      .filter((s) => s.id !== scene?.id)
                      .reduce((sum, s) => sum + countWords(s.plain_text), 0) +
                    countWords(
                      writer.current?.getText() || scene?.plain_text || "",
                    )
                  }
                  onError={setError}
                />
                <div className="quiet-quote">
                  «الكلمات تصنع عوالم
                  <br />
                  لا تحدّها الجدران.»
                </div>
              </aside>
            )}
          </div>
        </main>
      ) : project && view === "plan" ? (
        <Plan
          projectId={project.id}
          onError={setError}
          onOpenScene={(target, b) =>
            void run(async () => {
              await openLinkedScene(target, b);
            })
          }
        />
      ) : project && view === "publish" ? (
        <Publish
          project={project}
          books={books}
          onError={setError}
          initialBookId={book?.id}
          initialDraftId={draftId}
        />
      ) : project ? (
        <Workspace
          key={view + project.id}
          project={project}
          view={view}
          onError={setError}
        />
      ) : null}
      {["project", "book", "chapter", "rename", "draft"].includes(modal) ||
      modal.startsWith("scene:") ? (
        <Dialog
          title={
            modal === "project"
              ? "حكاية جديدة"
              : modal === "book"
                ? "كتاب جديد"
                : modal === "chapter"
                  ? "فصل جديد"
                  : modal === "draft"
                    ? "مسودة جديدة"
                    : modal === "rename"
                      ? "تسمية المشهد"
                      : "مشهد جديد"
          }
          onClose={() => setModal("")}
        >
          <form onSubmit={create}>
            <Field
              autoFocus
              label="العنوان"
              name="title"
              maxLength={200}
              defaultValue={modal === "rename" ? scene?.title : ""}
              required
            />
            {modal === "draft" && (
              <label className="field">
                محتوى المسودة
                <select name="draftMode" aria-label="محتوى المسودة">
                  <option value="copy">نسخة مستقلة من المسودة الحالية</option>
                  <option value="empty">مسودة فارغة</option>
                </select>
              </label>
            )}
            {modal === "project" && (
              <Field label="عن الحكاية (اختياري)" name="description" />
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "جارٍ الإنشاء…" : "حفظ ومتابعة"}
              <ArrowLeft size={16} />
            </button>
          </form>
        </Dialog>
      ) : null}
      {modal === "manage-manuscript" && project && (
        <Dialog title="الكتب والفصول" onClose={() => setModal("")}>
          <ManuscriptManager
            projectId={project.id}
            onError={setError}
            onChanged={async () => {
              const bs = await list<Book>("books", { project_id: project.id });
              setBooks(bs);
              const selected = bs.find((b) => b.id === book?.id) || bs[0];
              if (selected) await loadBook(selected);
              else {
                setBook(null);
                setChapters([]);
                setScenes([]);
                setScene(null);
              }
            }}
          />
        </Dialog>
      )}
      {modal === "project-settings" && project && (
        <Dialog title="إعدادات الرواية" onClose={() => setModal("")}>
          <ProjectSettings
            project={project}
            onError={setError}
            onSaved={(p) => {
              setProject(p);
              setProjects((xs) => xs.map((x) => (x.id === p.id ? p : x)));
              setModal("");
            }}
          />
        </Dialog>
      )}
      {modal === "settings" && (
        <Dialog title="إعدادات مساحتك" onClose={() => setModal("")}>
          <p dir="ltr">{user.email || "وضع الضيف — حفظ على هذا الجهاز"}</p>
          <BackupManager
            onError={setError}
            onChanged={() => void list<Project>("projects").then(setProjects)}
          />
          <p className="muted">
            الاختصارات: Ctrl / ⌘ + K للأوامر. Ctrl / ⌘ + Shift + F للتركيز. Esc
            للعودة.
          </p>
          <label className="field">
            حجم خط المخطوطة
            <input
              type="range"
              min="18"
              max="36"
              value={size}
              onChange={(e) => setSize(+e.target.value)}
            />
          </label>
          <button
            className="primary full"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const rows = await list<{ id: string }>("preferences");
                const value = {
                  settings: { size, width, font, lineHeight },
                  updated_at: new Date().toISOString(),
                };
                if (rows[0]) await update("preferences", rows[0].id, value);
                else await insert("preferences", value);
                setModal("");
              })
            }
          >
            حفظ إعدادات المحرر
          </button>
          <p>
            تُحفظ المسودات المؤقتة على هذا الجهاز عند تعذّر الاتصال. احرص على
            رفعها قبل تسجيل الخروج.
          </p>
        </Dialog>
      )}
      {modal === "command" && (
        <Dialog title="إلى أين تأخذك الحكاية؟" onClose={() => setModal("")}>
          <input
            autoFocus
            aria-label="بحث الأوامر"
            placeholder="ابحث عن أمر أو رواية…"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
          />
          <div className="command-list">
            {[
              { label: "المكتبة", fn: () => void navigate("library") },
              { label: "رواية جديدة", fn: () => setModal("project") },
              ...(project
                ? [
                    { label: "الكتابة", fn: () => void navigate("write") },
                    {
                      label: "العالم والشخصيات",
                      fn: () => void navigate("world"),
                    },
                    { label: "التخطيط", fn: () => void navigate("plan") },
                    { label: "ملاحظات", fn: () => void navigate("notes") },
                    {
                      label: "التصدير والاستيراد",
                      fn: () => void navigate("publish"),
                    },
                    {
                      label: "وضع التركيز",
                      fn: () => {
                        setFocus((x) => !x);
                        setModal("");
                      },
                    },
                  ]
                : []),
            ]
              .filter((x) => x.label.includes(paletteQuery))
              .map((x) => (
                <button key={x.label} onClick={x.fn}>
                  {x.label}
                  <ArrowLeft size={16} />
                </button>
              ))}
            {projects
              .filter((p) => p.title.includes(paletteQuery))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setModal("");
                    void openProject(p);
                  }}
                >
                  {p.title}
                  <BookOpen size={16} />
                </button>
              ))}
          </div>
          {project && (
            <ProjectSearch
              projectId={project.id}
              query={paletteQuery}
              onError={setError}
              onNavigate={(v) => void navigate(v)}
              onScene={(target, b) =>
                void run(async () => {
                  if (!(await guard())) return;
                  await openLinkedScene(target, b);
                })
              }
            />
          )}
        </Dialog>
      )}
      {modal === "history" && (
        <Dialog title="سجل النسخ" onClose={() => setModal("")}>
          <p className="muted">
            كل حفظ ناجح يحتفظ بالنسخة السابقة. الاستعادة تحفظ النص الحالي أولًا.
          </p>
          <div className="revision-list">
            {revisions.length === 0 && <p>لم يُحفظ تعديل بعد.</p>}
            {revisions.map((r) => (
              <button key={r.id} onClick={() => setPreview(r)}>
                نسخة {r.version.toLocaleString("ar")} ·{" "}
                {new Date(r.created_at).toLocaleString("ar")} ·{" "}
                {countWords(r.plain_text)} كلمة
              </button>
            ))}
          </div>
          {preview && (
            <>
              <div className="revision-compare">
                <section>
                  <h3>الحالية</h3>
                  <pre>{writer.current?.getText()}</pre>
                </section>
                <section>
                  <h3>النسخة المختارة</h3>
                  <pre>{preview.plain_text || "مشهد فارغ"}</pre>
                </section>
              </div>
              <button
                className="primary"
                onClick={() =>
                  void run(async () => {
                    writer.current?.replace(preview.content);
                    if (await writer.current?.flush()) setModal("");
                  })
                }
              >
                استعادة هذه النسخة
              </button>
            </>
          )}
        </Dialog>
      )}
      {modal.startsWith("delete-") && (
        <Dialog title="تأكيد الحذف" onClose={() => setModal("")}>
          <p>
            سيُحذف{" "}
            {modal === "delete-scene"
              ? "هذا المشهد وسجل نسخه"
              : modal === "delete-draft"
                ? "هذه المسودة وفصولها ومشاهدها فقط"
                : "المشروع وكل الكتب والفصول التابعة له"}
            . لا يمكن التراجع عن الحذف.
          </p>
          <button
            className="danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (!(await guard())) return;
                if (modal === "delete-scene" && scene) {
                  await remove("scenes", scene.id);
                  setScenes((xs) => xs.filter((s) => s.id !== scene.id));
                  setScene(null);
                } else if (modal === "delete-draft" && draftId && book) {
                  await remove("drafts", draftId);
                  await loadBook(book, null);
                } else {
                  const id = modal.slice(15);
                  await remove("projects", id);
                  setProjects((xs) => xs.filter((p) => p.id !== id));
                }
                setModal("");
              })
            }
          >
            حذف نهائي
          </button>
        </Dialog>
      )}
      {focus && (
        <button className="exit-focus glass" onClick={() => setFocus(false)}>
          <Minimize2 size={16} />
          مغادرة التركيز
        </button>
      )}
    </div>
  );
}
