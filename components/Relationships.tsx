"use client";
import { useEffect, useState } from "react";
import { Plus, Link2, Pencil, Trash2 } from "lucide-react";
import { insert, list, update, remove } from "../lib/supabase";
import type { Entity } from "../lib/types";
import { Dialog, Field, errorMessage } from "./ui";
type Relationship = {
  id: string;
  source_id: string;
  target_id: string;
  label: string;
};
export default function Relationships({
  projectId,
  onError,
}: {
  projectId: string;
  onError: (message: string) => void;
}) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [links, setLinks] = useState<Relationship[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Relationship | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [e, r] = await Promise.all([
        list<Entity>("entities", { project_id: projectId }),
        list<Relationship>("relationships", { project_id: projectId }),
      ]);
      setEntities(e);
      setLinks(r);
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, [projectId]);
  const points = entities.map((e, i) => ({
    ...e,
    x:
      350 +
      Math.cos((i * 2 * Math.PI) / Math.max(entities.length, 1) - Math.PI / 2) *
        230,
    y:
      250 +
      Math.sin((i * 2 * Math.PI) / Math.max(entities.length, 1) - Math.PI / 2) *
        170,
  }));
  return (
    <section className="relationships">
      <div className="section-actions">
        <div>
          <h2>خريطة العلاقات</h2>
          <p className="muted">
            صل الشخصيات والأماكن. لكل علاقة أثر في الحكاية.
          </p>
        </div>
        <button
          className="primary"
          disabled={entities.length < 2}
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          علاقة جديدة
        </button>
      </div>
      {entities.length < 2 ? (
        <div className="empty-state">
          <Link2 size={35} />
          <h2>أضف شخصيتين أو مكانًا وشخصية.</h2>
          <p>ستتمكن بعدها من ربطهما وتحرير علاقتهما هنا.</p>
        </div>
      ) : (
        <>
          <div className="relationship-canvas">
            <svg
              viewBox="0 0 700 500"
              role="img"
              aria-label="مخطط العلاقات القابلة للتحرير"
            >
              <defs>
                <linearGradient id="relation-line">
                  <stop stopColor="#fff" stopOpacity=".6" />
                  <stop offset="1" stopColor="#fff" stopOpacity=".2" />
                </linearGradient>
              </defs>
              {links.map((link) => {
                const a = points.find((p) => p.id === link.source_id),
                  b = points.find((p) => p.id === link.target_id);
                if (!a || !b) return null;
                return (
                  <g key={link.id}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="url(#relation-line)"
                      strokeWidth="1.5"
                    />
                    <rect
                      x={(a.x + b.x) / 2 - 65}
                      y={(a.y + b.y) / 2 - 15}
                      width="130"
                      height="30"
                      rx="10"
                      fill="#18181d"
                      stroke="#ffffff30"
                    />
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 + 5}
                      textAnchor="middle"
                      fill="#c7c7d2"
                      fontSize="12"
                      fontFamily="Plex"
                    >
                      {link.label}
                    </text>
                  </g>
                );
              })}
              {points.map((p) => (
                <g key={p.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="35"
                    fill="#15151b"
                    stroke="#ffffff60"
                  />
                  <circle cx={p.x} cy={p.y} r="30" stroke="#ffffff12" />
                  <text
                    x={p.x}
                    y={p.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="19"
                    fontFamily="Amiri"
                  >
                    {p.name.slice(0, 5)}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 60}
                    textAnchor="middle"
                    fill="#b8b8c4"
                    fontSize="12"
                    fontFamily="Plex"
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="relationship-list">
            {links.map((link) => (
              <article key={link.id}>
                <span>
                  {entities.find((e) => e.id === link.source_id)?.name}
                </span>
                <Link2 size={16} />
                <strong>{link.label}</strong>
                <span>
                  {entities.find((e) => e.id === link.target_id)?.name}
                </span>
                <button
                  aria-label={"تحرير علاقة " + link.label}
                  onClick={() => {
                    setEdit(link);
                    setOpen(true);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={"حذف علاقة " + link.label}
                  onClick={() => {
                    if (confirm("حذف هذه العلاقة؟"))
                      void remove("relationships", link.id)
                        .then(load)
                        .catch((e) => onError(errorMessage(e)));
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {open && (
        <Dialog
          title={edit ? "تحرير العلاقة" : "علاقة جديدة"}
          onClose={() => setOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const source_id = String(f.get("source_id")),
                target_id = String(f.get("target_id"));
              if (source_id === target_id) {
                onError("اختر طرفين مختلفين للعلاقة.");
                return;
              }
              setBusy(true);
              void (async () => {
                try {
                  const value = {
                    source_id,
                    target_id,
                    label: String(f.get("label")),
                  };
                  if (edit) await update("relationships", edit.id, value);
                  else
                    await insert("relationships", {
                      ...value,
                      project_id: projectId,
                    });
                  setOpen(false);
                  await load();
                } catch (e) {
                  onError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            <label className="field">
              الطرف الأول
              <select
                aria-label="الطرف الأول"
                name="source_id"
                defaultValue={edit?.source_id || entities[0]?.id}
              >
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="نوع العلاقة"
              name="label"
              defaultValue={edit?.label || ""}
              placeholder="مثل: شقيق، خصم، مرشد"
              required
              maxLength={100}
            />
            <label className="field">
              الطرف الثاني
              <select
                aria-label="الطرف الثاني"
                name="target_id"
                defaultValue={edit?.target_id || entities[1]?.id}
              >
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary full" disabled={busy}>
              حفظ العلاقة
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
