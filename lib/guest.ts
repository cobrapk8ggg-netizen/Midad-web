import type { Scene } from "./types";
import type { JSONContent } from "@tiptap/react";
type Row = Record<string, unknown> & { id: string; _table: string };
let active = false;
export function setGuestActive(value: boolean) {
  active = value;
  if (typeof window !== "undefined") {
    if (value) localStorage.setItem("midad:guest-session", "1");
    else localStorage.removeItem("midad:guest-session");
  }
}
export function isGuestActive() {
  return active;
}
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("midad-guest-v1", 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore("rows", { keyPath: "id" });
      store.createIndex("table", "_table");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore, resolve: (value: T) => void) => void,
): Promise<T> {
  const d = await db();
  return new Promise<T>((resolve, reject) => {
    const t = d.transaction("rows", mode);
    let value: T;
    fn(t.objectStore("rows"), (v) => {
      value = v;
    });
    t.oncomplete = () => {
      d.close();
      resolve(value);
    };
    t.onerror = () => {
      d.close();
      reject(t.error);
    };
    t.onabort = () => {
      d.close();
      reject(t.error || new Error("تعذر حفظ بيانات الضيف"));
    };
  });
}
export async function guestList<T>(
  table: string,
  filters: Record<string, string> = {},
): Promise<T[]> {
  return tx<T[]>("readonly", (s, done) => {
    const q = s.index("table").getAll(table);
    q.onsuccess = () =>
      done(
        (q.result as Row[])
          .filter((row) =>
            Object.entries(filters).every(([k, v]) => row[k] === v),
          )
          .map(({ _table, ...row }) => row as T),
      );
  });
}
const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
export async function guestInsert<T>(table: string, value: object): Promise<T> {
  const row = {
    id: crypto.randomUUID(),
    user_id: "guest-local",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: "",
    goal: 80000,
    position: 0,
    content: emptyDoc,
    plain_text: "",
    version: 0,
    body: "",
    background: "",
    goals: "",
    details: {},
    story_date: "",
    stage: "idea",
    ...value,
    _table: table,
  };
  await tx("readwrite", (s, done) => {
    s.add(row);
    done(true);
  });
  return row as T;
}
export async function guestUpdate(table: string, id: string, value: object) {
  await tx("readwrite", (s, done) => {
    const q = s.get(id);
    q.onsuccess = () => {
      if (!q.result || q.result._table !== table) {
        s.transaction.abort();
        return;
      }
      s.put({ ...q.result, ...value, updated_at: new Date().toISOString() });
      done(true);
    };
  });
}
export async function guestRemove(table: string, id: string) {
  const rows = await tx<Row[]>("readonly", (s, done) => {
    const q = s.getAll();
    q.onsuccess = () => done(q.result);
  });
  const removed = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (
        !removed.has(row.id) &&
        [
          "draft_id",
          "project_id",
          "book_id",
          "chapter_id",
          "scene_id",
          "source_id",
          "target_id",
          "arc_id",
        ].some((key) => removed.has(String(row[key])))
      ) {
        removed.add(row.id);
        changed = true;
      }
    }
  }
  await tx("readwrite", (s, done) => {
    for (const key of removed) s.delete(key);
    done(true);
  });
}
export async function guestSaveScene(
  id: string,
  expected: number,
  document: JSONContent,
  prose: string,
): Promise<Scene> {
  let reason: Error | undefined;
  return tx<Scene>("readwrite", (s, done) => {
    const q = s.get(id);
    q.onsuccess = () => {
      const old = q.result;
      if (!old || old.version !== expected) {
        reason = new Error(old ? "version_conflict" : "scene_not_found");
        s.transaction.abort();
        return;
      }
      s.add({
        id: crypto.randomUUID(),
        _table: "revisions",
        user_id: "guest-local",
        scene_id: id,
        content: old.content,
        plain_text: old.plain_text,
        version: old.version,
        created_at: new Date().toISOString(),
      });
      const row = {
        ...old,
        version: old.version + 1,
        content: document,
        plain_text: prose,
        updated_at: new Date().toISOString(),
      };
      s.put(row);
      done(row);
    };
  }).catch((error) => {
    throw reason || error;
  });
}
export async function guestExport() {
  return tx<Row[]>("readonly", (s, done) => {
    const q = s.getAll();
    q.onsuccess = () => done(q.result);
  });
}
