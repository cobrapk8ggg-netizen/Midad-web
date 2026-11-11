"use client";
import { useEffect, useRef, useState } from "react";
import { Timer, Play, Square, Check } from "lucide-react";
import { insert, list } from "../lib/supabase";
import { errorMessage } from "./ui";
type Session = {
  id: string;
  duration: number;
  word_delta: number;
  started_at: string;
  ended_at: string;
};
type Run = { id: string; start: number; end: number; baseline: number };
export default function Sprint({
  projectId,
  userId,
  getWords,
  onError,
  bookId,
}: {
  projectId: string;
  userId: string;
  getWords: () => number;
  onError: (s: string) => void;
  bookId: string;
}) {
  const key = "midad:sprint:" + userId + ":" + projectId + ":" + bookId;
  const [run, setRun] = useState<Run | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [now, setNow] = useState(Date.now());
  const [words, setWords] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState(false);
  const currentWords = useRef(getWords);
  currentWords.current = getWords;
  async function load() {
    try {
      setSessions(await list<Session>("sessions", { project_id: projectId }));
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setRun(JSON.parse(raw));
      } catch {
        localStorage.removeItem(key);
      }
    }
    void load();
    const t = setInterval(() => {
      setNow(Date.now());
      setWords(currentWords.current());
    }, 1000);
    return () => clearInterval(t);
  }, [key]);
  async function finish() {
    if (!run) return;
    setBusy(true);
    try {
      const ended = Math.min(Date.now(), run.end);
      await insert("sessions", {
        id: run.id,
        project_id: projectId,
        started_at: new Date(run.start).toISOString(),
        ended_at: new Date(ended).toISOString(),
        duration: Math.max(0, Math.floor((ended - run.start) / 1000)),
        word_delta: Math.max(0, currentWords.current() - run.baseline),
      });
      localStorage.removeItem(key);
      setRun(null);
      await load();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const remaining = run
    ? Math.max(0, Math.ceil((run.end - now) / 1000))
    : minutes * 60;
  return (
    <section className="sprint-panel">
      <div className="section-actions">
        <h3>
          <Timer size={16} />
          جلسة كتابة
        </h3>
        <small>{sessions.length.toLocaleString("ar")} جلسة</small>
      </div>
      <div className="sprint-clock" dir="ltr">
        {String(Math.floor(remaining / 60)).padStart(2, "0")}
        <span>:</span>
        {String(remaining % 60).padStart(2, "0")}
      </div>
      {run ? (
        <>
          <p className="sprint-delta">
            +{Math.max(0, words - run.baseline).toLocaleString("ar")} كلمة في
            الكتاب
          </p>
          <button
            className="full"
            disabled={busy}
            onClick={() => void finish()}
          >
            {remaining === 0 ? <Check size={15} /> : <Square size={14} />}إنهاء
            وحفظ الجلسة
          </button>
          {remaining === 0 && (
            <p role="status">انتهى الوقت. احفظ نتيجة جلستك.</p>
          )}
        </>
      ) : (
        <>
          <label className="field">
            مدة الجلسة
            <select
              value={minutes}
              onChange={(e) => setMinutes(+e.target.value)}
            >
              <option value="5">٥ دقائق</option>
              <option value="15">١٥ دقيقة</option>
              <option value="25">٢٥ دقيقة</option>
              <option value="45">٤٥ دقيقة</option>
            </select>
          </label>
          <button
            className="full sprint-start"
            onClick={() => {
              const r = {
                id: crypto.randomUUID(),
                start: Date.now(),
                end: Date.now() + minutes * 60000,
                baseline: currentWords.current(),
              };
              localStorage.setItem(key, JSON.stringify(r));
              setWords(r.baseline);
              setRun(r);
              setNow(Date.now());
            }}
          >
            <Play size={15} />
            ابدأ جلسة كتابة
          </button>
        </>
      )}
      <div className="sprint-stats">
        <span>
          {sessions.reduce((s, r) => s + r.word_delta, 0).toLocaleString("ar")}{" "}
          كلمة
        </span>
        <span>
          {Math.floor(
            sessions.reduce((s, r) => s + r.duration, 0) / 60,
          ).toLocaleString("ar")}{" "}
          دقيقة
        </span>
      </div>
    </section>
  );
}
