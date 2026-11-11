import type { JSONContent } from "@tiptap/react";
import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  type IRunOptions,
} from "docx";
export const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const safeAlign = (node: JSONContent) =>
  ["right", "left", "center", "justify"].includes(node.attrs?.textAlign)
    ? node.attrs!.textAlign
    : "right";
export function richHtml(node: JSONContent): string {
  if (node.type === "text") {
    let text = escapeXml(node.text || "");
    for (const mark of node.marks || []) {
      if (mark.type === "bold") text = "<strong>" + text + "</strong>";
      if (mark.type === "italic") text = "<em>" + text + "</em>";
      if (mark.type === "underline") text = "<u>" + text + "</u>";
      if (mark.type === "strike") text = "<s>" + text + "</s>";
      if (mark.type === "code") text = "<code>" + text + "</code>";
    }
    return text;
  }
  if (node.type === "hardBreak") return "<br/>";
  const inner = (node.content || []).map(richHtml).join("");
  if (node.type === "doc") return inner;
  if (node.type === "heading") {
    const level = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2));
    return `<h${level} style="text-align:${safeAlign(node)}">${inner}</h${level}>`;
  }
  const tags: Record<string, string> = {
    paragraph: "p",
    bulletList: "ul",
    orderedList: "ol",
    listItem: "li",
    blockquote: "blockquote",
    codeBlock: "pre",
  };
  const tag = tags[node.type || ""];
  return tag
    ? `<${tag}${tag === "p" ? ` style="text-align:${safeAlign(node)}"` : ""}>${inner}</${tag}>`
    : inner;
}
function runs(node: JSONContent, extra: Partial<IRunOptions> = {}): TextRun[] {
  if (node.type === "hardBreak") return [new TextRun({ break: 1 })];
  if (node.type === "text") {
    const marks = new Set((node.marks || []).map((m) => m.type));
    return [
      new TextRun({
        text: node.text || "",
        rightToLeft: true,
        bold: marks.has("bold"),
        italics: marks.has("italic"),
        underline: marks.has("underline") ? {} : undefined,
        strike: marks.has("strike"),
        ...extra,
      }),
    ];
  }
  return (node.content || []).flatMap((c) => runs(c, extra));
}
export function richDocx(
  node: JSONContent,
  bullet = false,
  quote = false,
): Paragraph[] {
  if (
    ["doc", "bulletList", "orderedList", "listItem", "blockquote"].includes(
      node.type || "",
    )
  )
    return (node.content || []).flatMap((c) =>
      richDocx(
        c,
        bullet || node.type === "bulletList" || node.type === "orderedList",
        quote || node.type === "blockquote",
      ),
    );
  if (
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "codeBlock"
  ) {
    const level = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2));
    return [
      new Paragraph({
        bidirectional: true,
        alignment: safeAlign(
          node,
        ) as (typeof AlignmentType)[keyof typeof AlignmentType],
        heading:
          node.type === "heading"
            ? HeadingLevel[`HEADING_${level}` as keyof typeof HeadingLevel]
            : undefined,
        bullet: bullet ? { level: 0 } : undefined,
        indent: quote ? { right: 400 } : undefined,
        children: runs(node, quote ? { italics: true } : {}),
      }),
    ];
  }
  return [];
}
export function richMarkdown(node: JSONContent): string {
  if (node.type === "text") {
    let text = node.text || "";
    for (const mark of node.marks || []) {
      if (mark.type === "bold") text = "**" + text + "**";
      if (mark.type === "italic") text = "*" + text + "*";
      if (mark.type === "code") text = "`" + text + "`";
    }
    return text;
  }
  const children = (node.content || []).map(richMarkdown);
  switch (node.type) {
    case "doc":
      return children.join("\n\n");
    case "heading":
      return (
        "#".repeat(Math.max(1, Math.min(6, Number(node.attrs?.level) || 2))) +
        " " +
        children.join("")
      );
    case "paragraph":
      return children.join("");
    case "hardBreak":
      return "\n";
    case "blockquote":
      return children
        .join("\n")
        .split("\n")
        .map((s) => "> " + s)
        .join("\n");
    case "bulletList":
      return children.map((s) => "- " + s).join("\n");
    case "orderedList":
      return children.map((s, i) => i + 1 + ". " + s).join("\n");
    default:
      return children.join("\n");
  }
}
