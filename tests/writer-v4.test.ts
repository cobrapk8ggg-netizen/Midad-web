import { describe, it, expect } from "vitest";
import { richHtml } from "../lib/rich-html";
import { exportBook } from "../lib/export";
import { unzipSync, strFromU8 } from "fflate";
import { classificationPayloads } from "../lib/classification-data";
const document = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textDirection: "rtl", textAlign: "justify", firstIndent: 2 },
      content: [
        {
          type: "text",
          text: "نص عربي <script>alert(1)</script>",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontFamily: "Cairo",
                fontSize: "32px",
                color: "#e5cb93",
                lineHeight: "2",
              },
            },
            { type: "highlight", attrs: { color: "#594b2c" } },
            { type: "bold" },
          ],
        },
      ],
    },
  ],
};
describe("portable Arabic formatting", () => {
  it("preserves safe fonts, sizes and colors without interpreting text", () => {
    const h = richHtml(document);
    expect(h).toContain("font-family:Cairo");
    expect(h).toContain("font-size:32px");
    expect(h).toContain("color:#e5cb93");
    expect(h).toContain("text-indent:2em");
    expect(h).toContain("&lt;script&gt;");
    expect(h).not.toContain("<script>");
  });
  it("rejects active links and injected CSS in imported marks", () => {
    const h = richHtml({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "عنوان",
              marks: [
                { type: "link", attrs: { href: "javascript:alert(1)" } },
                {
                  type: "textStyle",
                  attrs: {
                    fontFamily: "Cairo; background:url(evil)",
                    color: 'red" onclick="evil',
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(h).not.toContain("javascript");
    expect(h).not.toContain("onclick");
    expect(h).not.toContain("background:url");
  });
  it("exports selected font and Arabic size to real Word XML and EPUB", async () => {
    const chapter = { title: "الفصل", text: "نص عربي", documents: [document] };
    const word = unzipSync(
      new Uint8Array(
        await (await exportBook("رواية", [chapter], "docx")).arrayBuffer(),
      ),
    );
    const xml = strFromU8(word["word/document.xml"]);
    expect(xml).toContain("Cairo");
    expect(xml).toContain('w:val="48"');
    expect(xml).toMatch(/w:color w:val="e5cb93"/i);
    const epub = unzipSync(
      new Uint8Array(
        await (await exportBook("رواية", [chapter], "epub")).arrayBuffer(),
      ),
    );
    expect(strFromU8(epub["OEBPS/c0.xhtml"])).toContain("font-family:Cairo");
  });
  it("collects classification rows while preserving parent references for transfer", () => {
    expect(
      classificationPayloads([
        {
          _table: "novel_metadata",
          project_id: "parent",
          status: "completed",
          age_rating: "16+",
          language: "ar",
          warnings: ["violence"],
        },
        {
          _table: "project_genres",
          project_id: "parent",
          genre_code: "fantasy",
        },
        { _table: "novel_tags", project_id: "parent", tag: "ارتقاء" },
      ]),
    ).toEqual([
      {
        project_id: "parent",
        metadata: {
          status: "completed",
          age_rating: "16+",
          language: "ar",
          warnings: ["violence"],
        },
        genres: ["fantasy"],
        tags: ["ارتقاء"],
      },
    ]);
  });
});
