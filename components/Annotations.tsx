"use client";
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { MessageSquare, NotebookPen, Plus, Pencil, Trash2 } from "lucide-react";
import { insert, list, remove, update } from "../lib/supabase";
import { Dialog, errorMessage } from "./ui";
type Annotation = {
  id: string;
  kind: "comment" | "footnote";
  body: string;
  quote: string;
  created_at: string;
};
export default function Annotations({
  sceneId,
  editor,
  onError,
}: {
  sceneId: string;
  editor: Editor | null;
  onError: (s: string) => void;
}) {
  const [items, setItems] = useState<Annotation[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Annotation | null>(null);
  const [kind, setKind] = useState<"comment" | "footnote">("comment");
  const [anchor, setAnchor] = useState<{
    from: number;
    to: number;
    quote: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      setItems(await list<Annotation>("annotations", { scene_id: sceneId }));
    } catch (e) {
      onError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, [sceneId]);
  function start() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      onError("حدّد نصًا في المشهد أولًا، ثم أضف التعليق أو الحاشية.");
      return;
    }
    setAnchor({ from, to, quote: editor.state.doc.textBetween(from, to, " ") });
    setEdit(null);
    setOpen(true);
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = String(new FormData(e.currentTarget).get("body"));
      if (edit) await update("annotations", edit.id, { body });
      else if (editor && anchor) {
        const id = crypto.randomUUID();
        await insert("annotations", {
          id,
          scene_id: sceneId,
          kind,
          body,
          quote: anchor.quote,
        });
        editor
          .chain()
          .focus()
          .setTextSelection({ from: anchor.from, to: anchor.to })
          .setMark("annotation", { id, kind })
          .run();
      }
      setOpen(false);
      await load();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function jump(item: Annotation) {
    if (!editor) return;
    let found: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (
        node.isText &&
        node.marks.some(
          (mark) =>
            mark.type.name === "annotation" && mark.attrs.id === item.id,
        )
      )
        found = { from: pos, to: pos + node.nodeSize };
    });
    if (found)
      editor.chain().focus().setTextSelection(found).scrollIntoView().run();
    else
      onError(
        "النص المرتبط غير موجود في هذه النسخة من المشهد. ملاحظة الحاشية ما زالت محفوظة.",
      );
  }
  return (
    <section className="annotations-panel">
      <div className="section-actions">
        <h3>التعليقات والحواشي</h3>
        <button
          aria-label="إضافة تعليق أو حاشية"
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
        >
          <Plus size={17} />
        </button>
      </div>
      {items.length === 0 && (
        <p className="muted">حدّد فقرة ثم أضف تعليقًا أو حاشية.</p>
      )}
      {items.map((item) => (
        <article key={item.id}>
          <button className="annotation-jump" onClick={() => jump(item)}>
            {item.kind === "footnote" ? (
              <NotebookPen size={14} />
            ) : (
              <MessageSquare size={14} />
            )}
            <span>{item.quote.slice(0, 70)}</span>
          </button>
          <p>{item.body}</p>
          <div className="annotation-actions">
            <button
              aria-label="تحرير الملاحظة"
              onClick={() => {
                setEdit(item);
                setOpen(true);
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              aria-label="حذف الملاحظة المرتبطة"
              onClick={() => {
                if (confirm("حذف هذه الملاحظة وعلامتها؟"))
                  void (async () => {
                    try {
                      await remove("annotations", item.id);
                      if (editor) {
                        const tr = editor.state.tr;
                        editor.state.doc.descendants((node, pos) => {
                          node.marks
                            .filter(
                              (m) =>
                                m.type.name === "annotation" &&
                                m.attrs.id === item.id,
                            )
                            .forEach((mark) =>
                              tr.removeMark(pos, pos + node.nodeSize, mark),
                            );
                        });
                        editor.view.dispatch(tr);
                      }
                      await load();
                    } catch (e) {
                      onError(errorMessage(e));
                    }
                  })();
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </article>
      ))}
      {open && (
        <Dialog
          title={edit ? "تحرير الملاحظة" : "تعليق أو حاشية"}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={save}>
            {!edit && (
              <>
                <p className="annotation-quote">
                  {anchor?.quote.slice(0, 200)}
                </p>
                <label className="field">
                  نوع الملاحظة
                  <select
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as "comment" | "footnote")
                    }
                  >
                    <option value="comment">تعليق</option>
                    <option value="footnote">حاشية</option>
                  </select>
                </label>
              </>
            )}
            <label className="field">
              نص الملاحظة
              <textarea
                aria-label="نص الملاحظة"
                name="body"
                rows={4}
                defaultValue={edit?.body || ""}
                required
                maxLength={10000}
              />
            </label>
            <button className="primary full" disabled={busy}>
              حفظ الملاحظة
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
