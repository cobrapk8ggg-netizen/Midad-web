"use client";
import { useEffect, useState } from "react";
import { Tags, Check, Info } from "lucide-react";
import { supabase, list, insert, update } from "../lib/supabase";
import { isGuestActive } from "../lib/guest";
import { GENRE_LABELS, STATUS_LABELS, WARNING_LABELS } from "../lib/social";
import { errorMessage } from "./ui";
export default function NovelClassification({
  projectId,
  onError,
}: {
  projectId: string;
  onError: (s: string) => void;
}) {
  const [genres, setGenres] = useState<string[]>([]),
    [tags, setTags] = useState(""),
    [status, setStatus] = useState("ongoing"),
    [age, setAge] = useState("all"),
    [language, setLanguage] = useState("ar"),
    [warnings, setWarnings] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      list<{
        status: string;
        age_rating: string;
        language: string;
        warnings: string[];
      }>("novel_metadata", { project_id: projectId }),
      list<{ genre_code: string }>("project_genres", { project_id: projectId }),
      list<{ tag: string }>("novel_tags", { project_id: projectId }),
    ])
      .then(([m, g, t]) => {
        if (!active) return;
        if (m[0]) {
          setStatus(m[0].status);
          setAge(m[0].age_rating);
          setLanguage(m[0].language);
          setWarnings(m[0].warnings || []);
        }
        setGenres(g.map((x) => x.genre_code));
        setTags(t.map((x) => x.tag).join("، "));
        setReady(true);
      })
      .catch((e) => onError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [projectId]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      const ts = [
        ...new Set(
          tags
            .split(/[,،\n]/)
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        ),
      ];
      if (ts.length > 12 || ts.some((t) => t.length > 40))
        throw Error("استخدم حتى 12 وسمًا، وكل وسم حتى 40 حرفًا.");
      const metadata = { status, age_rating: age, language, warnings };
      if (isGuestActive()) {
        const rows = await list<{ id: string }>("novel_metadata", {
          project_id: projectId,
        });
        if (rows[0]) await update("novel_metadata", rows[0].id, metadata);
        else
          await insert("novel_metadata", {
            project_id: projectId,
            ...metadata,
          });
        const { guestRemove } = await import("../lib/guest");
        for (const table of ["project_genres", "novel_tags"])
          for (const row of await list<{ id: string }>(table, {
            project_id: projectId,
          }))
            await guestRemove(table, row.id);
        for (const genre_code of genres)
          await insert("project_genres", { project_id: projectId, genre_code });
        for (const tag of ts)
          await insert("novel_tags", { project_id: projectId, tag });
      } else {
        const { error } = await supabase.rpc("midad_save_novel_metadata", {
          p_id: projectId,
          p_metadata: metadata,
          p_genres: genres,
          p_tags: ts,
        });
        if (error) throw error;
      }
      setSaved(true);
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="novel-classification"
      onSubmit={save}
      onChange={() => setSaved(false)}
    >
      <div className="section-heading">
        <Tags size={20} />
        <h2>تصنيف الرواية</h2>
      </div>
      <p className="muted">
        عرّف القراء بعالم روايتك. هذه البيانات تظهر عند عرض الرواية للعامة.
      </p>
      {ready && (
        <>
          <fieldset className="genre-picker">
            <legend>الأنواع الأدبية — حتى أربعة</legend>
            {Object.entries(GENRE_LABELS).map(([code, label]) => (
              <label
                key={code}
                className={genres.includes(code) ? "selected" : ""}
              >
                <input
                  type="checkbox"
                  aria-label={"نوع " + label}
                  checked={genres.includes(code)}
                  disabled={!genres.includes(code) && genres.length >= 4}
                  onChange={(e) =>
                    setGenres((xs) =>
                      e.target.checked
                        ? [...xs, code]
                        : xs.filter((x) => x !== code),
                    )
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="classification-grid">
            <label className="field">
              حالة الرواية
              <select
                aria-label="حالة روايتي"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              الفئة العمرية
              <select
                aria-label="عمر قرّاء روايتي"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              >
                <option value="all">لجميع القرّاء</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </label>
            <label className="field">
              لغة الرواية
              <select
                aria-label="لغة الرواية"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="other">لغة أخرى</option>
              </select>
            </label>
          </div>
          <label className="field">
            وسوم الرواية
            <input
              aria-label="وسوم الرواية"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ارتقاء، عالم موازٍ، صداقة…"
            />
            <small>
              افصل بينها بفاصلة. حتى 12 وسمًا؛ الوسوم تساعد القرّاء في البحث.
            </small>
          </label>
          <fieldset className="content-warning-picker">
            <legend>تنبيهات المحتوى (اختياري)</legend>
            {Object.entries(WARNING_LABELS).map(([v, l]) => (
              <label key={v}>
                <input
                  type="checkbox"
                  checked={warnings.includes(v)}
                  onChange={(e) =>
                    setWarnings((xs) =>
                      e.target.checked ? [...xs, v] : xs.filter((x) => x !== v),
                    )
                  }
                />
                {l}
              </label>
            ))}
          </fieldset>
          <p className="classification-help">
            <Info size={15} />
            التصنيف العمري يحدّده الكاتب، ولا يعني مراجعة عمرية آلية.
          </p>
          <button className="primary full" disabled={busy}>
            {busy
              ? "جارٍ الحفظ…"
              : saved
                ? "تم حفظ التصنيف"
                : "حفظ تصنيف الرواية"}
            <Check size={16} />
          </button>
        </>
      )}
    </form>
  );
}
