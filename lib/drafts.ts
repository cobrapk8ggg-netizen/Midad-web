import type { JSONContent } from "@tiptap/react";
import type { Chapter, Scene } from "./types";
import { insert, list, remove } from "./supabase";
export type Draft = { id: string; book_id: string; title: string };
export async function cloneDraft(
  bookId: string,
  sourceId: string | null,
  title: string,
  copy: boolean,
) {
  const draft = await insert<Draft>("drafts", { book_id: bookId, title });
  try {
    if (copy) {
      const chapters = (
        await list<Chapter & { draft_id?: string }>("chapters", {
          book_id: bookId,
        })
      ).filter((c) => (c.draft_id || null) === sourceId);
      for (const chapter of chapters) {
        const created = await insert<Chapter>("chapters", {
          book_id: bookId,
          draft_id: draft.id,
          title: chapter.title,
          position: chapter.position,
          writing_mode: chapter.writing_mode || "continuous",
        });
        for (const scene of await list<Scene>("scenes", {
          chapter_id: chapter.id,
        })) {
          const notes = await list<{
            id: string;
            kind: string;
            body: string;
            quote: string;
          }>("annotations", { scene_id: scene.id });
          const ids = new Map(notes.map((n) => [n.id, crypto.randomUUID()]));
          const remap = (node: JSONContent): JSONContent => ({
            ...node,
            ...(node.marks
              ? {
                  marks: node.marks.map((m) =>
                    m.type === "annotation"
                      ? {
                          ...m,
                          attrs: {
                            ...m.attrs,
                            id: ids.get(m.attrs?.id) || m.attrs?.id,
                          },
                        }
                      : m,
                  ),
                }
              : {}),
            ...(node.content ? { content: node.content.map(remap) } : {}),
          });
          const s = await insert<Scene>("scenes", {
            chapter_id: created.id,
            title: scene.title,
            position: scene.position,
            content: remap(scene.content),
            plain_text: scene.plain_text,
          });
          for (const note of notes)
            await insert("annotations", {
              id: ids.get(note.id),
              scene_id: s.id,
              kind: note.kind,
              body: note.body,
              quote: note.quote,
            });
        }
      }
    }
    return draft;
  } catch (e) {
    await remove("drafts", draft.id);
    throw e;
  }
}
