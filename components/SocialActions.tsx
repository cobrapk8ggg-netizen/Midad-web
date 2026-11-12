"use client";
import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Bookmark, Star, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Dialog, Field, errorMessage } from "./ui";
export function FollowButton({
  authorId,
  onChanged,
}: {
  authorId: string;
  onChanged?: () => void;
}) {
  return <SocialActions authorId={authorId} onChanged={onChanged} followOnly />;
}
export default function SocialActions({
  authorId,
  novelId,
  onChanged,
  followOnly = false,
  allowFollow = true,
}: {
  authorId: string;
  novelId?: string;
  onChanged?: () => void;
  followOnly?: boolean;
  allowFollow?: boolean;
}) {
  const [user, setUser] = useState<string | null>(null),
    [following, setFollowing] = useState(false),
    [saved, setSaved] = useState(false),
    [rating, setRating] = useState(0),
    [editor, setEditor] = useState(false),
    [busy, setBusy] = useState(false),
    [login, setLogin] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user.id || null));
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user.id || null);
      if (session) setLogin(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) {
      setFollowing(false);
      setRating(0);
      setSaved(false);
      return;
    }
    let active = true;
    void (async () => {
      const f = await supabase
        .from("midad_follows")
        .select("author_id")
        .eq("follower_id", user)
        .eq("author_id", authorId);
      if (f.error) throw f.error;
      if (active) setFollowing(!!f.data.length);
      if (novelId) {
        const [r, s, m] = await Promise.all([
          supabase
            .from("midad_ratings")
            .select("score")
            .eq("user_id", user)
            .eq("project_id", novelId),
          supabase
            .from("midad_reading_list")
            .select("project_id")
            .eq("user_id", user)
            .eq("project_id", novelId),
          supabase
            .from("midad_members")
            .select("role")
            .eq("member_id", user)
            .eq("project_id", novelId),
        ]);
        if (r.error || s.error || m.error) throw r.error || s.error || m.error;
        if (active) {
          setRating(r.data[0]?.score || 0);
          setSaved(!!s.data.length);
          setEditor(m.data.some((v) => v.role === "editor"));
        }
      }
    })().catch((e) => setError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [user, authorId, novelId]);
  async function run(action: () => Promise<void>) {
    if (!user) {
      setLogin(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await action();
      onChanged?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className={"social-actions " + (followOnly ? "follow-only" : "")}>
        {allowFollow && user !== authorId && (
          <button
            className={following ? "following-button" : "primary"}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = following
                  ? await supabase
                      .from("midad_follows")
                      .delete()
                      .eq("follower_id", user!)
                      .eq("author_id", authorId)
                  : await supabase
                      .from("midad_follows")
                      .insert({ follower_id: user, author_id: authorId });
                if (r.error) throw r.error;
                setFollowing(!following);
              })
            }
          >
            {following ? <UserCheck size={17} /> : <UserPlus size={17} />}
            <span>{following ? "تتابعه" : "متابعة الكاتب"}</span>
          </button>
        )}
        {novelId && !followOnly && (
          <>
            <button
              className={saved ? "saved-reading" : ""}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = saved
                    ? await supabase
                        .from("midad_reading_list")
                        .delete()
                        .eq("user_id", user!)
                        .eq("project_id", novelId)
                    : await supabase
                        .from("midad_reading_list")
                        .insert({ user_id: user, project_id: novelId });
                  if (r.error) throw r.error;
                  setSaved(!saved);
                })
              }
            >
              <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? "في قائمة قراءتي" : "احفظ للقراءة"}
            </button>
            <div className="rating-control">
              <span>{rating ? "تقييمك" : "قيّم الرواية"}</span>
              <div role="group" aria-label="تقييم الرواية">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={busy || user === authorId || editor}
                    aria-label={"تقييم " + n + " من 5"}
                    aria-pressed={n === rating}
                    onClick={() =>
                      void run(async () => {
                        const { error } = await supabase
                          .from("midad_ratings")
                          .upsert(
                            {
                              project_id: novelId,
                              user_id: user,
                              score: n,
                              updated_at: new Date().toISOString(),
                            },
                            { onConflict: "project_id,user_id" },
                          );
                        if (error) throw error;
                        setRating(n);
                      })
                    }
                  >
                    <Star
                      size={19}
                      fill={n <= rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  className="remove-rating"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const { error } = await supabase
                        .from("midad_ratings")
                        .delete()
                        .eq("project_id", novelId)
                        .eq("user_id", user!);
                      if (error) throw error;
                      setRating(0);
                    })
                  }
                >
                  إزالة تقييمي
                </button>
              )}
              {(user === authorId || editor) && (
                <small>
                  التقييم للقراء؛ لا يستطيع صاحب العمل أو محرره تقييمه.
                </small>
              )}
            </div>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="social-error">
          {error}
        </p>
      )}
      {login && (
        <Dialog title="ادخل إلى مجتمع مِداد" onClose={() => setLogin(false)}>
          <p className="muted">حسابك يحفظ متابعاتك وتقييماتك وقائمة قراءتك.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              void supabase.auth
                .signInWithPassword({
                  email: String(f.get("email")),
                  password: String(f.get("password")),
                })
                .then(({ error }) => {
                  if (error) throw error;
                  setLogin(false);
                })
                .catch((e) => setError(errorMessage(e)))
                .finally(() => setBusy(false));
            }}
          >
            <Field
              label="البريد الإلكتروني"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
            />
            <Field
              label="كلمة المرور"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button className="primary full" disabled={busy}>
              {busy ? "جارٍ الدخول…" : "دخول إلى مِداد"}
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
          <a className="profile-link" href="/" target="_blank" rel="noreferrer">
            إنشاء حساب جديد
          </a>
        </Dialog>
      )}
    </>
  );
}
