"use client";
import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignRight,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Search,
  SlidersHorizontal,
  Link2,
  Minus,
  RemoveFormatting,
  IndentIncrease,
  Type,
  ChevronDown,
} from "lucide-react";
import { FONT_OPTIONS, fontFamily, safeLink } from "../lib/fonts";
import { Dialog, Field } from "./ui";
export type WriterPreferences = {
  font: string;
  size: number;
  width: number;
  lineHeight: number;
};
export default function EditorTools({
  editor,
  prefs,
  onPreferences,
  onFind,
  preferenceStatus,
}: {
  editor: Editor | null;
  prefs: WriterPreferences;
  onPreferences?: (p: Partial<WriterPreferences>) => void;
  onFind: () => void;
  preferenceStatus?: string;
}) {
  const [settings, setSettings] = useState(false),
    [link, setLink] = useState(false),
    [linkError, setLinkError] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            family: e.getAttributes("textStyle").fontFamily || "",
            size: e.getAttributes("textStyle").fontSize || "",
            color: e.getAttributes("textStyle").color || "#ffffff",
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            highlight: e.isActive("highlight"),
            quote: e.isActive("blockquote"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            heading: e.isActive("heading")
              ? String(e.getAttributes("heading").level)
              : "p",
            direction:
              e.getAttributes(e.isActive("heading") ? "heading" : "paragraph")
                .textDirection || "rtl",
            align:
              e.getAttributes("paragraph").textAlign ||
              e.getAttributes("heading").textAlign ||
              "right",
          }
        : null,
  });
  const action = (
    label: string,
    Icon: typeof Bold,
    fn: () => void,
    active = false,
  ) => (
    <button
      type="button"
      key={label}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={fn}
      disabled={!editor}
    >
      <Icon size={17} />
    </button>
  );
  return (
    <>
      <div className="writer-controls">
        <div
          className="type-toolbar glass"
          role="toolbar"
          aria-label="الخطوط والعناوين"
        >
          <span className="tools-kicker">
            <Type size={17} />
            تنسيق النص
          </span>
          <label className="sr-only" htmlFor="selection-font">
            خط النص المحدد
          </label>
          <select
            id="selection-font"
            aria-label="خط النص المحدد"
            value={state?.family || ""}
            onChange={(e) =>
              e.target.value
                ? editor?.chain().focus().setFontFamily(e.target.value).run()
                : editor?.chain().focus().unsetFontFamily().run()
            }
          >
            <option value="">
              خط الصفحة · {FONT_OPTIONS.find((f) => f.id === prefs.font)?.name}
            </option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.family}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            aria-label="حجم النص المحدد"
            value={state?.size || ""}
            onChange={(e) =>
              e.target.value
                ? editor?.chain().focus().setFontSize(e.target.value).run()
                : editor?.chain().focus().unsetFontSize().run()
            }
          >
            <option value="">الحجم · {prefs.size}</option>
            {[14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48].map((n) => (
              <option key={n} value={n + "px"}>
                {n}
              </option>
            ))}
          </select>
          <select
            aria-label="نمط الفقرة"
            value={state?.heading || "p"}
            onChange={(e) => {
              if (e.target.value === "p")
                editor?.chain().focus().setParagraph().run();
              else
                editor
                  ?.chain()
                  .focus()
                  .setHeading({ level: Number(e.target.value) as 1 | 2 | 3 })
                  .run();
            }}
          >
            <option value="p">نص عادي</option>
            <option value="1">عنوان رئيسي</option>
            <option value="2">عنوان فرعي</option>
            <option value="3">عنوان صغير</option>
          </select>
          <button
            className={"page-preferences-button " + (settings ? "active" : "")}
            aria-expanded={settings}
            aria-label="إعدادات صفحة الكتابة"
            onClick={() => setSettings(!settings)}
          >
            <SlidersHorizontal size={16} />
            <span>صفحة الكتابة</span>
            <ChevronDown size={12} />
          </button>
        </div>
        <div
          className="editor-toolbar glass advanced-toolbar"
          role="toolbar"
          aria-label="تنسيق النص"
        >
          <div className="tool-group">
            {action(
              "عريض",
              Bold,
              () => {
                editor?.chain().focus().toggleBold().run();
              },
              !!state?.bold,
            )}
            {action(
              "مائل",
              Italic,
              () => {
                editor?.chain().focus().toggleItalic().run();
              },
              !!state?.italic,
            )}
            {action(
              "تسطير",
              Underline,
              () => {
                editor?.chain().focus().toggleUnderline().run();
              },
              !!state?.underline,
            )}
            {action(
              "يتوسطه خط",
              Strikethrough,
              () => {
                editor?.chain().focus().toggleStrike().run();
              },
              !!state?.strike,
            )}
            {action(
              "تظليل النص",
              Highlighter,
              () => {
                editor
                  ?.chain()
                  .focus()
                  .toggleHighlight({ color: "#594b2c" })
                  .run();
              },
              !!state?.highlight,
            )}
            <label className="text-color" title="لون النص">
              <span className="sr-only">لون النص</span>
              <input
                type="color"
                aria-label="لون النص"
                value={
                  /^#[0-9a-f]{6}$/i.test(state?.color || "")
                    ? state!.color
                    : "#ffffff"
                }
                onChange={(e) =>
                  editor?.chain().focus().setColor(e.target.value).run()
                }
              />
              <span>A</span>
            </label>
          </div>
          <div className="tool-group">
            {action(
              "محاذاة يمين",
              AlignRight,
              () => {
                editor?.chain().focus().setTextAlign("right").run();
              },
              state?.align === "right",
            )}
            {action(
              "توسيط",
              AlignCenter,
              () => {
                editor?.chain().focus().setTextAlign("center").run();
              },
              state?.align === "center",
            )}
            {action(
              "محاذاة يسار",
              AlignLeft,
              () => {
                editor?.chain().focus().setTextAlign("left").run();
              },
              state?.align === "left",
            )}
            {action(
              "ضبط السطور",
              AlignJustify,
              () => {
                editor?.chain().focus().setTextAlign("justify").run();
              },
              state?.align === "justify",
            )}
            {action(
              "قائمة",
              List,
              () => {
                editor?.chain().focus().toggleBulletList().run();
              },
              !!state?.bullet,
            )}
            {action(
              "قائمة مرقمة",
              ListOrdered,
              () => {
                editor?.chain().focus().toggleOrderedList().run();
              },
              !!state?.ordered,
            )}
            {action(
              "اقتباس",
              Quote,
              () => {
                editor?.chain().focus().toggleBlockquote().run();
              },
              !!state?.quote,
            )}
          </div>
          <div className="tool-group secondary-tools">
            {action(
              "إضافة رابط",
              Link2,
              () => {
                setLinkError("");
                setLink(true);
              },
              !!editor?.isActive("link"),
            )}
            {action("فاصل داخل الفصل", Minus, () => {
              editor?.chain().focus().setHorizontalRule().run();
            })}
            {action("مسافة بداية الفقرة", IndentIncrease, () => {
              const type = editor?.isActive("heading")
                ? "heading"
                : "paragraph";
              const n = Number(editor?.getAttributes(type).firstIndent || 0);
              editor
                ?.chain()
                .focus()
                .updateAttributes(type, { firstIndent: (n + 1) % 4 })
                .run();
            })}
            <select
              aria-label="اتجاه الفقرة"
              onChange={(e) => {
                const type = editor?.isActive("heading")
                  ? "heading"
                  : "paragraph";
                editor
                  ?.chain()
                  .focus()
                  .updateAttributes(type, { textDirection: e.target.value })
                  .run();
              }}
              value={state?.direction || "rtl"}
            >
              <option value="rtl">عربي ←</option>
              <option value="ltr">English →</option>
              <option value="auto">تلقائي</option>
            </select>
            {action("إزالة التنسيق", RemoveFormatting, () => {
              editor?.chain().focus().unsetAllMarks().clearNodes().run();
            })}
          </div>
          <div className="tool-group">
            {action("تراجع", Undo2, () => {
              editor?.chain().focus().undo().run();
            })}
            {action("إعادة", Redo2, () => {
              editor?.chain().focus().redo().run();
            })}
            {action("بحث واستبدال", Search, onFind)}
          </div>
        </div>
      </div>
      {settings && (
        <section
          className="writing-preferences glass"
          aria-label="راحة الكتابة"
        >
          <div>
            <h3>صفحة تكتب على مهل.</h3>
            <p>
              تغيّر هذه الإعدادات عرض النص لك. تنسيق التحديد أعلاه يُحفظ داخل
              الفصل.
            </p>
          </div>
          <label className="field">
            خط صفحة الكتابة
            <select
              aria-label="خط صفحة الكتابة"
              value={prefs.font}
              onChange={(e) => onPreferences?.({ font: e.target.value })}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.description}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            حجم صفحة الكتابة{" "}
            <input
              aria-label="حجم صفحة الكتابة"
              type="range"
              min="16"
              max="40"
              value={prefs.size}
              onChange={(e) => onPreferences?.({ size: +e.target.value })}
            />
            <output>{prefs.size}</output>
          </label>
          <label className="field">
            تباعد سطور الصفحة
            <select
              aria-label="تباعد سطور الصفحة"
              value={prefs.lineHeight}
              onChange={(e) => onPreferences?.({ lineHeight: +e.target.value })}
            >
              {[1.4, 1.6, 1.8, 2, 2.2, 2.5, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            عرض صفحة الكتابة
            <input
              aria-label="عرض صفحة الكتابة"
              type="range"
              min="420"
              max="900"
              step="20"
              value={prefs.width}
              onChange={(e) => onPreferences?.({ width: +e.target.value })}
            />
          </label>
          <p className="preference-save-status" role="status">
            {preferenceStatus === "synced"
              ? "إعدادات الصفحة محفوظة في حسابك"
              : preferenceStatus === "pending"
                ? "جارٍ حفظ إعدادات الصفحة…"
                : preferenceStatus === "storage-error"
                  ? "تعذّر حفظ إعدادات الصفحة على الجهاز"
                  : "إعدادات الصفحة محفوظة على هذا الجهاز"}
          </p>
          <div
            className="font-specimen"
            style={{ fontFamily: fontFamily(prefs.font) }}
          >
            على مهلٍ، تُولد الحكايات من كلمة.
          </div>
        </section>
      )}
      {link && (
        <Dialog title="رابط داخل النص" onClose={() => setLink(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = safeLink(new FormData(e.currentTarget).get("url"));
              if (!url) {
                setLinkError("أدخل رابطًا يبدأ بـ https:// أو http://");
                return;
              }
              editor
                ?.chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
              setLink(false);
            }}
          >
            <Field
              autoFocus
              label="عنوان الرابط"
              name="url"
              type="url"
              dir="ltr"
              required
              defaultValue={editor?.getAttributes("link").href || ""}
            />
            {linkError && <p role="alert">{linkError}</p>}
            <div className="inline-actions">
              <button className="primary">حفظ الرابط</button>
              <button
                type="button"
                onClick={() => {
                  editor
                    ?.chain()
                    .focus()
                    .extendMarkRange("link")
                    .unsetLink()
                    .run();
                  setLink(false);
                }}
              >
                إزالة الرابط
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
