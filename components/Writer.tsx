"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { ParagraphFlow } from "../lib/editor-flow";
import { fontFamily } from "../lib/fonts";
import EditorTools, { type WriterPreferences } from "./EditorTools";
import { Check, CloudOff, AlertCircle } from "lucide-react";
import { saveScene } from "../lib/supabase";
import { isGuestActive } from "../lib/guest";
import type { Scene } from "../lib/types";
import { countWords } from "../lib/words";
import { AnnotationMark } from "../lib/annotation-mark";
import type { Editor } from "@tiptap/react";
export type WriterHandle = {
  flush: () => Promise<boolean>;
  replace: (content: JSONContent) => void;
  getText: () => string;
  getEditor: () => Editor | null;
};
const Writer = forwardRef<
  WriterHandle,
  {
    scene: Scene;
    userId: string;
    onSaved: (s: Scene) => void;
    size: number;
    font: string;
    width: number;
    lineHeight: number;
    onReady: (editor: Editor) => void;
    onPreferences?: (prefs: Partial<WriterPreferences>) => void;
    preferenceStatus?: string;
  }
>(function Writer(
  {
    scene,
    userId,
    onSaved,
    size,
    font,
    width,
    lineHeight,
    onReady,
    onPreferences,
    preferenceStatus,
  },
  ref,
) {
  const key = `midad:${userId}:${scene.id}`;
  const [status, setStatus] = useState("ready");
  const [words, setWords] = useState(countWords(scene.plain_text));
  const [find, setFind] = useState(false);
  const [needle, setNeedle] = useState("");
  const [replacement, setReplacement] = useState("");
  const [recovery, setRecovery] = useState<{
    content: JSONContent;
    version: number;
  } | null>(null);
  const version = useRef(scene.version);
  const pending = useRef<{ content: JSONContent; text: string } | null>(null);
  const running = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflict = useRef(false);
  const alive = useRef(true);
  async function flush(): Promise<boolean> {
    if (running.current) {
      await running.current;
      if (pending.current && !conflict.current) return flush();
      return !pending.current;
    }
    if (conflict.current) return false;
    if (!pending.current) return true;
    const payload = pending.current;
    setStatus("saving");
    const op = (async () => {
      let saved: Scene;
      try {
        saved = await saveScene(
          scene.id,
          version.current,
          payload.content,
          payload.text,
        );
      } catch (error) {
        const message = String(
          (error as { message?: string }).message || error,
        );
        if (message.includes("version_conflict")) {
          conflict.current = true;
          if (alive.current) setStatus("conflict");
        } else if (alive.current) setStatus("offline");
        return false;
      }
      version.current = saved.version;
      if (pending.current === payload) {
        pending.current = null;
        localStorage.removeItem(key);
      } else if (pending.current) {
        localStorage.setItem(
          key,
          JSON.stringify({ ...pending.current, version: version.current }),
        );
      }
      onSaved(saved);
      if (alive.current) setStatus(pending.current ? "dirty" : "saved");
      return true;
    })();
    running.current = op;
    const ok = await op;
    running.current = null;
    if (ok && pending.current) return flush();
    return ok;
  }
  function queue(content: JSONContent, text: string) {
    pending.current = { content, text };
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ content, text, version: version.current }),
      );
      setStatus("dirty");
    } catch {
      setStatus("local-error");
    }
    setWords(countWords(text));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 850);
  }
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      ParagraphFlow,
      AnnotationMark,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: scene.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        dir: "rtl",
        "aria-label": "نص الفصل",
        role: "textbox",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => queue(editor.getJSON(), editor.getText()),
  });
  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);
  useImperativeHandle(ref, () => ({
    flush,
    replace: (content) => {
      editor?.commands.setContent(content, { emitUpdate: true });
    },
    getText: () => editor?.getText() || "",
    getEditor: () => editor,
  }));
  useEffect(() => {
    alive.current = true;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setRecovery(JSON.parse(raw));
      } catch {
        setStatus("local-error");
      }
    }
    const retry = () => {
      if (pending.current && !conflict.current) void flush();
    };
    const t = setInterval(retry, 8000);
    const leave = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", retry);
    window.addEventListener("beforeunload", leave);
    return () => {
      alive.current = false;
      clearInterval(t);
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("online", retry);
      window.removeEventListener("beforeunload", leave);
    };
  }, [key]);
  const labels: Record<string, string> = {
    ready: isGuestActive() ? "محفوظ على هذا الجهاز" : "محفوظ في حسابك",
    saved: isGuestActive() ? "محفوظ على هذا الجهاز" : "محفوظ في حسابك",
    dirty: "تعديلات محلية تنتظر الحفظ",
    saving: "جارٍ الحفظ…",
    offline: "تعذر الحفظ. مسودة محلية محفوظة؛ سنعيد المحاولة.",
    conflict: "توجد نسخة أحدث. نزّل نصك ثم أعد فتح المشهد للمقارنة.",
    "local-error": "التخزين المحلي غير متاح. لا تغلق الصفحة قبل نجاح الحفظ.",
  };
  return (
    <>
      <EditorTools
        editor={editor}
        prefs={{ font, size, width, lineHeight }}
        preferenceStatus={preferenceStatus}
        onPreferences={onPreferences}
        onFind={() => setFind((x) => !x)}
      />
      {find && (
        <div className="find-bar">
          <input
            aria-label="النص المطلوب"
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="بحث في المشهد"
          />
          <input
            aria-label="النص البديل"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="استبدال بـ"
          />
          <button
            onClick={() => {
              if (!editor || !needle) return;
              const matches: { from: number; to: number }[] = [];
              editor.state.doc.descendants((node, pos) => {
                if (!node.isText) return;
                let start = 0;
                while (true) {
                  const i = node.text!.indexOf(needle, start);
                  if (i < 0) break;
                  matches.push({ from: pos + i, to: pos + i + needle.length });
                  start = i + needle.length;
                }
              });
              const tr = editor.state.tr;
              for (const m of matches.reverse())
                tr.insertText(replacement, m.from, m.to);
              editor.view.dispatch(tr);
            }}
          >
            استبدال الكل
          </button>
        </div>
      )}
      {recovery && (
        <div className="notice">
          وُجدت مسودة محلية غير مرفوعة.{" "}
          {recovery.version !== version.current &&
            "النسخة السحابية تغيّرت؛ راجع النص قبل الحفظ."}
          <button
            onClick={() => {
              editor?.commands.setContent(recovery.content, {
                emitUpdate: true,
              });
              setRecovery(null);
            }}
          >
            استعادة المسودة
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(key);
              setRecovery(null);
            }}
          >
            تجاهل المسودة المحلية
          </button>
        </div>
      )}
      {status === "conflict" && (
        <div className="notice">
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([editor?.getText() || ""], {
                  type: "text/plain;charset=utf-8",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = scene.title + "-local.txt";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            تنزيل نسختي المحلية
          </button>
          <button onClick={() => location.reload()}>
            إعادة فتح النسخة السحابية
          </button>
        </div>
      )}
      <div className="manuscript-scroll">
        <article
          className="manuscript"
          style={{
            maxWidth: width,
            fontSize: size,
            lineHeight,
            fontFamily: fontFamily(font),
          }}
        >
          <div className="scene-label">{scene.title}</div>
          <EditorContent editor={editor} />
          <div className="end-mark">∗ ∗ ∗</div>
        </article>
      </div>
      <div className="writer-status">
        <span role="status">
          {["offline", "conflict", "local-error"].includes(status) ? (
            <AlertCircle size={13} />
          ) : status === "saved" || status === "ready" ? (
            <Check size={13} />
          ) : (
            <CloudOff size={13} />
          )}{" "}
          {labels[status]}
        </span>
        <span>{words.toLocaleString("ar")} كلمة</span>
      </div>
    </>
  );
});
export default Writer;
