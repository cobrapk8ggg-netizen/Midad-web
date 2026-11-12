"use client";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ArrowLeft,
  BookOpen,
  Star,
  Feather,
  ChevronDown,
  Info,
  Bookmark,
  Users,
  SlidersHorizontal,
  Globe,
  Trophy,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  catalog,
  writerProfile,
  GENRE_LABELS,
  STATUS_LABELS,
  WARNING_LABELS,
  type CatalogNovel,
} from "../lib/social";
import { SocialImage } from "./SocialImage";
import SocialActions from "./SocialActions";
import { errorMessage } from "./ui";
export function NovelCard({
  novel: n,
  showAuthor = true,
  rank,
}: {
  novel: CatalogNovel;
  showAuthor?: boolean;
  rank?: number;
}) {
  return (
    <article
      className={"discovery-novel " + (n.featured ? "featured-novel" : "")}
    >
      <a
        className="discovery-cover"
        href={"/novel?id=" + n.id}
        aria-label={"استكشف " + n.title}
      >
        <SocialImage path={n.cover_path} alt={"غلاف " + n.title} kind="cover" />
        <span className="novel-cover-title">{n.title}</span>
        {rank && (
          <span
            className="novel-rank"
            aria-label={"المرتبة في النتائج " + rank}
          >
            <Trophy size={15} />
            {rank.toLocaleString("ar")}
          </span>
        )}
        {n.featured && (
          <span className="featured-label">
            <Star size={12} />
            اختيار الكاتب
          </span>
        )}
        <span className="cover-bottom">مِداد</span>
      </a>
      <div className="discovery-novel-info">
        <div className="novel-label-row">
          <span>{STATUS_LABELS[n.status] || "مستمرة"}</span>
          {n.age_rating !== "all" && <span dir="ltr">{n.age_rating}</span>}
        </div>
        <a className="novel-title-link" href={"/novel?id=" + n.id}>
          <h3>{n.title}</h3>
        </a>
        {showAuthor &&
          (n.author_username ? (
            <a
              className="novel-author-link"
              href={
                "/profile?username=" + encodeURIComponent(n.author_username)
              }
            >
              {n.author_name}
            </a>
          ) : (
            <span className="novel-author-link">{n.author_name}</span>
          ))}
        <p className="novel-card-description">
          {n.description || "حكاية تنتظر قارئها الأول."}
        </p>
        <div className="novel-genre-list">
          {n.genres.slice(0, 2).map((g) => (
            <span key={g}>{GENRE_LABELS[g] || g}</span>
          ))}
        </div>
        <div className="novel-card-stats">
          <span>
            <BookOpen size={13} />
            {n.chapter_count
              ? Number(n.chapter_count).toLocaleString("ar") + " فصل"
              : "قريبًا"}
          </span>
          <span>
            <Star size={13} />
            {Number(n.rating_count) > 0 ? (
              <>
                {Number(n.rating_avg).toLocaleString("ar", {
                  maximumFractionDigits: 1,
                })}
                <small>({Number(n.rating_count).toLocaleString("ar")})</small>
              </>
            ) : (
              "بانتظار التقييم"
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
export function Community() {
  const [items, setItems] = useState<CatalogNovel[]>([]),
    [query, setQuery] = useState(""),
    [genre, setGenre] = useState(""),
    [status, setStatus] = useState(""),
    [age, setAge] = useState(""),
    [sort, setSort] = useState("recent"),
    [mode, setMode] = useState("all"),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [hasMore, setHasMore] = useState(false),
    [info, setInfo] = useState(false),
    [signed, setSigned] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") || "");
    setGenre(params.get("genre") || "");
    void supabase.auth
      .getSession()
      .then(({ data }) => setSigned(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_, s) => setSigned(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  const params = {
    p_query: query.trim(),
    p_genre: genre,
    p_status: status,
    p_age: age,
    p_sort: mode === "ranking" ? "rating" : sort,
    p_saved: mode === "saved",
    p_following: mode === "following",
    p_limit: 24,
  };
  const queryKey = JSON.stringify(params) + signed;
  const currentQuery = useRef(queryKey);
  currentQuery.current = queryKey;
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    const t = setTimeout(
      () =>
        void catalog(params)
          .then((data) => {
            if (active) {
              setItems(data);
              setHasMore(data.length === 24);
            }
          })
          .catch((e) => {
            if (active) setError(errorMessage(e));
          })
          .finally(() => {
            if (active) setBusy(false);
          }),
      250,
    );
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, genre, status, age, sort, mode, signed]);
  async function more() {
    const requestKey = queryKey;
    setBusy(true);
    try {
      const rows = await catalog({ ...params, p_offset: items.length });
      if (requestKey !== currentQuery.current) return;
      setItems((xs) => [
        ...xs,
        ...rows.filter((n) => !xs.some((x) => x.id === n.id)),
      ]);
      setHasMore(rows.length === 24);
    } catch (e) {
      if (requestKey === currentQuery.current) setError(errorMessage(e));
    } finally {
      if (requestKey === currentQuery.current) setBusy(false);
    }
  }
  return (
    <main className="discover-page">
      <header className="discover-masthead">
        <div>
          <p className="eyebrow">أصوات جديدة. عوالم أبعد.</p>
          <h1>
            حكاية تنتظرك،
            <br />
            <span>وكاتب يستحق أن تعرفه.</span>
          </h1>
          <p>تصفّح الروايات، اعثر على نوعك المفضّل، واتبع حكاية من أول فصل.</p>
        </div>
        <div className="discover-orbit" aria-hidden="true">
          <Feather size={40} />
          <span>مساحة عربية للحكايات</span>
        </div>
      </header>
      <div className="discovery-search glass">
        <Search size={21} />
        <input
          aria-label="ابحث عن رواية أو كاتب أو وسم"
          placeholder="عنوان، كاتب، أو وسم…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span>اكتشف عالمك القادم</span>
      </div>
      <nav className="discover-tabs" aria-label="مساحات الاكتشاف">
        {[
          { id: "all", name: "الروايات", i: BookOpen },
          { id: "ranking", name: "الترتيب العام", i: Trophy },
          { id: "following", name: "كتّاب أتابعهم", i: Users },
          { id: "saved", name: "قائمة قراءتي", i: Bookmark },
        ].map((t) => (
          <button
            key={t.id}
            className={mode === t.id ? "active" : ""}
            aria-pressed={mode === t.id}
            onClick={() => setMode(t.id)}
          >
            <t.i size={17} />
            {t.name}
          </button>
        ))}
      </nav>
      <div className="genre-rail" aria-label="الأنواع الأدبية">
        <button
          className={!genre ? "selected" : ""}
          onClick={() => setGenre("")}
        >
          كل الأنواع
        </button>
        {Object.entries(GENRE_LABELS).map(([code, label]) => (
          <button
            key={code}
            className={genre === code ? "selected" : ""}
            aria-pressed={genre === code}
            onClick={() => setGenre(code)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="discovery-filters">
        <label>
          <SlidersHorizontal size={15} />
          الحالة
          <select
            aria-label="حالة الرواية"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          الفئة العمرية
          <select
            aria-label="الفئة العمرية"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          >
            <option value="">كل الفئات</option>
            <option value="all">لجميع القرّاء</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>
        </label>
        <label className="sort-filter">
          ترتيب الروايات
          <select
            aria-label="ترتيب الروايات"
            value={mode === "ranking" ? "rating" : sort}
            onChange={(e) => {
              setSort(e.target.value);
              if (mode === "ranking") setMode("all");
            }}
          >
            <option value="recent">الأحدث تحديثًا</option>
            <option value="rating">الأعلى تقييمًا</option>
            <option value="popular">الأكثر تقييمات</option>
          </select>
        </label>
        <button
          className="ranking-help"
          aria-expanded={info}
          onClick={() => setInfo(!info)}
        >
          <Info size={16} />
          كيف يعمل الترتيب؟
        </button>
      </div>
      {info && (
        <div className="ranking-explainer">
          <h3>تقييمات حقيقية، وترتيب واضح.</h3>
          <p>
            تقييم واحد من 1 إلى 5 لكل قارئ. لا يقيّم الكاتب أو محرر الرواية
            عملهما. نرتّب الأعلى تقييمًا بمتوسط موزون يقلّل تأثير تقييم منفرد؛ نضيف
            وزن 5 تقييمات بمتوسط 3.5 عند حساب الترتيب، بينما النجوم المعروضة هي
            المتوسط الحقيقي. الترتيب عام داخل مِداد. عند استخدام البحث أو
            الفلاتر، تمثل أرقام المراتب ترتيب هذه النتائج.
          </p>
        </div>
      )}
      {(mode === "saved" || mode === "following") && !signed ? (
        <div className="discovery-empty">
          <Bookmark size={35} />
          <h2>هذه المساحة تحفظ ذوقك.</h2>
          <p>سجّل الدخول لتصل إلى قائمة قراءتك والكتّاب الذين تتابعهم.</p>
          <a className="primary" href="/">
            دخول إلى مِداد <ArrowLeft size={17} />
          </a>
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="discovery-results-heading">
            <h2>
              {query
                ? "نتائج بحثك"
                : genre
                  ? GENRE_LABELS[genre]
                  : mode === "saved"
                    ? "في قائمة قراءتك"
                    : mode === "following"
                      ? "من الكتّاب الذين تتابعهم"
                      : mode === "ranking"
                        ? "الترتيب العام في مِداد"
                        : sort === "rating"
                          ? "أصوات أحبّها القراء"
                          : "على رفوف مِداد"}
            </h2>
            <span role="status">
              {busy
                ? "نبحث بين الحكايات…"
                : items.length.toLocaleString("ar") + " رواية معروضة"}
            </span>
          </div>
          <div className="novel-discovery-grid" aria-busy={busy}>
            {items.map((n, i) => (
              <NovelCard
                key={n.id}
                novel={n}
                rank={
                  mode === "ranking" && Number(n.rating_count) > 0
                    ? i + 1
                    : undefined
                }
              />
            ))}
          </div>
          {!busy && !items.length && (
            <div className="discovery-empty">
              <BookOpen size={38} />
              <h2>
                {mode === "saved"
                  ? "أول حكاية تحفظها ستجدها هنا."
                  : query || genre || age || status
                    ? "لا روايات بهذه الخيارات بعد."
                    : "هنا تلتقي أول حكاية بقارئها."}
              </h2>
              <p>
                {mode === "following"
                  ? "اتبع كاتبًا من ملفه لتظهر رواياته هنا."
                  : "تظهر الروايات عندما يختار أصحابها عرضها أو نشر فصولها."}
              </p>
              {(query || genre || age || status) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setGenre("");
                    setAge("");
                    setStatus("");
                  }}
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          )}
          {hasMore && (
            <button
              className="load-more"
              disabled={busy}
              onClick={() => void more()}
            >
              اكتشف روايات أكثر <ChevronDown size={17} />
            </button>
          )}
        </>
      )}
    </main>
  );
}
export function NovelLanding() {
  const [novel, setNovel] = useState<CatalogNovel | null>(null),
    [chapters, setChapters] = useState<
      { id: string; title: string; position: number; word_count: number }[]
    >([]),
    [ready, setReady] = useState(false),
    [authorPublic, setAuthorPublic] = useState(false),
    [error, setError] = useState("");
  async function load() {
    const id = new URLSearchParams(location.search).get("id");
    try {
      const [ns, cs] = await Promise.all([
        catalog({ p_novel: id, p_limit: 1 }),
        supabase.rpc("midad_public_chapter_index", { pid: id }),
      ]);
      if (cs.error) throw cs.error;
      const n = ns[0] || null;
      setNovel(n);
      setChapters(cs.data || []);
      if (n?.author_username)
        setAuthorPublic(!!(await writerProfile(n.author_username)));
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
    <main className="public-novel-page">
      <div className="public-profile-nav">
        <a href="/">مِداد</a>
        <a href="/discover">
          كل الروايات <ArrowLeft size={16} />
        </a>
      </div>
      {!ready ? (
        <p className="profile-loading">نفتح لك باب الحكاية…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !novel ? (
        <section className="profile-empty">
          <LockIcon />
          <h1>الرواية غير متاحة للعامة.</h1>
          <p>قد يكون الكاتب اختار إبقاءها خاصة.</p>
        </section>
      ) : (
        <>
          <header className="public-novel-hero">
            <div className="novel-public-cover">
              <SocialImage
                kind="cover"
                path={novel.cover_path}
                alt={"غلاف " + novel.title}
              />
              {!novel.cover_path && <h2>{novel.title}</h2>}
            </div>
            <div className="public-novel-intro">
              <div className="novel-label-row">
                <span>{STATUS_LABELS[novel.status]}</span>
                <span>
                  {novel.age_rating === "all"
                    ? "لجميع القرّاء"
                    : novel.age_rating}
                </span>
              </div>
              <h1>{novel.title}</h1>
              {authorPublic ? (
                <a
                  className="novel-byline"
                  href={
                    "/profile?username=" +
                    encodeURIComponent(novel.author_username!)
                  }
                >
                  <SocialImage path={novel.author_avatar} alt="صورة الكاتب" />
                  {novel.author_name}
                  <ArrowLeft size={14} />
                </a>
              ) : (
                <p className="novel-byline">بقلم {novel.author_name}</p>
              )}
              <p className="novel-public-description">
                {novel.description || "لم يضع الكاتب نبذة بعد."}
              </p>
              <div className="public-novel-genres">
                {novel.genres.map((g) => (
                  <a key={g} href={"/discover?genre=" + encodeURIComponent(g)}>
                    {GENRE_LABELS[g] || g}
                  </a>
                ))}
              </div>
              <div className="novel-public-stats">
                <span>
                  <BookOpen size={17} />
                  {Number(novel.chapter_count).toLocaleString("ar")} فصل
                </span>
                <span>
                  {Number(novel.word_count).toLocaleString("ar")} كلمة منشورة
                </span>
                <span>
                  <Star size={17} />
                  {novel.rating_count
                    ? Number(novel.rating_avg).toLocaleString("ar", {
                        maximumFractionDigits: 1,
                      }) +
                      " · " +
                      novel.rating_count +
                      " تقييم"
                    : "بانتظار أول تقييم"}
                </span>
              </div>
              {chapters[0] && (
                <a
                  className="primary start-reading"
                  href={
                    "/read?novel=" + novel.id + "&chapter=" + chapters[0].id
                  }
                >
                  ابدأ القراءة <ArrowLeft size={18} />
                </a>
              )}
            </div>
          </header>
          <section className="novel-social-panel glass">
            <SocialActions
              authorId={novel.author_id}
              novelId={novel.id}
              allowFollow={authorPublic}
              onChanged={() => void load()}
            />
          </section>
          {novel.tags.length > 0 && (
            <div className="public-novel-tags">
              {novel.tags.map((t) => (
                <a href={"/discover?q=" + encodeURIComponent(t)} key={t}>
                  #{t}
                </a>
              ))}
            </div>
          )}
          {novel.warnings.length > 0 && (
            <div className="novel-content-notice">
              <Info size={18} />
              <div>
                <strong>تنبيهات اختارها الكاتب</strong>
                <p>
                  {novel.warnings
                    .map((w) => WARNING_LABELS[w] || w)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}
          <section className="public-chapter-index">
            <div className="section-heading">
              <div>
                <p className="eyebrow">كل باب يفتح حكاية</p>
                <h2>الفصول</h2>
              </div>
              <span>{chapters.length.toLocaleString("ar")} فصل متاح</span>
            </div>
            {chapters.map((c, i) => (
              <a
                className="public-chapter-link"
                key={c.id}
                href={"/read?novel=" + novel.id + "&chapter=" + c.id}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{c.title}</strong>
                <small>{Number(c.word_count).toLocaleString("ar")} كلمة</small>
                <ArrowLeft size={17} />
              </a>
            ))}
            {!chapters.length && (
              <div className="profile-empty">
                <Feather size={33} />
                <h3>الحكاية تتكوّن على مهل.</h3>
                <p>
                  اختار الكاتب عرض الرواية، ولم ينشر فصولها بعد. عرض الغلاف
                  والنبذة لا يكشف نصوصه الخاصة.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
function LockIcon() {
  return <BookOpen size={35} />;
}
