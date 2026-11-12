"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { FONT_OPTIONS } from "./fonts";
type Prefs = { size: number; width: number; font: string; lineHeight: number };
const defaults: Prefs = {
  size: 24,
  width: 720,
  font: "amiri",
  lineHeight: 2.2,
};
const clean = (p: Partial<Prefs>): Prefs => ({
  size: p.size && p.size >= 16 && p.size <= 40 ? p.size : 24,
  width: p.width && p.width >= 420 && p.width <= 900 ? p.width : 720,
  font: FONT_OPTIONS.some((f) => f.id === p.font) ? p.font! : "amiri",
  lineHeight:
    p.lineHeight && p.lineHeight >= 1.4 && p.lineHeight <= 3
      ? p.lineHeight
      : 2.2,
});
export function useWriterPreferences(
  userId: string | undefined,
  guest: boolean,
) {
  const [value, setValue] = useState<Prefs>(defaults),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0),
    [status, setStatus] = useState("local");
  const baseline = useRef(""),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setReady(false);
    const key = "midad:editor:" + userId;
    let cached:
      (Partial<Prefs> & { updatedAt?: number; dirty?: boolean }) | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) || "null");
    } catch {}
    const local = clean(cached || defaults);
    setValue(local);
    const finish = (p: Prefs) => {
      if (active) {
        baseline.current = cached?.dirty ? "" : JSON.stringify(p);
        setValue(p);
        setReady(true);
      }
    };
    if (guest) {
      finish(local);
      return () => {
        active = false;
      };
    }
    void supabase
      .from("midad_preferences")
      .select("settings,updated_at")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus("local");
          finish(local);
          return;
        }
        const useLocal =
          !!cached &&
          (cached.dirty ||
            Number(cached.updatedAt || 0) >
              new Date(data?.updated_at || 0).getTime());
        const selected = useLocal ? local : clean(data?.settings || local);
        if (!useLocal) cached = null;
        setStatus("synced");
        finish(selected);
      });
    return () => {
      active = false;
    };
  }, [userId, guest]);
  function persist(next: Prefs, stamp: number) {
    const key = "midad:editor:" + userId;
    const encoded = JSON.stringify(next);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user.id !== userId) return;
        const { error } = await supabase.from("midad_preferences").upsert(
          {
            user_id: userId,
            settings: next,
            updated_at: new Date(stamp).toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (error) {
          setStatus("local");
          throw error;
        }
        baseline.current = encoded;
        try {
          const last = JSON.parse(localStorage.getItem(key) || "{}");
          if (last.updatedAt === stamp) {
            localStorage.setItem(
              key,
              JSON.stringify({ ...last, dirty: false }),
            );
            setStatus("synced");
          }
        } catch {
          setStatus("storage-error");
        }
      });
    return queue.current;
  }
  async function flushPreferences() {
    if (!userId) return;
    const stamp = Date.now();
    localStorage.setItem(
      "midad:editor:" + userId,
      JSON.stringify({ ...value, updatedAt: stamp, dirty: !guest }),
    );
    if (guest) {
      baseline.current = JSON.stringify(value);
      setStatus("local");
      return;
    }
    await persist(value, stamp);
  }
  useEffect(() => {
    if (!ready || !userId) return;
    const key = "midad:editor:" + userId,
      encoded = JSON.stringify(value);
    if (encoded === baseline.current) return;
    const stamp = Date.now();
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ...value, updatedAt: stamp, dirty: !guest }),
      );
    } catch {
      setStatus("storage-error");
      return;
    }
    if (guest) {
      baseline.current = encoded;
      setStatus("local");
      return;
    }
    setStatus("pending");
    const timer = setTimeout(() => {
      void persist(value, stamp).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [value, ready, userId, guest, retry]);
  useEffect(() => {
    const fn = () => setRetry((x) => x + 1);
    window.addEventListener("online", fn);
    return () => window.removeEventListener("online", fn);
  }, []);
  return {
    ...value,
    ready,
    flushPreferences,
    preferenceStatus: status,
    setSize: (size: number) => setValue((p) => ({ ...p, size })),
    setWidth: (width: number) => setValue((p) => ({ ...p, width })),
    setFont: (font: string) => setValue((p) => ({ ...p, font })),
    setLineHeight: (lineHeight: number) =>
      setValue((p) => ({ ...p, lineHeight })),
  };
}
