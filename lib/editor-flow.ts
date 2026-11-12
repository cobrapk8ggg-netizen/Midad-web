import { Extension } from "@tiptap/core";
export const ParagraphFlow = Extension.create({
  name: "paragraphFlow",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          textDirection: {
            default: "rtl",
            parseHTML: (el) =>
              ["rtl", "ltr", "auto"].includes(el.getAttribute("dir") || "")
                ? el.getAttribute("dir")
                : "rtl",
            renderHTML: (a) => ({
              dir: ["rtl", "ltr", "auto"].includes(a.textDirection)
                ? a.textDirection
                : "rtl",
            }),
          },
          firstIndent: {
            default: 0,
            parseHTML: (el) =>
              Math.min(4, Math.max(0, parseFloat(el.style.textIndent) || 0)),
            renderHTML: (a) => ({
              style: `text-indent:${Math.min(4, Math.max(0, Number(a.firstIndent) || 0))}em`,
            }),
          },
        },
      },
    ];
  },
});
