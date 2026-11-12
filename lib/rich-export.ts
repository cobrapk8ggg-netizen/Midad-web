import type { JSONContent } from "@tiptap/react";
import { safeFont, safeColor } from "./fonts";
export { escapeXml, richHtml } from "./rich-html";
import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  type IRunOptions,
} from "docx";
const safeAlign = (node: JSONContent) =>
  ["right", "left", "center", "justify"].includes(node.attrs?.textAlign)
    ? node.attrs!.textAlign
    : "right";
const safeDirection = (n: JSONContent) =>
  ["rtl", "ltr", "auto"].includes(n.attrs?.textDirection)
    ? n.attrs!.textDirection
    : "rtl";
const safeIndent = (n: JSONContent) =>
  Math.min(4, Math.max(0, Number(n.attrs?.firstIndent) || 0));
function runs(node: JSONContent, extra: Partial<IRunOptions> = {}): TextRun[] {
  if (node.type === "hardBreak") return [new TextRun({ break: 1 })];
  if (node.type === "text") {
    const marks = new Set((node.marks || []).map((m) => m.type));
    const a = node.marks?.find((m) => m.type === "textStyle")?.attrs || {};
    const f = safeFont(a.fontFamily),
      color = safeColor(a.color),
      bg =
        safeColor(
          node.marks?.find((m) => m.type === "highlight")?.attrs?.color,
        ) || safeColor(a.backgroundColor);
    const size = Number.parseFloat(a.fontSize);
    const style: Partial<IRunOptions> = {
      ...(f ? { font: f === "Plex" ? "IBM Plex Sans Arabic" : f } : {}),
      ...(color ? { color: color.slice(1) } : {}),
      ...(Number.isFinite(size) && size >= 8 && size <= 80
        ? {
            size: Math.round(size * 1.5),
            sizeComplexScript: Math.round(size * 1.5),
          }
        : {}),
      ...(bg ? { shading: { fill: bg.slice(1) } } : {}),
    };
    return [
      new TextRun({
        text: node.text || "",
        rightToLeft: true,
        bold: marks.has("bold"),
        italics: marks.has("italic"),
        underline: marks.has("underline") ? {} : undefined,
        strike: marks.has("strike"),
        ...style,
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
        indent: {
          firstLine: safeIndent(node) * 240,
          ...(quote ? { right: 400 } : {}),
        },
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
