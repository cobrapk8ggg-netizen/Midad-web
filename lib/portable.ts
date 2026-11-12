import {
  CLASSIFICATION_TABLES,
  classificationPayloads,
} from "./classification-data";
import { supabase, list, insert, remove } from "./supabase";
import { isGuestActive } from "./guest";
export const portableFields: Record<string, string[]> = {
  projects: ["title", "description", "story", "goal"],
  books: ["project_id", "title", "position"],
  drafts: ["book_id", "title"],
  chapters: ["draft_id", "book_id", "title", "position", "writing_mode"],
  scenes: [
    "chapter_id",
    "title",
    "position",
    "content",
    "plain_text",
    "version",
  ],
  annotations: ["scene_id", "kind", "body", "quote", "created_at"],
  revisions: ["scene_id", "content", "plain_text", "version", "created_at"],
  entities: [
    "project_id",
    "kind",
    "name",
    "description",
    "background",
    "goals",
    "details",
    "age",
    "aliases",
    "appearance",
    "affiliations",
  ],
  notes: ["project_id", "title", "body"],
  arcs: ["project_id", "title", "goal", "conflict", "outcome", "position"],
  events: [
    "project_id",
    "title",
    "body",
    "stage",
    "position",
    "story_date",
    "scene_id",
    "arc_id",
  ],
  relationships: ["project_id", "source_id", "target_id", "label"],
  sessions: ["project_id", "started_at", "ended_at", "duration", "word_delta"],
  novel_metadata: [
    "project_id",
    "status",
    "age_rating",
    "language",
    "warnings",
  ],
  project_genres: ["project_id", "genre_code"],
  novel_tags: ["project_id", "tag"],
};
type Row = Record<string, unknown> & { id: string; _table: string };
export type Backup = {
  format: "midad-backup";
  version: 1;
  exportedAt: string;
  rows: Row[];
};
export async function createBackup(): Promise<Backup> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const rows = (
    await Promise.all(
      Object.keys(portableFields).map(async (table) =>
        (await list<Record<string, unknown>>(table))
          .filter(
            (row) =>
              isGuestActive() ||
              !row.user_id ||
              row.user_id === session?.user.id,
          )
          .map((row) => ({
            id: row.id
              ? String(row.id)
              : table +
                ":" +
                row.project_id +
                ":" +
                (row.genre_code || row.tag || "meta"),
            _table: table,
            ...Object.fromEntries(
              portableFields[table]
                .filter((k) => row[k] !== undefined)
                .map((k) => [k, row[k]]),
            ),
          })),
      ),
    )
  ).flat();
  return {
    format: "midad-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    rows,
  };
}
export function parseBackup(text: string): Backup {
  if (text.length > 50 * 1024 * 1024)
    throw new Error("النسخة أكبر من ٥٠ ميغابايت.");
  const b = JSON.parse(text);
  if (
    b.format !== "midad-backup" ||
    b.version !== 1 ||
    !Array.isArray(b.rows) ||
    b.rows.length > 50000 ||
    b.rows.some(
      (r: Row) => !r || !portableFields[r._table] || typeof r.id !== "string",
    )
  )
    throw new Error("ملف النسخة الاحتياطية غير صالح.");
  const ids = new Map(b.rows.map((r: Row) => [r.id, r._table]));
  if (ids.size !== b.rows.length)
    throw new Error("معرّفات مكررة في النسخة الاحتياطية.");
  const refs: Record<string, string> = {
    project_id: "projects",
    book_id: "books",
    chapter_id: "chapters",
    draft_id: "drafts",
    scene_id: "scenes",
    arc_id: "arcs",
    source_id: "entities",
    target_id: "entities",
  };
  for (const row of b.rows as Row[])
    for (const key of portableFields[row._table]) {
      if (!refs[key]) continue;
      const value = row[key];
      if (
        (value === null || value === undefined) &&
        ((row._table === "events" && ["scene_id", "arc_id"].includes(key)) ||
          (row._table === "chapters" && key === "draft_id"))
      )
        continue;
      if (typeof value !== "string" || ids.get(value) !== refs[key])
        throw new Error("روابط النسخة الاحتياطية غير مكتملة.");
    }
  return b;
}
export async function restoreBackup(backup: Backup) {
  const mapping = new Map(
    backup.rows.map((row) => [row.id, crypto.randomUUID()]),
  );
  const remap = (value: unknown): unknown => {
    if (typeof value === "string") return mapping.get(value) || value;
    if (Array.isArray(value)) return value.map(remap);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, remap(v)]),
      );
    return value;
  };
  const created: string[] = [];
  try {
    for (const [table, fields] of Object.entries(portableFields)) {
      if (!isGuestActive() && CLASSIFICATION_TABLES.includes(table)) continue;
      for (const row of backup.rows.filter((r) => r._table === table)) {
        const value = {
          id: mapping.get(row.id)!,
          ...Object.fromEntries(
            fields
              .filter((k) => row[k] !== undefined)
              .map((k) => [k, remap(row[k])]),
          ),
        };
        if (
          table === "chapters" &&
          !(value as Record<string, unknown>).writing_mode
        )
          (value as Record<string, unknown>).writing_mode =
            backup.rows.filter(
              (r) => r._table === "scenes" && r.chapter_id === row.id,
            ).length > 1
              ? "scenes"
              : "continuous";
        await insert(table, value);
        if (table === "projects") created.push(value.id);
      }
    }
    if (!isGuestActive())
      for (const p of classificationPayloads(backup.rows)) {
        const { error } = await supabase.rpc("midad_save_novel_metadata", {
          p_id: mapping.get(p.project_id),
          p_metadata: p.metadata,
          p_genres: p.genres,
          p_tags: p.tags,
        });
        if (error) throw error;
      }
  } catch (error) {
    for (const id of created) {
      try {
        await remove("projects", id);
      } catch {
        throw new Error(
          "تعثر الاستيراد وتعذر تنظيف بعض العناصر. راجع المكتبة قبل المحاولة مجددًا.",
        );
      }
    }
    throw error;
  }
  return created.length;
}
