"use client";
import {
  MapPin,
  Link2,
  Feather,
  Copy,
  Check,
  ArrowUpRight,
  Camera,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { SocialImage } from "./SocialImage";
import type { WriterProfile } from "../lib/social";
import { safeLink } from "../lib/fonts";
export default function IdentityHeader({
  profile,
  preview = false,
  avatarPreview,
  bannerPreview,
  action,
}: {
  profile: WriterProfile;
  preview?: boolean;
  avatarPreview?: string;
  bannerPreview?: string;
  action?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  return (
    <header className="writer-identity">
      <div className="writer-banner">
        <SocialImage
          kind="banner"
          path={profile.banner_path}
          preview={bannerPreview}
          alt={"غلاف " + profile.display_name}
        />
        <div className="banner-grain" aria-hidden="true" />
        <span className="profile-wordmark">
          <Feather size={17} />
          مِداد · صفحة كاتب
        </span>
        {preview && (
          <span className="preview-badge">
            <Eye size={13} />
            معاينة ملفك
          </span>
        )}
      </div>
      <div className="writer-identity-body">
        <div className="writer-portrait">
          <SocialImage
            path={profile.avatar_path}
            preview={avatarPreview}
            alt={"صورة " + profile.display_name}
          />
        </div>
        <div className="writer-profile-actions">
          {action}
          {!preview && (
            <button
              className="profile-share"
              aria-label={copied ? "نُسخ رابط الملف" : "مشاركة الملف"}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setCopied(true);
                  setCopyError(false);
                  setTimeout(() => setCopied(false), 2500);
                } catch {
                  setCopyError(true);
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>
                {copied
                  ? "نُسخ الرابط"
                  : copyError
                    ? "انسخ عنوان الصفحة من المتصفح"
                    : "مشاركة الملف"}
              </span>
            </button>
          )}
        </div>
        <div className="writer-name-row">
          <div>
            <p className="writer-handle" dir="ltr">
              @{profile.username || "اسم_المستخدم"}
            </p>
            <h1>{profile.display_name || "اسمك الأدبي"}</h1>
            {profile.tagline && (
              <p className="writer-tagline">{profile.tagline}</p>
            )}
          </div>
        </div>
        {profile.bio && <p className="writer-bio">{profile.bio}</p>}
        <div className="writer-meta">
          {profile.location && (
            <span>
              <MapPin size={14} />
              {profile.location}
            </span>
          )}
          {profile.created_at && (
            <span>
              في مِداد منذ{" "}
              {new Date(profile.created_at).toLocaleDateString("ar", {
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>
        <div className="writer-links">
          {profile.links
            ?.filter((l) => safeLink(l.url))
            .map((l, i) => (
              <a
                key={i}
                href={safeLink(l.url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 size={14} />
                {l.label}
                <ArrowUpRight size={12} />
              </a>
            ))}
        </div>
        {!preview && (
          <dl className="writer-statistics">
            <div>
              <dt>رواية على الرف</dt>
              <dd>{(profile.books?.length || 0).toLocaleString("ar")}</dd>
            </div>
            <div>
              <dt>متابع</dt>
              <dd>{(profile.followers || 0).toLocaleString("ar")}</dd>
            </div>
            <div>
              <dt>يتابع</dt>
              <dd>{(profile.following || 0).toLocaleString("ar")}</dd>
            </div>
            <div>
              <dt>فصل منشور</dt>
              <dd>
                {(profile.books || [])
                  .reduce((n, b) => n + Number(b.chapter_count), 0)
                  .toLocaleString("ar")}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </header>
  );
}
