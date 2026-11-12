import type { JSONContent } from "@tiptap/react";
import { richHtml } from "../lib/rich-html";
export default function ChapterText({
  title,
  scenes,
}: {
  title: string;
  scenes: {
    id: string;
    plain_text: string;
    position: number;
    content?: JSONContent;
  }[];
}) {
  return (
    <article className="chapter-reading">
      <h1>{title}</h1>
      {[...scenes]
        .sort((a, b) => a.position - b.position)
        .map((s, i) => (
          <section key={s.id}>
            {i > 0 && (
              <div className="scene-break" aria-label="فاصل مشهد">
                * * *
              </div>
            )}
            {s.content ? (
              <div
                className="rich-chapter-content"
                dangerouslySetInnerHTML={{ __html: richHtml(s.content) }}
              />
            ) : (
              s.plain_text.split("\n").map((p, i) => (
                <p key={i} dir="auto">
                  {p || "\u00a0"}
                </p>
              ))
            )}
          </section>
        ))}
    </article>
  );
}
