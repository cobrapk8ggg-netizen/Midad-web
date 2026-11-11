"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { list, update, remove } from "../lib/supabase";
import type { Book, Chapter } from "../lib/types";
import { Dialog, Field, errorMessage } from "./ui";
export default function ManuscriptManager({
  projectId,
  onChanged,
  onError,
}: {
  projectId: string;
  onChanged: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [edit, setEdit] = useState<{
    table: string;
    id: string;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    const bs = (await list<Book>("books", { project_id: projectId })).sort(
      (a, b) => a.position - b.position,
    );
    setBooks(bs);
    setChapters(
      (
        await Promise.all(
          bs.map((b) => list<Chapter>("chapters", { book_id: b.id })),
        )
      )
        .flat()
        .sort((a, b) => a.position - b.position),
    );
  }
  useEffect(() => {
    void load().catch((e) => onError(errorMessage(e)));
  }, [projectId]);
  async function del(table: string, id: string) {
    if (!confirm("حذف هذا العنصر وكل الفصول والمشاهد التابعة له نهائيًا؟"))
      return;
    setBusy(true);
    try {
      await remove(table, id);
      await load();
      await onChanged();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function move(c: Chapter, dir: number) {
    const siblings = chapters.filter(
      (x) =>
        x.book_id === c.book_id &&
        (x.draft_id || null) === (c.draft_id || null),
    );
    const other = siblings[siblings.findIndex((x) => x.id === c.id) + dir];
    if (!other) return;
    setBusy(true);
    try {
      await update("chapters", c.id, { position: other.position });
      await update("chapters", other.id, { position: c.position });
      await load();
      await onChanged();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="manuscript-manager">
      {books.map((b) => (
        <section key={b.id}>
          <div className="manager-row book-manager-row">
            <strong>{b.title}</strong>
            <button
              aria-label={"تسمية الكتاب " + b.title}
              onClick={() => setEdit({ table: "books", ...b })}
            >
              <Pencil size={15} />
            </button>
            <button
              disabled={busy}
              aria-label={"حذف الكتاب " + b.title}
              onClick={() => void del("books", b.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
          {chapters
            .filter((c) => c.book_id === b.id)
            .map((c) => (
              <div className="manager-row" key={c.id}>
                <span>{c.title}</span>
                <button
                  disabled={busy}
                  aria-label={"تقديم الفصل " + c.title}
                  onClick={() => void move(c, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={busy}
                  aria-label={"تأخير الفصل " + c.title}
                  onClick={() => void move(c, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  aria-label={"تسمية الفصل " + c.title}
                  onClick={() => setEdit({ table: "chapters", ...c })}
                >
                  <Pencil size={14} />
                </button>
                <button
                  disabled={busy}
                  aria-label={"حذف الفصل " + c.title}
                  onClick={() => void del("chapters", c.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </section>
      ))}
      {edit && (
        <Dialog title="تعديل الاسم" onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const title = String(new FormData(e.currentTarget).get("title"));
              setBusy(true);
              void update(edit.table, edit.id, { title })
                .then(async () => {
                  setEdit(null);
                  await load();
                  await onChanged();
                })
                .catch((e) => onError(errorMessage(e)))
                .finally(() => setBusy(false));
            }}
          >
            <Field
              label="الاسم الجديد"
              name="title"
              defaultValue={edit.title}
              required
              maxLength={200}
            />
            <button className="primary full" disabled={busy}>
              حفظ الاسم
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
