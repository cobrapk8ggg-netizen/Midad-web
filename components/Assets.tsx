"use client";
import { useEffect, useState } from "react";
import { Upload, Trash2, ImagePlus } from "lucide-react";
import { supabase, update } from "../lib/supabase";
import { isGuestActive } from "../lib/guest";
import { errorMessage } from "./ui";
export function PrivateImage({
  path,
  className = "",
  alt = "",
}: {
  path?: string | null;
  className?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    if (!path || isGuestActive()) {
      setUrl("");
      return;
    }
    void supabase.storage
      .from("midad-assets")
      .createSignedUrl(path, 600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl || "");
      });
    return () => {
      active = false;
    };
  }, [path]);
  return url ? (
    <img src={url} alt={alt} className={className} loading="lazy" />
  ) : null;
}
export function AssetUpload({
  table,
  id,
  column,
  path,
  onSaved,
  onError,
}: {
  table: string;
  id: string;
  column: "cover_path" | "image_path";
  path?: string | null;
  onSaved: (path: string | null) => void;
  onError: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  if (isGuestActive())
    return (
      <p className="asset-guest">
        رفع الصور متاح بعد إنشاء حساب. أعمال الضيف النصية تبقى محفوظة على
        الجهاز.
      </p>
    );
  return (
    <section className="asset-upload">
      <PrivateImage
        path={path}
        alt="الصورة الحالية"
        className="asset-preview"
      />
      <label className="asset-input">
        <ImagePlus size={19} />
        <span>
          {busy ? "جارٍ رفع الصورة…" : path ? "استبدال الصورة" : "رفع صورة خاصة"}
        </span>
        <input
          aria-label="رفع صورة خاصة"
          type="file"
          disabled={busy}
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ext: Record<string, string> = {
              "image/png": "png",
              "image/jpeg": "jpg",
              "image/webp": "webp",
            };
            if (!ext[file.type] || file.size > 10 * 1024 * 1024) {
              onError("اختر PNG أو JPG أو WebP بحجم لا يتجاوز ١٠ ميغابايت.");
              return;
            }
            setBusy(true);
            void (async () => {
              let uploaded = "";
              try {
                const { data, error } = await supabase.auth.getUser();
                if (error || !data.user)
                  throw new Error("أعد تسجيل الدخول لرفع الصورة.");
                uploaded =
                  data.user.id +
                  "/" +
                  crypto.randomUUID() +
                  "." +
                  ext[file.type];
                const result = await supabase.storage
                  .from("midad-assets")
                  .upload(uploaded, file, {
                    contentType: file.type,
                    upsert: false,
                  });
                if (result.error) throw result.error;
                await update(table, id, { [column]: uploaded });
                if (path)
                  await supabase.storage.from("midad-assets").remove([path]);
                onSaved(uploaded);
              } catch (e) {
                if (uploaded)
                  await supabase.storage
                    .from("midad-assets")
                    .remove([uploaded]);
                onError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        />
      </label>
      {path && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!confirm("حذف الصورة؟")) return;
            setBusy(true);
            void (async () => {
              try {
                await update(table, id, { [column]: null });
                const r = await supabase.storage
                  .from("midad-assets")
                  .remove([path]);
                if (r.error) throw r.error;
                onSaved(null);
              } catch (e) {
                onError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <Trash2 size={14} />
          حذف الصورة
        </button>
      )}
      <small>
        <Upload size={12} />
        تُحفظ الصورة في مساحة خاصة بحسابك.
      </small>
    </section>
  );
}
