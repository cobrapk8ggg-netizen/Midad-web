import { createClient } from "@supabase/supabase-js";
import {
  isGuestActive,
  guestList,
  guestInsert,
  guestUpdate,
  guestRemove,
  guestSaveScene,
  guestExport,
} from "./guest";
import type { JSONContent } from "@tiptap/react";
import type { Scene } from "./types";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
export async function list<T>(
  table: string,
  filters: Record<string, string> = {},
): Promise<T[]> {
  if (isGuestActive()) return guestList<T>(table, filters);
  let q = supabase.from(`midad_${table}`).select("*");
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw error;
  return data as T[];
}
export async function insert<T>(table: string, value: object): Promise<T> {
  if (isGuestActive()) return guestInsert<T>(table, value);
  const { data, error } = await supabase
    .from(`midad_${table}`)
    .insert(value)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}
export async function update(table: string, id: string, value: object) {
  if (isGuestActive()) return guestUpdate(table, id, value);
  const { error } = await supabase
    .from(`midad_${table}`)
    .update(value)
    .eq("id", id);
  if (error) throw error;
}
export async function remove(table: string, id: string) {
  if (isGuestActive()) return guestRemove(table, id);
  const { error } = await supabase.from(`midad_${table}`).delete().eq("id", id);
  if (error) throw error;
}
export async function saveScene(
  id: string,
  expected: number,
  content: JSONContent,
  text: string,
): Promise<Scene> {
  if (isGuestActive()) return guestSaveScene(id, expected, content, text);
  const { data, error } = await supabase.rpc("midad_save_scene", {
    sid: id,
    expected_version: expected,
    document: content,
    prose: text,
  });
  if (error) throw error;
  return data[0] as Scene;
}
// A successful transfer preserves stable IDs and leaves the local originals intact.
export async function transferGuestToAccount() {
  const rows = await guestExport();
  const columns: Record<string, string[]> = {
    projects: ["id", "title", "description", "goal"],
    books: ["id", "project_id", "title", "position"],
    drafts: ["id", "book_id", "title"],
    chapters: ["draft_id", "id", "book_id", "title", "position"],
    scenes: [
      "id",
      "chapter_id",
      "title",
      "position",
      "content",
      "plain_text",
      "version",
    ],
    annotations: ["id", "scene_id", "kind", "body", "quote", "created_at"],
    revisions: [
      "id",
      "scene_id",
      "content",
      "plain_text",
      "version",
      "created_at",
    ],
    entities: [
      "id",
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
    notes: ["id", "project_id", "title", "body"],
    arcs: [
      "id",
      "project_id",
      "title",
      "goal",
      "conflict",
      "outcome",
      "position",
    ],
    events: [
      "id",
      "project_id",
      "title",
      "body",
      "stage",
      "position",
      "story_date",
      "scene_id",
      "arc_id",
    ],
    relationships: ["id", "project_id", "source_id", "target_id", "label"],
    sessions: [
      "id",
      "project_id",
      "started_at",
      "ended_at",
      "duration",
      "word_delta",
    ],
  };
  for (const [table, keys] of Object.entries(columns)) {
    for (const row of rows.filter((r) => r._table === table)) {
      const { data: existing, error: lookupError } = await supabase
        .from("midad_" + table)
        .select("id")
        .eq("id", row.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) continue;
      const value = Object.fromEntries(
        keys.filter((k) => row[k] !== undefined).map((k) => [k, row[k]]),
      );
      const { error } = await supabase.from("midad_" + table).insert(value);
      if (error) throw error;
    }
  }
  return rows.filter((r) => r._table === "projects").length;
}
