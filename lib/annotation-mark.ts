import { Mark, mergeAttributes } from "@tiptap/core";
export const AnnotationMark = Mark.create({
  name: "annotation",
  inclusive: false,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (e) => e.getAttribute("data-annotation-id"),
        renderHTML: (attrs) => ({ "data-annotation-id": attrs.id }),
      },
      kind: {
        default: "comment",
        parseHTML: (e) => e.getAttribute("data-annotation-kind"),
        renderHTML: (attrs) => ({ "data-annotation-kind": attrs.kind }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-annotation-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "annotation-mark" }),
      0,
    ];
  },
});
