"use client";
import { useDeferredValue, useEffect, useState } from "react";
import { FileText, UserRound, Waypoints, StickyNote } from "lucide-react";
import { list } from "../lib/supabase";
import type {
  Book,
  Chapter,
  Scene,
  Entity,
  Note,
  PlotEvent,
} from "../lib/types";
import { errorMessage } from "./ui";
type Hit = {
  id: string;
  title: string;
  text: string;
  kind: string;
  scene?: Scene;
  book?: Book;
};
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLocaleLowerCase();
export default function ProjectSearch({
  projectId,
  query,
  onScene,
  onNavigate,
  onError,
}: {
  projectId: string;
  query: string;
  onScene: (s: Scene, b: Book) => void;
  onNavigate: (view: string) => void;
  onError: (s: string) => void;
}) {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(true);
  const search = useDeferredValue(normalize(query.trim()));
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [books, entities, notes, events] = await Promise.all([
          list<Book>("books", { project_id: projectId }),
          list<Entity>("entities", { project_id: projectId }),
          list<Note>("notes", { project_id: projectId }),
          list<PlotEvent>("events", { project_id: projectId }),
        ]);
        const chapters = (
          await Promise.all(
            books.map(async (book) =>
              (await list<Chapter>("chapters", { book_id: book.id })).map(
                (c) => ({ ...c, book }),
              ),
            ),
          )
        ).flat();
        const scenes = (
          await Promise.all(
            chapters.map(async (c) =>
              (await list<Scene>("scenes", { chapter_id: c.id })).map((s) => ({
                id: s.id,
                title: c.title + " / " + s.title,
                text: s.plain_text,
                kind: "scene",
                scene: s,
                book: c.book,
              })),
            ),
          )
        ).flat();
        if (alive)
          setHits([
            ...scenes,
            ...entities.map((e) => ({
              id: e.id,
              title: e.name,
              text: e.description + " " + e.background + " " + e.goals,
              kind: "world",
            })),
            ...notes.map((n) => ({
              id: n.id,
              title: n.title,
              text: n.body,
              kind: "notes",
            })),
            ...events.map((e) => ({
              id: e.id,
              title: e.title,
              text: e.body,
              kind: "plan",
            })),
          ]);
      } catch (e) {
        onError(errorMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);
  if (!search) return null;
  const results = hits
    .filter((h) => normalize(h.title + " " + h.text).includes(search))
    .slice(0, 20);
  return (
    <section className="project-search">
      <h3>داخل روايتك</h3>
      {loading ? (
        <p>جارٍ البحث في المخطوطة…</p>
      ) : !results.length ? (
        <p>لا نتائج لهذا النص.</p>
      ) : (
        results.map((h) => {
          const Icon =
            h.kind === "scene"
              ? FileText
              : h.kind === "world"
                ? UserRound
                : h.kind === "notes"
                  ? StickyNote
                  : Waypoints;
          const i = normalize(h.text).indexOf(search);
          return (
            <button
              key={h.kind + h.id}
              onClick={() =>
                h.scene && h.book
                  ? onScene(h.scene, h.book)
                  : onNavigate(h.kind)
              }
            >
              <Icon size={17} />
              <span>
                <strong>{h.title}</strong>
                <small>
                  {h.text.slice(Math.max(0, i - 30), Math.max(0, i - 30) + 110)}
                </small>
              </span>
            </button>
          );
        })
      )}
    </section>
  );
}
