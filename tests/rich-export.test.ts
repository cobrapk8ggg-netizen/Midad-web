import { expect, it } from "vitest";
import { exportBook } from "../lib/export";
import { unzipSync, strFromU8 } from "fflate";
it("preserves Arabic rich text in EPUB, DOCX and Markdown", async () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2, textAlign: "center" },
        content: [{ type: "text", text: "عنوان عربي" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "نص عريض", marks: [{ type: "bold" }] },
          { type: "text", text: " ومائل", marks: [{ type: "italic" }] },
        ],
      },
    ],
  };
  for (const format of ["epub", "docx", "md"]) {
    const b = await exportBook(
      "رواية",
      [
        {
          title: "فصل",
          text: "عنوان عربي\nنص عريض ومائل",
          documents: [document],
        },
      ],
      format,
    );
    if (format === "md") {
      expect(await b.text()).toContain("**نص عريض**");
    } else {
      const z = unzipSync(new Uint8Array(await b.arrayBuffer()));
      const xml = strFromU8(
        z[format === "epub" ? "OEBPS/c0.xhtml" : "word/document.xml"],
      );
      expect(xml).toContain("نص عريض");
      expect(xml).toContain(format === "epub" ? "<strong>" : "<w:b/>");
      expect(xml).toContain(
        format === "epub" ? "text-align:center" : 'w:val="center"',
      );
    }
  }
});

it("preserves chapter footnote bodies in every export format", async () => {
  for (const format of ["txt", "md", "docx", "epub"]) {
    const b = await exportBook(
      "رواية",
      [
        {
          title: "فصل",
          text: "نص",
          notes: [
            {
              id: "note-1",
              kind: "footnote",
              body: "حاشية عربية مهمة",
              quote: "نص",
            },
          ],
        },
      ],
      format,
    );
    if (format === "txt" || format === "md")
      expect(await b.text()).toContain("حاشية عربية مهمة");
    else {
      const zip = unzipSync(new Uint8Array(await b.arrayBuffer()));
      expect(
        strFromU8(
          zip[format === "docx" ? "word/document.xml" : "OEBPS/c0.xhtml"],
        ),
      ).toContain("حاشية عربية مهمة");
    }
  }
});
