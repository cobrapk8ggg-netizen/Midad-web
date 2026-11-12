"use client";
import { useEffect, useState } from "react";
import { Plus, Waypoints, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { list, insert, update, remove } from "../lib/supabase";
import type { Book, Chapter, Scene, PlotEvent } from "../lib/types";
import { Dialog, Field, errorMessage } from "./ui";
type Arc = {
  id: string;
  title: string;
  goal: string;
  conflict: string;
  outcome: string;
  position: number;
};
type Event = PlotEvent & { arc_id?: string; scene_id?: string };
export default function Plan({
  projectId,
  onOpenScene,
  onError,
}: {
  projectId: string;
  onOpenScene: (scene: Scene, book: Book) => void;
  onError: (message: string) => void;
}) {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [scenes, setScenes] = useState<(Scene & { book: Book })[]>([]);
  const [mode, setMode] = useState("board");
  const [modal, setModal] = useState("");
  const [edit, setEdit] = useState<Arc | Event | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [a, e, books] = await Promise.all([
        list<Arc>("arcs", { project_id: projectId }),
        list<Event>("events", { project_id: projectId }),
        list<Book>("books", { project_id: projectId }),
      ]);
      setArcs(a.sort((x, y) => x.position - y.position));
      setEvents(e.sort((x, y) => x.position - y.position));
      const cs = await Promise.all(
        books.map(async (book) => ({
          book,
          chapters: await list<Chapter>("chapters", { book_id: book.id }),
        })),
      );
      const ss = await Promise.all(
        cs.flatMap(({ book, chapters }) =>
          chapters.map(async (c) =>
            (await list<Scene>("scenes", { chapter_id: c.id })).map((s) => ({
              ...s,
              book,
            })),
          ),
        ),
      );
      setScenes(ss.flat());
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, [projectId]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const value = Object.fromEntries(f.entries());
    if (modal === "events") {
      value.scene_id = value.scene_id || (null as unknown as string);
      value.arc_id = value.arc_id || (null as unknown as string);
    }
    try {
      if (edit) await update(modal, edit.id, value);
      else
        await insert(modal, {
          ...value,
          project_id: projectId,
          position: modal === "arcs" ? arcs.length : events.length,
        });
      setModal("");
      await load();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function del(table: string, id: string) {
    if (!confirm("حذف هذا العنصر؟")) return;
    try {
      await remove(table, id);
      await load();
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  async function move(e: Event, stage: string) {
    try {
      await update("events", e.id, { stage });
      await load();
    } catch (error) {
      onError(errorMessage(error));
    }
  }
  function eventCard(e: Event) {
    const linked = scenes.find((s) => s.id === e.scene_id);
    return (
      <article
        key={e.id}
        draggable
        onDragStart={(d) => d.dataTransfer.setData("text/plain", e.id)}
      >
        <span className="eyebrow">
          {arcs.find((a) => a.id === e.arc_id)?.title || "حدث مستقل"}
        </span>
        <h3>{e.title}</h3>
        <p>{e.body}</p>
        <small>{e.story_date || "لم يحدد وقت بعد"}</small>
        {linked && (
          <button
            className="scene-link"
            onClick={() => onOpenScene(linked, linked.book)}
          >
            {linked.title}
            <ArrowLeft size={13} />
          </button>
        )}
        <select
          aria-label={"حالة " + e.title}
          value={e.stage}
          onChange={(v) => void move(e, v.target.value)}
        >
          <option value="idea">فكرة</option>
          <option value="draft">قيد الكتابة</option>
          <option value="done">مكتمل</option>
        </select>
        <div className="card-actions">
          <button
            onClick={() => {
              setEdit(e);
              setModal("events");
            }}
          >
            <Pencil size={14} />
            تحرير
          </button>
          <button
            aria-label={"حذف الحدث " + e.title}
            onClick={() => void del("events", e.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </article>
    );
  }
  return (
    <main className="collection">
      <div className="collection-heading">
        <div>
          <span className="eyebrow">كل خيط يجد طريقه إلى الحكاية</span>
          <h1>أحداث الرواية</h1>
          <p className="muted">
            ابدأ بحدث: ماذا سيحدث في روايتك؟ رتّبه هنا ثم انقله إلى «قيد الكتابة»
            أو «مكتمل». خطوط الأحداث اختيارية لتجميع مشكلة أو رحلة مشتركة.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setModal("events");
          }}
        >
          <Plus size={16} />
          حدث جديد
        </button>
      </div>
      <div className="segmented">
        <button
          className={mode === "board" ? "active" : ""}
          onClick={() => setMode("board")}
        >
          ترتيب الأحداث
        </button>
        <button
          className={mode === "timeline" ? "active" : ""}
          onClick={() => setMode("timeline")}
        >
          الخط الزمني
        </button>
        <button
          className={mode === "arcs" ? "active" : ""}
          onClick={() => setMode("arcs")}
        >
          خطوط الأحداث
        </button>
      </div>
      {mode === "board" ? (
        <div className="plot-board">
          {[
            { id: "idea", title: "بذرة الحكاية" },
            { id: "draft", title: "قيد الكتابة" },
            { id: "done", title: "حدث مكتمل" },
          ].map((col) => (
            <section
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const item = events.find(
                  (x) => x.id === e.dataTransfer.getData("text/plain"),
                );
                if (item) void move(item, col.id);
              }}
            >
              <h2>
                {col.title}
                <span>{events.filter((e) => e.stage === col.id).length}</span>
              </h2>
              {events.filter((e) => e.stage === col.id).map(eventCard)}
            </section>
          ))}
        </div>
      ) : mode === "timeline" ? (
        <div className="timeline">
          {[...events]
            .sort((a, b) => a.story_date.localeCompare(b.story_date))
            .map((e) => (
              <div key={e.id} className="timeline-event">
                <time>{e.story_date || "دون تاريخ"}</time>
                {eventCard(e)}
              </div>
            ))}
          {!events.length && <p>أضف حدثًا ليظهر على الخط الزمني.</p>}
        </div>
      ) : (
        <>
          <div className="section-actions">
            <h2>أقواس الحكاية</h2>
            <button
              onClick={() => {
                setEdit(null);
                setModal("arcs");
              }}
            >
              <Plus size={16} />
              خط أحداث جديد
            </button>
          </div>
          <div className="entity-grid">
            {arcs.map((a) => (
              <article key={a.id} className="entity-card arc-card">
                <Waypoints size={24} />
                <h2>{a.title}</h2>
                <p>
                  <strong>الهدف:</strong> {a.goal || "لم يحدد"}
                </p>
                <p>
                  <strong>الصراع:</strong> {a.conflict || "لم يحدد"}
                </p>
                <p>
                  <strong>النتيجة:</strong> {a.outcome || "لم تحدد"}
                </p>
                <small>
                  {events.filter((e) => e.arc_id === a.id).length} أحداث مرتبطة
                </small>
                <div className="card-actions">
                  <button
                    onClick={() => {
                      setEdit(a);
                      setModal("arcs");
                    }}
                  >
                    <Pencil size={14} />
                    تحرير
                  </button>
                  <button
                    aria-label={"حذف خط الأحداث " + a.title}
                    onClick={() => void del("arcs", a.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {modal && (
        <Dialog
          title={modal === "arcs" ? "قوس سردي" : "تفاصيل الحدث"}
          onClose={() => setModal("")}
        >
          <form onSubmit={save}>
            <Field
              label="العنوان"
              name="title"
              defaultValue={edit?.title || ""}
              required
            />
            {modal === "arcs" ? (
              <>
                <Field
                  label="ما الهدف من هذا الخط؟"
                  name="goal"
                  defaultValue={edit && "goal" in edit ? edit.goal : ""}
                />
                <Field
                  label="الصراع"
                  name="conflict"
                  defaultValue={edit && "conflict" in edit ? edit.conflict : ""}
                />
                <Field
                  label="النتيجة"
                  name="outcome"
                  defaultValue={edit && "outcome" in edit ? edit.outcome : ""}
                />
              </>
            ) : (
              <>
                <label className="field">
                  التفاصيل
                  <textarea
                    aria-label="التفاصيل"
                    name="body"
                    rows={4}
                    defaultValue={edit && "body" in edit ? edit.body : ""}
                  />
                </label>
                <Field
                  label="التاريخ داخل الحكاية"
                  name="story_date"
                  defaultValue={
                    edit && "story_date" in edit ? edit.story_date : ""
                  }
                  placeholder="2040-03-21"
                />
                <label className="field">
                  خط الأحداث (اختياري)
                  <select
                    aria-label="خط الأحداث (اختياري)"
                    name="arc_id"
                    defaultValue={
                      edit && "arc_id" in edit ? edit.arc_id || "" : ""
                    }
                  >
                    <option value="">حدث مستقل</option>
                    {arcs.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  جزء الفصل المرتبط (اختياري)
                  <select
                    aria-label="جزء الفصل المرتبط (اختياري)"
                    name="scene_id"
                    defaultValue={
                      edit && "scene_id" in edit ? edit.scene_id || "" : ""
                    }
                  >
                    <option value="">دون مشهد</option>
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.book.title} / {s.title}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <button className="primary full" disabled={busy}>
              حفظ
            </button>
          </form>
        </Dialog>
      )}
    </main>
  );
}
