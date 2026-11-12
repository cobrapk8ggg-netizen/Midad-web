"use client";
import { useEffect, useRef, useState } from "react";
import { UserRound, Feather } from "lucide-react";
import { supabase } from "../lib/supabase";
export function SocialImage({
  path,
  alt,
  className = "",
  preview,
  kind = "avatar",
}: {
  path?: string | null;
  alt: string;
  className?: string;
  preview?: string;
  kind?: "avatar" | "banner" | "cover";
}) {
  const [url, setUrl] = useState("");
  const [retry, setRetry] = useState(0);
  const issuedAt = useRef(0);
  useEffect(() => {
    let active = true;
    setUrl("");
    if (path && !preview)
      void supabase.storage
        .from("midad-assets")
        .createSignedUrl(path, 60)
        .then(({ data }) => {
          if (active) {
            issuedAt.current = Date.now();
            setUrl(data?.signedUrl || "");
          }
        });
    return () => {
      active = false;
    };
  }, [path, preview, retry]);
  return (
    <div className={"social-image " + kind + " " + className}>
      {preview || url ? (
        <img
          src={preview || url}
          alt={alt}
          loading="lazy"
          onError={() => {
            setUrl("");
            if (!preview && Date.now() - issuedAt.current > 50000)
              setRetry((x) => x + 1);
          }}
        />
      ) : kind === "avatar" ? (
        <UserRound size={36} aria-hidden="true" />
      ) : kind === "cover" ? (
        <Feather size={32} aria-hidden="true" />
      ) : null}
    </div>
  );
}
export function useFilePreview(file: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}
export async function uploadWriterImage(
  userId: string,
  file: File,
  kind: "avatar" | "banner",
) {
  const ext: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!ext[file.type] || file.size > 5 * 1024 * 1024)
    throw Error("اختر صورة PNG أو JPEG أو WebP حتى 5 ميغابايت.");
  const image = await createImageBitmap(file);
  const pixels = image.width * image.height;
  image.close();
  if (pixels > 30000000) throw Error("أبعاد الصورة كبيرة جدًا؛ اختر صورة أصغر.");
  const path =
    userId +
    "/profile/" +
    kind +
    "-" +
    crypto.randomUUID() +
    "." +
    ext[file.type];
  const { error } = await supabase.storage
    .from("midad-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
