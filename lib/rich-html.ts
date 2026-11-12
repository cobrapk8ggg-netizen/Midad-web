import type { JSONContent } from "@tiptap/react";
import { safeFont, safeColor, safeLink } from "./fonts";
export const escapeXml = (s: string) =>
  String(s ?? "").replace(
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
export function richHtml(node: JSONContent, depth = 0): string {
  if (!node || depth > 40) return "";
  if (node.type === "text") {
    let text = escapeXml(node.text || "");
    for (const mark of node.marks || []) {
      if (mark.type === "bold") text = "<strong>" + text + "</strong>";
      if (mark.type === "italic") text = "<em>" + text + "</em>";
      if (mark.type === "underline") text = "<u>" + text + "</u>";
      if (mark.type === "strike") text = "<s>" + text + "</s>";
      if (mark.type === "code") text = "<code>" + text + "</code>";
      if (mark.type === "link") {
        const href = safeLink(mark.attrs?.href);
        if (href)
          text = `<a href="${escapeXml(href)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
      }
      if (mark.type === "highlight") {
        const color = safeColor(mark.attrs?.color) || "#594b2c";
        text = `<mark style="background-color:${color};color:inherit">${text}</mark>`;
      }
      if (mark.type === "textStyle") {
        const styles: string[] = [];
        const a = mark.attrs || {};
        const f = safeFont(a.fontFamily),
          color = safeColor(a.color),
          bg = safeColor(a.backgroundColor);
        if (f) styles.push(`font-family:${f}`);
        if (color) styles.push(`color:${color}`);
        if (bg) styles.push(`background-color:${bg}`);
        const size = Number.parseFloat(a.fontSize);
        if (Number.isFinite(size) && size >= 8 && size <= 80)
          styles.push(`font-size:${size}px`);
        const line = Number.parseFloat(a.lineHeight);
        if (Number.isFinite(line) && line >= 0.8 && line <= 4)
          styles.push(`line-height:${line}`);
        if (styles.length)
          text = `<span style="${styles.join(";")}">${text}</span>`;
      }
    }
    return text;
  }
  if (node.type === "hardBreak") return "<br/>";
  if (node.type === "horizontalRule") return "<hr/>";
  const inner = (Array.isArray(node.content) ? node.content : [])
    .map((n) => richHtml(n, depth + 1))
    .join("");
  if (node.type === "doc") return inner;
  if (node.type === "heading") {
    const level = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2));
    return `<h${level} dir="${safeDirection(node)}" style="text-align:${safeAlign(node)};text-indent:${safeIndent(node)}em">${inner}</h${level}>`;
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
    ? `<${tag}${tag === "p" ? ` dir="${safeDirection(node)}" style="text-align:${safeAlign(node)};text-indent:${safeIndent(node)}em"` : ""}>${inner}</${tag}>`
    : inner;
}
const safeDirection = (n: JSONContent) =>
  ["rtl", "ltr", "auto"].includes(n.attrs?.textDirection)
    ? n.attrs!.textDirection
    : "rtl";
const safeIndent = (n: JSONContent) =>
  Math.min(4, Math.max(0, Number(n.attrs?.firstIndent) || 0));
