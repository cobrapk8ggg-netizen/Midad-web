"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  UserRound,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { list, insert, update, remove } from "../lib/supabase";
import type { Project, Entity, Note, PlotEvent } from "../lib/types";
import { Dialog, Field, errorMessage } from "./ui";
import Relationships from "./Relationships";
import { PrivateImage, AssetUpload } from "./Assets";
export default function Workspace({
  project,
  view,
  onError,
}: {
  project: Project;
  view: string;
  onError: (e: string) => void;
}) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<PlotEvent[]>([]);
  const [kind, setKind] = useState("character");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Entity | Note | PlotEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeline, setTimeline] = useState(false);
  async function load() {
    try {
      if (view === "world")
        setEntities(await list<Entity>("entities", { project_id: project.id }));
      else if (view === "notes")
        setNotes(await list<Note>("notes", { project_id: project.id }));
      else
        setEvents(
          (await list<PlotEvent>("events", { project_id: project.id })).sort(
            (a, b) => a.position - b.position,
          ),
        );
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, [view, project.id]);
  const table =
    view === "world" ? "entities" : view === "notes" ? "notes" : "events";
  const title =
    view === "world"
      ? "دليل العالم"
      : view === "notes"
        ? "أفكار على الهامش"
        : "خيوط الحكاية";
  const itemLabel =
    view === "world"
      ? kind === "character"
        ? "شخصية"
        : "مكان"
      : view === "notes"
        ? "ملاحظة"
        : "حدث";
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const data = Object.fromEntries(f.entries());
    try {
      if (edit) await update(table, edit.id, data);
      else
        await insert(table, {
          ...data,
          project_id: project.id,
          ...(view === "world"
            ? { kind }
            : view === "plan"
              ? { position: events.length }
              : {}),
        });
      setModal(false);
      setEdit(null);
      await load();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function del(id: string) {
    if (!confirm("حذف هذا العنصر نهائيًا؟")) return;
    try {
      await remove(table, id);
      await load();
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  async function move(id: string, stage: string) {
    try {
      await update("events", id, { stage });
      await load();
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  return (
    <main className="collection">
      <div className="collection-heading">
        <div>
          <div className="eyebrow">{project.title}</div>
          <h1>{title}</h1>
          <p className="muted">
            {view === "world"
              ? "شخصيات لها حياة. أماكن لها ذاكرة."
              : view === "notes"
                ? "لا تترك فكرة جيدة تفلت منك."
                : "من الفكرة الأولى إلى المشهد الأخير."}
          </p>
        </div>
        <button
          className="primary"
          style={{ display: kind === "relationships" ? "none" : undefined }}
          onClick={() => {
            setEdit(null);
            setModal(true);
          }}
        >
          <Plus size={17} />
          {itemLabel}{" "}
          {view === "notes" || (view === "world" && kind === "character")
            ? "جديدة"
            : "جديد"}
        </button>
      </div>
      {view === "world" && (
        <div className="segmented">
          <button
            className={kind === "character" ? "active" : ""}
            onClick={() => setKind("character")}
          >
            <UserRound size={16} />
            الشخصيات
          </button>
          <button
            className={kind === "location" ? "active" : ""}
            onClick={() => setKind("location")}
          >
            <MapPin size={16} />
            الأماكن
          </button>
          <button
            className={kind === "relationships" ? "active" : ""}
            onClick={() => setKind("relationships")}
          >
            العلاقات
          </button>
        </div>
      )}
      {view === "plan" && (
        <div className="segmented">
          <button
            className={!timeline ? "active" : ""}
            onClick={() => setTimeline(false)}
          >
            لوحة الحبكة
          </button>
          <button
            className={timeline ? "active" : ""}
            onClick={() => setTimeline(true)}
          >
            الخط الزمني
          </button>
        </div>
      )}
      {view === "world" && kind === "relationships" ? (
        <Relationships projectId={project.id} onError={onError} />
      ) : view === "world" ? (
        <div className="entity-grid">
          {entities
            .filter((x) => x.kind === kind)
            .map((x) => (
              <article className="entity-card" key={x.id}>
                <PrivateImage
                  path={x.image_path}
                  className="entity-image"
                  alt={x.name}
                />
                <div className="entity-avatar">
                  {kind === "character" ? (
                    <UserRound size={30} />
                  ) : (
                    <MapPin size={30} />
                  )}
                </div>
                <h2>{x.name}</h2>
                <p>{x.description}</p>
                {x.background && <p className="muted">{x.background}</p>}
                {x.goals && <p>الدوافع: {x.goals}</p>}
                <div className="card-actions">
                  <button
                    onClick={() => {
                      setEdit(x);
                      setModal(true);
                    }}
                  >
                    <Pencil size={15} />
                    تحرير
                  </button>
                  <button
                    aria-label={"حذف " + x.name}
                    onClick={() => void del(x.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          {!entities.some((x) => x.kind === kind) && (
            <div className="empty-state">
              <UserRound size={35} />
              <h2>عالمك يبدأ بمن يسكنه.</h2>
              <p>أضف {itemLabel}، واكتب ما يجعلها جزءًا من الحكاية.</p>
            </div>
          )}
        </div>
      ) : view === "notes" ? (
        <div className="entity-grid">
          {notes.map((n) => (
            <article className="note-card" key={n.id}>
              <FileText size={20} />
              <h2>{n.title}</h2>
              <p>{n.body}</p>
              <div className="card-actions">
                <button
                  onClick={() => {
                    setEdit(n);
                    setModal(true);
                  }}
                >
                  <Pencil size={15} />
                  تحرير
                </button>
                <button
                  aria-label="حذف الملاحظة"
                  onClick={() => void del(n.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
          {!notes.length && (
            <div className="empty-state">
              <FileText size={32} />
              <h2>مساحة لكل فكرة عابرة.</h2>
              <p>أضف ملاحظة لروايتك.</p>
            </div>
          )}
        </div>
      ) : timeline ? (
        <div className="timeline">
          {[...events]
            .sort((a, b) => a.story_date.localeCompare(b.story_date))
            .map((x) => (
              <article key={x.id}>
                <time>{x.story_date || "دون تاريخ"}</time>
                <h2>{x.title}</h2>
                <p>{x.body}</p>
                <button
                  onClick={() => {
                    setEdit(x);
                    setModal(true);
                  }}
                >
                  تحرير الحدث <ArrowLeft size={15} />
                </button>
              </article>
            ))}
          {!events.length && (
            <p className="muted">أضف حدثًا ليظهر على الخط الزمني.</p>
          )}
        </div>
      ) : (
        <div className="plot-board">
          {[
            { key: "idea", label: "بذرة الحكاية" },
            { key: "draft", label: "قيد الكتابة" },
            { key: "done", label: "اكتمل المشهد" },
          ].map((col) => (
            <section
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                void move(e.dataTransfer.getData("text/plain"), col.key)
              }
            >
              <h2>
                {col.label}
                <span>{events.filter((x) => x.stage === col.key).length}</span>
              </h2>
              {events
                .filter((x) => x.stage === col.key)
                .map((x) => (
                  <article
                    key={x.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", x.id)
                    }
                  >
                    <h3>{x.title}</h3>
                    <p>{x.body}</p>
                    <small>{x.story_date}</small>
                    <select
                      aria-label={"حالة " + x.title}
                      value={x.stage}
                      onChange={(e) => void move(x.id, e.target.value)}
                    >
                      <option value="idea">فكرة</option>
                      <option value="draft">قيد الكتابة</option>
                      <option value="done">مكتمل</option>
                    </select>
                    <div className="card-actions">
                      <button
                        onClick={() => {
                          setEdit(x);
                          setModal(true);
                        }}
                      >
                        <Pencil size={14} />
                        تحرير
                      </button>
                      <button
                        aria-label="حذف الحدث"
                        onClick={() => void del(x.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
            </section>
          ))}
        </div>
      )}
      {modal && (
        <Dialog
          title={(edit ? "تحرير " : "إضافة ") + itemLabel}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            {view === "world" && edit && (
              <AssetUpload
                table="entities"
                id={edit.id}
                column="image_path"
                path={
                  "image_path" in edit ? String(edit.image_path || "") : null
                }
                onError={onError}
                onSaved={() => {
                  setModal(false);
                  void load();
                }}
              />
            )}
            <Field
              autoFocus
              label={view === "world" ? "الاسم" : "العنوان"}
              name={view === "world" ? "name" : "title"}
              defaultValue={
                edit ? ("name" in edit ? edit.name : edit.title) : ""
              }
              required
              maxLength={200}
            />
            <label className="field">
              {view === "world" ? "الوصف" : "التفاصيل"}
              <textarea
                aria-label={view === "world" ? "الوصف" : "التفاصيل"}
                name={view === "world" ? "description" : "body"}
                defaultValue={
                  edit
                    ? "description" in edit
                      ? edit.description
                      : "body" in edit
                        ? edit.body
                        : ""
                    : ""
                }
                rows={4}
              />
            </label>
            {view === "world" && (
              <>
                <Field
                  label="العمر"
                  name="age"
                  defaultValue={
                    edit && "age" in edit ? String(edit.age || "") : ""
                  }
                />
                <Field
                  label="الألقاب والأسماء الأخرى"
                  name="aliases"
                  defaultValue={
                    edit && "aliases" in edit ? String(edit.aliases || "") : ""
                  }
                />
                <Field
                  label="الانتماءات"
                  name="affiliations"
                  defaultValue={
                    edit && "affiliations" in edit
                      ? String(edit.affiliations || "")
                      : ""
                  }
                />
                <label className="field">
                  الخلفية والمظهر
                  <textarea
                    aria-label="الخلفية والمظهر"
                    name="background"
                    defaultValue={
                      edit && "background" in edit ? edit.background : ""
                    }
                  />
                </label>
                <Field
                  label="الأهداف والدوافع"
                  name="goals"
                  defaultValue={edit && "goals" in edit ? edit.goals : ""}
                />
              </>
            )}
            {view === "plan" && (
              <Field
                label="التاريخ داخل الحكاية"
                placeholder="مثل: 2040-03-21"
                name="story_date"
                defaultValue={
                  edit && "story_date" in edit ? edit.story_date : ""
                }
              />
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "جارٍ الحفظ…" : "حفظ"}
            </button>
          </form>
        </Dialog>
      )}
    </main>
  );
}
