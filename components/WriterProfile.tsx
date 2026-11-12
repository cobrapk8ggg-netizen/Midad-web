"use client";
import { useEffect, useState } from "react";
import {
  Pencil,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Camera,
  Link2,
  Check,
  BookOpen,
  Bookmark,
  ArrowLeft,
  Feather,
  LockKeyhole,
} from "lucide-react";
import { supabase, list } from "../lib/supabase";
import type { Project } from "../lib/types";
import {
  catalog,
  writerProfile,
  type WriterProfile,
  type WriterLink,
  type CatalogNovel,
} from "../lib/social";
import { safeLink } from "../lib/fonts";
import { Field, errorMessage } from "./ui";
import { SocialImage, useFilePreview, uploadWriterImage } from "./SocialImage";
import IdentityHeader from "./IdentityHeader";
import { FollowButton } from "./SocialActions";
import { NovelCard } from "./Discover";
type Shelf = { project_id: string; position: number; featured: boolean };
type App = {
  id: string;
  site_url: string;
  project_id: string | null;
  allow_write: boolean;
};
const blank = (id: string): WriterProfile => ({
  user_id: id,
  username: "",
  display_name: "",
  bio: "",
  tagline: "",
  location: "",
  avatar_path: null,
  banner_path: null,
  is_public: false,
});
export function Account({
  userId,
  onError,
}: {
  userId: string;
  onError: (s: string) => void;
}) {
  const [profile, setProfile] = useState<WriterProfile>(blank(userId)),
    [draft, setDraft] = useState<WriterProfile>(blank(userId)),
    [links, setLinks] = useState<WriterLink[]>([]),
    [shelf, setShelf] = useState<Shelf[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [apps, setApps] = useState<App[]>([]),
    [reading, setReading] = useState<CatalogNovel[]>([]),
    [publicBooks, setPublicBooks] = useState<CatalogNovel[]>([]),
    [tab, setTab] = useState("profile"),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [avatarFile, setAvatarFile] = useState<File | null>(null),
    [bannerFile, setBannerFile] = useState<File | null>(null);
  const avatarPreview = useFilePreview(avatarFile),
    bannerPreview = useFilePreview(bannerFile);
  async function load() {
    const [pr, ls, ss, ps, as, rs, bs] = await Promise.all([
      supabase
        .from("midad_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("midad_profile_links")
        .select("*")
        .eq("user_id", userId)
        .order("position"),
      supabase
        .from("midad_showcase")
        .select("*")
        .eq("user_id", userId)
        .order("position"),
      list<Project>("projects"),
      supabase.rpc("midad_connected_apps"),
      catalog({ p_saved: true, p_limit: 100 }),
      catalog({ p_author: userId, p_limit: 100 }),
    ]);
    if (pr.error || ls.error || ss.error || as.error)
      throw pr.error || ls.error || ss.error || as.error;
    let p = { ...blank(userId), ...pr.data };
    if (p.is_public && p.username) {
      const pub = await writerProfile(p.username);
      if (pub) p = { ...p, followers: pub.followers, following: pub.following };
    }
    setProfile(p);
    setDraft(p);
    setLinks(ls.data || []);
    setShelf(ss.data || []);
    setProjects(ps.filter((p) => p.user_id === userId));
    setApps(as.data || []);
    setReading(rs);
    setPublicBooks(bs);
    if (!pr.data) setTab("edit");
    setLoaded(true);
  }
  useEffect(() => {
    let active = true;
    void load().catch((e) => {
      if (active) onError(errorMessage(e));
    });
    return () => {
      active = false;
    };
  }, [userId]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const uploaded: string[] = [];
    let committed = false;
    try {
      if (!/^[a-z0-9_]{3,30}$/.test(draft.username.toLowerCase().trim())) {
        setTab("edit");
        throw new Error(
          "اختر اسم مستخدم من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية، ثم احفظ ملفك.",
        );
      }
      let avatar = draft.avatar_path,
        banner = draft.banner_path;
      if (avatarFile) {
        avatar = await uploadWriterImage(userId, avatarFile, "avatar");
        uploaded.push(avatar);
      }
      if (bannerFile) {
        banner = await uploadWriterImage(userId, bannerFile, "banner");
        uploaded.push(banner);
      }
      const cleanLinks = links
        .filter((l) => l.label.trim() || l.url.trim())
        .map((l, i) => {
          const url = safeLink(l.url);
          if (!url || !l.label.trim())
            throw Error("أكمل اسم كل رابط وعنوانه الصحيح.");
          return { label: l.label.trim(), url, position: i };
        });
      const value = {
        ...draft,
        username: draft.username.toLowerCase().trim(),
        display_name: draft.display_name.trim(),
        avatar_path: avatar,
        banner_path: banner,
      };
      const { error } = await supabase.rpc("midad_save_writer_profile", {
        p_profile: value,
        p_links: cleanLinks,
        p_showcase: shelf.map((s, i) => ({ ...s, position: i })),
      });
      if (error) throw error;
      committed = true;
      const old = [profile.avatar_path, profile.banner_path].filter(
        (p): p is string =>
          !!p && p !== avatar && p !== banner && p.startsWith(userId + "/"),
      );
      if (old.length) await supabase.storage.from("midad-assets").remove(old);
      setAvatarFile(null);
      setBannerFile(null);
      await load();
      setMessage("تم حفظ ملفك ورف رواياتك.");
      window.dispatchEvent(new Event("midad:profile-updated"));
    } catch (e) {
      if (!committed && uploaded.length)
        await supabase.storage.from("midad-assets").remove(uploaded);
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, d: number) {
    const xs = [...shelf];
    if (index + d < 0 || index + d >= xs.length) return;
    [xs[index], xs[index + d]] = [xs[index + d], xs[index]];
    setShelf(xs);
  }
  const selected = shelf
    .map((s) => projects.find((p) => p.id === s.project_id))
    .filter((p): p is Project => !!p);
  const summary = {
    ...(tab === "edit" ? draft : profile),
    links: tab === "edit" ? links : links.filter((l) => safeLink(l.url)),
    books: selected.map(
      (p) =>
        publicBooks.find((n) => n.id === p.id) || {
          id: p.id,
          title: p.title,
          chapter_count: 0,
        },
    ) as CatalogNovel[],
  };
  return (
    <main className="writer-account">
      <div className="account-topline">
        <div>
          <p className="eyebrow">مساحتك، بصوتك أنت</p>
          <span className="account-status">
            {profile.is_public ? (
              <>
                <Eye size={14} />
                ملفك ظاهر للقراء
              </>
            ) : (
              <>
                <LockKeyhole size={14} />
                ملفك خاص
              </>
            )}
          </span>
        </div>
        <div>
          {profile.is_public && (
            <a
              className="secondary-link"
              href={"/profile?username=" + encodeURIComponent(profile.username)}
              target="_blank"
              rel="noreferrer"
            >
              <Eye size={16} />
              افتح ملفي العام
            </a>
          )}
          <button
            className="primary"
            onClick={() => {
              setTab("edit");
              setMessage("");
            }}
          >
            <Pencil size={16} />
            تعديل الملف
          </button>
        </div>
      </div>
      {!loaded ? (
        <div className="profile-loading">نجهز لك صفحة الكاتب…</div>
      ) : (
        <>
          <IdentityHeader
            profile={summary}
            preview
            avatarPreview={avatarPreview}
            bannerPreview={bannerPreview}
          />
          <nav className="writer-tabs glass" aria-label="مساحة الكاتب">
            {[
              { id: "profile", label: "ملفي", icon: Feather },
              { id: "edit", label: "تعديل الملف", icon: Pencil },
              { id: "shelf", label: "رف رواياتي", icon: BookOpen },
              { id: "reading", label: "قائمة قراءتي", icon: Bookmark },
              { id: "apps", label: "التطبيقات", icon: Link2 },
            ].map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </nav>
          {message && (
            <p className="profile-success" role="status">
              <Check size={16} />
              {message}
            </p>
          )}
          {["edit", "shelf"].includes(tab) ? (
            <form className="writer-profile-editor" onSubmit={save}>
              <div className="profile-edit-content">
                {tab === "edit" ? (
                  <>
                    <div className="section-heading">
                      <h2>هوية تشبهك.</h2>
                      <p className="muted">
                        هذه صورتك أمام قرّائك. شاهد المعاينة أعلى الصفحة.
                      </p>
                    </div>
                    <div className="profile-image-fields">
                      {(["avatar", "banner"] as const).map((kind) => (
                        <div className="profile-image-field" key={kind}>
                          <SocialImage
                            kind={kind}
                            path={
                              kind === "avatar"
                                ? draft.avatar_path
                                : draft.banner_path
                            }
                            preview={
                              kind === "avatar" ? avatarPreview : bannerPreview
                            }
                            alt={
                              kind === "avatar"
                                ? "معاينة صورة الكاتب"
                                : "معاينة غلاف الملف"
                            }
                          />
                          <label className="image-pick">
                            <Camera size={17} />
                            {kind === "avatar"
                              ? "اختيار صورة البروفايل"
                              : "اختيار غلاف البروفايل"}
                            <input
                              aria-label={
                                kind === "avatar"
                                  ? "صورة البروفايل"
                                  : "غلاف البروفايل"
                              }
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              disabled={busy}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                if (
                                  ![
                                    "image/png",
                                    "image/jpeg",
                                    "image/webp",
                                  ].includes(f.type) ||
                                  f.size > 5 * 1024 * 1024
                                ) {
                                  onError(
                                    "اختر PNG أو JPG أو WebP حتى 5 ميغابايت.",
                                  );
                                  e.target.value = "";
                                  return;
                                }
                                if (kind === "avatar") setAvatarFile(f);
                                else setBannerFile(f);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              if (kind === "avatar") {
                                setAvatarFile(null);
                                setDraft((p) => ({ ...p, avatar_path: null }));
                              } else {
                                setBannerFile(null);
                                setDraft((p) => ({ ...p, banner_path: null }));
                              }
                            }}
                          >
                            <Trash2 size={13} />
                            إزالة {kind === "avatar" ? "الصورة" : "الغلاف"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="profile-form-grid">
                      <Field
                        label="اسمك الظاهر"
                        name="display_name"
                        value={draft.display_name}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            display_name: e.target.value,
                          }))
                        }
                        required
                        maxLength={80}
                      />
                      <Field
                        label="اسم المستخدم — لإضافتك إلى رواية"
                        name="username"
                        dir="ltr"
                        value={draft.username}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            username: e.target.value.toLowerCase(),
                          }))
                        }
                        pattern="[a-z0-9_]{3,30}"
                        minLength={3}
                        maxLength={30}
                        placeholder="your_name"
                        required
                      />
                      <Field
                        label="كلمات تعرّف بك"
                        name="tagline"
                        placeholder="كاتب فانتازيا، وصانع عوالم لا تنام."
                        value={draft.tagline}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, tagline: e.target.value }))
                        }
                        maxLength={100}
                      />
                      <Field
                        label="المكان (اختياري)"
                        name="location"
                        value={draft.location}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, location: e.target.value }))
                        }
                        maxLength={80}
                      />
                    </div>
                    <label className="field">
                      عنّي
                      <textarea
                        name="bio"
                        aria-label="عنّي"
                        maxLength={1000}
                        rows={5}
                        value={draft.bio}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, bio: e.target.value }))
                        }
                      />
                      <small>{draft.bio.length}/1000</small>
                    </label>
                    <div className="profile-links-editor">
                      <div className="section-heading">
                        <h3>روابطك</h3>
                        <button
                          type="button"
                          disabled={links.length >= 5}
                          onClick={() =>
                            setLinks((xs) => [...xs, { label: "", url: "" }])
                          }
                        >
                          <Plus size={15} />
                          إضافة رابط
                        </button>
                      </div>
                      <p className="muted">
                        موقعك، تليجرام، إنستغرام، أو مساحة أخرى تلتقي فيها
                        بقرّائك.
                      </p>
                      {links.map((l, i) => (
                        <div className="link-editor-row" key={i}>
                          <Field
                            label={"اسم الرابط " + (i + 1)}
                            value={l.label}
                            maxLength={40}
                            onChange={(e) =>
                              setLinks((xs) =>
                                xs.map((x, j) =>
                                  j === i ? { ...x, label: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="تليجرام"
                          />
                          <Field
                            label={"عنوان الرابط " + (i + 1)}
                            value={l.url}
                            type="url"
                            dir="ltr"
                            maxLength={500}
                            placeholder="https://"
                            onChange={(e) =>
                              setLinks((xs) =>
                                xs.map((x, j) =>
                                  j === i ? { ...x, url: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            aria-label={"إزالة الرابط " + (i + 1)}
                            onClick={() =>
                              setLinks((xs) => xs.filter((_, j) => j !== i))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="visibility-toggle">
                      <div>
                        <strong>ملف عام للكاتب</strong>
                        <p>
                          يعرض صورتك ونبذتك وروابطك والروايات التي تختارها على
                          رفك.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="إظهار ملفي للقراء داخل المنصة"
                        checked={!!draft.is_public}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            is_public: e.target.checked,
                          }))
                        }
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <h2>اختر ما يراه القرّاء.</h2>
                    <p className="muted">
                      أضف أي رواية تملكها إلى ملفك. يظهر الغلاف والنبذة والتصنيف
                      فقط؛ لا يُنشر نص أي فصل تلقائيًا. رتّب أعمالك أو ميّز واحدة في
                      مقدمة الرف.
                    </p>
                    <div className="showcase-picker">
                      {projects.map((p) => (
                        <label
                          key={p.id}
                          className={
                            "showcase-choice " +
                            (shelf.some((s) => s.project_id === p.id)
                              ? "chosen"
                              : "")
                          }
                        >
                          <input
                            type="checkbox"
                            aria-label={"إظهار " + p.title + " في ملفي"}
                            checked={shelf.some((s) => s.project_id === p.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setShelf((xs) => [
                                  ...xs,
                                  {
                                    project_id: p.id,
                                    position: xs.length,
                                    featured: false,
                                  },
                                ]);
                              else
                                setShelf((xs) =>
                                  xs.filter((s) => s.project_id !== p.id),
                                );
                            }}
                          />
                          <SocialImage
                            kind="cover"
                            path={p.cover_path}
                            alt={"غلاف " + p.title}
                          />
                          <div>
                            <strong>{p.title}</strong>
                            <small>
                              {p.description || "نبذة الرواية تظهر هنا"}
                            </small>
                          </div>
                          <span>
                            {shelf.some((s) => s.project_id === p.id)
                              ? "على رفّك"
                              : "خاصة"}
                          </span>
                        </label>
                      ))}
                    </div>
                    {!projects.length && (
                      <p className="help-callout">
                        أنشئ روايتك الأولى من المكتبة، ثم اختر ظهورها هنا.
                      </p>
                    )}
                    <h3 className="shelf-order-title">ترتيب الرف</h3>
                    {shelf.map((s, i) => (
                      <div className="shelf-order-row" key={s.project_id}>
                        <span>{i + 1}</span>
                        <strong>
                          {projects.find((p) => p.id === s.project_id)?.title}
                        </strong>
                        <button
                          type="button"
                          aria-label={
                            "تمييز " +
                            projects.find((p) => p.id === s.project_id)?.title
                          }
                          aria-pressed={s.featured}
                          onClick={() =>
                            setShelf((xs) =>
                              xs.map((x) => ({
                                ...x,
                                featured:
                                  x.project_id === s.project_id
                                    ? !x.featured
                                    : false,
                              })),
                            )
                          }
                        >
                          <Star
                            size={17}
                            fill={s.featured ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          type="button"
                          aria-label={"تقديم رواية " + (i + 1)}
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp size={17} />
                        </button>
                        <button
                          type="button"
                          aria-label={"تأخير رواية " + (i + 1)}
                          disabled={i === shelf.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown size={17} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="profile-save-bar glass">
                <span>
                  {busy
                    ? "جارٍ رفع التعديلات وحفظها…"
                    : "التغييرات تظهر للقرّاء بعد الحفظ."}
                </span>
                <button className="primary" disabled={busy}>
                  {busy ? "جارٍ الحفظ…" : "حفظ الملف الشخصي"}
                  <Check size={16} />
                </button>
              </div>
            </form>
          ) : tab === "apps" ? (
            <section className="writer-connected">
              <h2>تطبيقات تصل إلى رواياتك بإذنك.</h2>
              <p className="muted">
                من مكوّن مِداد في ChatGPT اطلب «اربط حسابي». يمكنك ربط أكثر من
                حساب وإلغاء وصول كل حساب مستقلًا.
              </p>
              {!apps.length ? (
                <p className="profile-empty">لا تطبيقات مرتبطة حتى الآن.</p>
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
                        const { error } = await supabase.rpc(
                          "midad_disconnect_app",
                          { bridge: a.id },
                        );
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
          ) : tab === "reading" ? (
            <section className="writer-shelf">
              <div className="section-heading">
                <h2>حكايات أعود إليها.</h2>
                <span>{reading.length.toLocaleString("ar")} رواية متاحة</span>
              </div>
              <div className="novel-discovery-grid">
                {reading.map((n) => (
                  <NovelCard key={n.id} novel={n} />
                ))}
              </div>
              {!reading.length && (
                <div className="profile-empty">
                  <Bookmark size={30} />
                  <p>احفظ الروايات من صفحة قراءتها لتجدها هنا.</p>
                  <a href="/discover">
                    اكتشف رواية <ArrowLeft size={16} />
                  </a>
                </div>
              )}
            </section>
          ) : (
            <section className="writer-shelf">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">من عوالمك إلى قرّائك</p>
                  <h2>على رفّي</h2>
                </div>
                <button onClick={() => setTab("shelf")}>
                  إدارة رف الروايات <Pencil size={15} />
                </button>
              </div>
              <div className="own-showcase-grid">
                {selected.map((p) => (
                  <article className="own-showcase-card" key={p.id}>
                    <SocialImage
                      kind="cover"
                      path={p.cover_path}
                      alt={"غلاف " + p.title}
                    />
                    <div>
                      <span className="eyebrow">
                        {shelf.find((s) => s.project_id === p.id)?.featured
                          ? "عمل مميّز"
                          : "من أعمالي"}
                      </span>
                      <h3>{p.title}</h3>
                      <p>{p.description || "أضف نبذة للرواية من تفاصيلها."}</p>
                      <span className="showcase-visibility">
                        {profile.is_public
                          ? "النبذة والغلاف ظاهران في ملفك"
                          : "سيظهر عند تفعيل الملف العام"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {!selected.length && (
                <div className="profile-empty">
                  <BookOpen size={35} />
                  <h3>رفّك يحمل حكايتك.</h3>
                  <p>اختر الروايات التي تريد عرضها. لا يشترط نشر فصولها.</p>
                  <button className="primary" onClick={() => setTab("shelf")}>
                    اختيار رواياتي <Plus size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
export function PublicProfile() {
  const [profile, setProfile] = useState<WriterProfile | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState("works");
  async function load() {
    const handle = new URLSearchParams(location.search).get("username") || "";
    try {
      setProfile(await writerProfile(handle));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <main className="public-writer-page">
      <div className="public-profile-nav">
        <a href="/">مِداد</a>
        <a href="/discover">
          اكتشف الروايات <ArrowLeft size={16} />
        </a>
      </div>
      {!ready ? (
        <div className="profile-loading">نفتح لك صفحة الكاتب…</div>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !profile ? (
        <section className="profile-empty">
          <LockKeyhole size={36} />
          <h1>لا يوجد ملف عام متاح.</h1>
          <p>قد يكون صاحب الحساب اختار إبقاء ملفه خاصًا.</p>
        </section>
      ) : (
        <>
          <IdentityHeader
            profile={profile}
            action={
              <FollowButton
                authorId={profile.user_id}
                onChanged={() => void load()}
              />
            }
          />
          <nav className="writer-tabs glass" aria-label="ملف الكاتب">
            <button
              className={tab === "works" ? "active" : ""}
              onClick={() => setTab("works")}
            >
              <BookOpen size={17} />
              الروايات <span>{profile.books?.length || 0}</span>
            </button>
            <button
              className={tab === "about" ? "active" : ""}
              onClick={() => setTab("about")}
            >
              <Feather size={17} />
              عن الكاتب
            </button>
          </nav>
          {tab === "works" ? (
            <section className="writer-shelf">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">حكايات اختار أن يشاركها معك</p>
                  <h2>على رفّ {profile.display_name}</h2>
                </div>
              </div>
              <div className="novel-discovery-grid">
                {profile.books?.map((n) => (
                  <NovelCard key={n.id} novel={n} showAuthor={false} />
                ))}
              </div>
              {!profile.books?.length && (
                <div className="profile-empty">
                  <BookOpen size={32} />
                  <p>لم يضف الكاتب روايات إلى رفّه العام بعد.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="writer-about">
              <Feather size={27} />
              <h2>عن {profile.display_name}</h2>
              <p>{profile.bio || "لم يكتب الكاتب نبذة بعد."}</p>
              {profile.tagline && <blockquote>{profile.tagline}</blockquote>}
            </section>
          )}
        </>
      )}
    </main>
  );
}
