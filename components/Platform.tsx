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
export function Account({
  userId,
  onError,
}: {
  userId: string;
  onError: (s: string) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [loaded, setLoaded] = useState(false),
    [apps, setApps] = useState<App[]>([]),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function load() {
    const { data, error } = await supabase
      .from("midad_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    setProfile(data);
    const r = await supabase.rpc("midad_connected_apps");
    if (r.error) throw r.error;
    setApps(r.data || []);
    setLoaded(true);
  }
  useEffect(() => {
    void load().catch((e) => onError(errorMessage(e)));
  }, [userId]);
  return (
    <main className="collection account-page">
      <div className="collection-heading">
        <div>
          <p className="eyebrow">مساحتك في مِداد</p>
          <h1>حسابي</h1>
          <p className="muted">عرّف أصدقاءك بك، وتحكّم في التطبيقات المتصلة.</p>
        </div>
        <UserRound size={34} />
      </div>
      {loaded && (
        <form
          className="profile-form glass"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setSaved(false);
            try {
              const value = {
                user_id: userId,
                username: String(f.get("username")).toLowerCase().trim(),
                display_name: String(f.get("display_name")).trim(),
                bio: String(f.get("bio") || ""),
                is_public: f.get("is_public") === "on",
              };
              const { error } = await supabase
                .from("midad_profiles")
                .upsert(value, { onConflict: "user_id" });
              if (error) throw error;
              setProfile(value);
              setSaved(true);
            } catch (e) {
              onError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="profile-avatar">
            <UserRound size={30} />
          </div>
          <Field
            label="اسمك الظاهر"
            name="display_name"
            defaultValue={profile?.display_name}
            required
            maxLength={80}
          />
          <Field
            label="اسم المستخدم — لإضافتك إلى رواية"
            name="username"
            dir="ltr"
            defaultValue={profile?.username}
            pattern="[a-z0-9_]{3,30}"
            minLength={3}
            maxLength={30}
            placeholder="your_name"
            required
          />
          <small className="muted">
            حروف إنجليزية صغيرة وأرقام وشرطة سفلية، من 3 إلى 30 حرفًا. أعطِ هذا
            الاسم لصديقك ليشارك رواية معك.
          </small>
          <label className="field">
            عنّي
            <textarea name="bio" maxLength={1000} defaultValue={profile?.bio} />
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={profile?.is_public}
            />
            إظهار ملفي للقراء داخل المنصة
          </label>
          <p className="muted">
            رواياتك تبقى خاصة. أنت تختار الفصول التي تنشرها من صفحة الرواية.
          </p>
          {profile?.is_public && (
            <a
              className="profile-link"
              target="_blank"
              rel="noreferrer"
              href={"/profile?username=" + encodeURIComponent(profile.username)}
            >
              افتح ملفي العام <ArrowLeft size={16} />
            </a>
          )}
          <button className="primary" disabled={busy}>
            {saved ? (
              <>
                <Check size={17} />
                تم حفظ الملف
              </>
            ) : busy ? (
              "جارٍ الحفظ…"
            ) : (
              "حفظ الملف الشخصي"
            )}
          </button>
        </form>
      )}
      <section className="connected-apps">
        <h2>
          <Link2 size={22} />
          التطبيقات المتصلة
        </h2>
        <p className="muted">
          ابدأ من مكوّن مِداد في ChatGPT واطلب «اربط حسابي». سيعطيك رابط موافقة
          آمنًا.
        </p>
        {apps.length === 0 ? (
          <p>لا توجد تطبيقات مرتبطة بحسابك.</p>
        ) : (
          apps.map((a) => (
            <div className="member-row" key={a.id}>
              <div>
                <strong>ChatGPT × مِداد</strong>
                <p>
                  {a.allow_write ? "قراءة وكتابة" : "قراءة فقط"} ·{" "}
                  {a.project_id ? "رواية محددة" : "جميع رواياتي"}
                </p>
              </div>
              <button
                onClick={async () => {
                  const { error } = await supabase.rpc("midad_disconnect_app", {
                    bridge: a.id,
                  });
                  if (error) onError(errorMessage(error));
                  else await load();
                }}
              >
                إلغاء الربط
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
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
export function Community() {
  const [items, setItems] = useState<PublishedNovel[]>([]),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  useEffect(() => {
    void supabase.rpc("midad_published_novels").then(({ data, error }) => {
      if (error) setError(errorMessage(error));
      else setItems(data || []);
    });
  }, []);
  return (
    <main className="collection">
      <div className="collection-heading">
        <div>
          <p className="eyebrow">روايات اختار أصحابها مشاركتها</p>
          <h1>للقراءة</h1>
          <p className="muted">
            اكتشف الفصول المنشورة. الروايات الخاصة تبقى في مكتبة أصحابها.
          </p>
        </div>
        <BookOpen size={36} />
      </div>
      <Field
        label="ابحث عن رواية أو كاتب"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <div className="reading-grid">
        {items
          .filter((n) =>
            (n.title + " " + n.author_name + " " + n.author_username).includes(
              search,
            ),
          )
          .map((n) => (
            <a
              className="reading-card glass"
              href={"/read?novel=" + n.id}
              key={n.id}
            >
              <BookOpen size={30} />
              <h2>{n.title}</h2>
              <p>{n.description}</p>
              <span>
                {n.author_name || "كاتب في مِداد"} · {n.chapter_count} فصل
              </span>
              <ArrowLeft size={19} />
            </a>
          ))}
      </div>
      {!items.length && (
        <div className="small-empty">
          <h2>هنا تبدأ حكايات تُقرأ.</h2>
          <p>ستظهر أول رواية عندما يختار صاحبها نشر فصل من صفحة روايته.</p>
        </div>
      )}
    </main>
  );
}
export function ChapterText({
  title,
  scenes,
}: {
  title: string;
  scenes: Pick<Scene, "id" | "plain_text" | "position">[];
}) {
  return (
    <article className="chapter-reading">
      <h1>{title}</h1>
      {[...scenes]
        .sort((a, b) => a.position - b.position)
        .map((s, i) => (
          <section key={s.id}>
            {i > 0 && (
              <div className="scene-break" aria-label="فاصل مشهد">
                * * *
              </div>
            )}
            {s.plain_text.split("\n").map((p, i) => (
              <p key={i} dir="auto">
                {p || "\u00a0"}
              </p>
            ))}
          </section>
        ))}
    </article>
  );
}
export function PublicReader() {
  const [novel, setNovel] = useState<PublishedNovel | null>(null),
    [chapters, setChapters] = useState<
      { id: string; title: string; plain_text: string; position: number }[]
    >([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const id = new URLSearchParams(location.search).get("novel");
      const ns = await supabase.rpc("midad_published_novels");
      if (ns.error) throw ns.error;
      setNovel(ns.data.find((n: PublishedNovel) => n.id === id) || null);
      const cs = await supabase.rpc("midad_public_chapters", { pid: id });
      if (cs.error) throw cs.error;
      setChapters(cs.data || []);
      setSelected(cs.data?.[0]?.id || "");
    })().catch((e) => setError(errorMessage(e)));
  }, []);
  const c = chapters.find((c) => c.id === selected);
  return (
    <main className="public-reader">
      <header className="public-reader-nav glass">
        <a href="/">مِداد</a>
        <span>{novel?.title || "قراءة الرواية"}</span>
        <select
          aria-label="الفصل المقروء"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            window.scrollTo(0, 0);
          }}
        >
          {chapters.map((c) => (
            <option value={c.id} key={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </header>
      {error ? (
        <p role="alert">{error}</p>
      ) : c ? (
        <>
          <p className="reader-author">
            بقلم{" "}
            {novel?.author_username ? (
              <a
                href={
                  "/profile?username=" +
                  encodeURIComponent(novel.author_username)
                }
              >
                {novel.author_name || "كاتب في مِداد"}
              </a>
            ) : (
              "كاتب في مِداد"
            )}
          </p>
          <ChapterText title={c.title} scenes={[{ ...c, position: 0 }]} />
          <div className="reader-next">
            {chapters.findIndex((x) => x.id === c.id) < chapters.length - 1 && (
              <button
                className="primary"
                onClick={() => {
                  setSelected(
                    chapters[chapters.findIndex((x) => x.id === c.id) + 1].id,
                  );
                  window.scrollTo(0, 0);
                }}
              >
                الفصل التالي <ArrowLeft size={17} />
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="small-empty">لا توجد فصول منشورة متاحة هنا.</p>
      )}
    </main>
  );
}

export function PublicProfile() {
  const [profile, setProfile] = useState<{
      username: string;
      display_name: string;
      bio: string;
    } | null>(null),
    [novels, setNovels] = useState<PublishedNovel[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const username =
        new URLSearchParams(location.search).get("username") || "";
      const [pr, ns] = await Promise.all([
        supabase.rpc("midad_public_profile", { handle: username }),
        supabase.rpc("midad_published_novels"),
      ]);
      if (pr.error) throw pr.error;
      if (ns.error) throw ns.error;
      setProfile(pr.data?.[0] || null);
      setNovels(
        (ns.data || []).filter(
          (n: PublishedNovel) => n.author_username === username,
        ),
      );
      setReady(true);
    })().catch((e) => {
      setError(errorMessage(e));
      setReady(true);
    });
  }, []);
  return (
    <main className="collection public-profile">
      <a className="profile-back" href="/">
        مِداد <ArrowLeft size={17} />
      </a>
      {error ? (
        <p role="alert">{error}</p>
      ) : !ready ? (
        <p>جارٍ فتح الملف…</p>
      ) : profile ? (
        <>
          <header className="public-profile-heading glass">
            <div className="profile-avatar">
              <UserRound size={32} />
            </div>
            <p className="eyebrow" dir="ltr">
              @{profile.username}
            </p>
            <h1>{profile.display_name}</h1>
            <p>{profile.bio || "كاتب في مِداد"}</p>
          </header>
          <h2>روايات اختار الكاتب نشرها</h2>
          <div className="reading-grid">
            {novels.map((n) => (
              <a
                className="reading-card glass"
                key={n.id}
                href={"/read?novel=" + n.id}
              >
                <BookOpen size={28} />
                <h2>{n.title}</h2>
                <p>{n.description}</p>
                <span>{n.chapter_count} فصل للقراءة</span>
                <ArrowLeft size={18} />
              </a>
            ))}
          </div>
          {!novels.length && (
            <p className="muted">لم ينشر الكاتب فصولًا للقراءة العامة بعد.</p>
          )}
        </>
      ) : (
        <div className="small-empty">
          <UserRound size={35} />
          <h1>لا يوجد ملف عام متاح.</h1>
          <p>قد يكون صاحب الحساب اختار إبقاء ملفه خاصًا.</p>
        </div>
      )}
    </main>
  );
}
