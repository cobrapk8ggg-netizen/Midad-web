"use client";
import { useState } from "react";
import { Download, Upload, ShieldCheck } from "lucide-react";
import {
  createBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from "../lib/portable";
import { errorMessage } from "./ui";
export default function BackupManager({
  onChanged,
  onError,
}: {
  onChanged: () => void;
  onError: (s: string) => void;
}) {
  const [preview, setPreview] = useState<Backup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="backup-manager">
      <div className="section-actions">
        <h3>
          <ShieldCheck size={16} />
          نسخة من عوالمك
        </h3>
      </div>
      <p className="muted">
        نسخة JSON تشمل النصوص والكيانات والتخطيط والنسخ السابقة. الصور والملفات
        ليست ضمن هذه النسخة.
      </p>
      <button
        className="full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void (async () => {
            try {
              const backup = await createBackup();
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(backup, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download =
                "midad-backup-" +
                new Date().toISOString().slice(0, 10) +
                ".json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setMessage("تم تنزيل النسخة الاحتياطية.");
            } catch (e) {
              onError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <Download size={16} />
        تنزيل نسخة احتياطية
      </button>
      <label className="field">
        استعادة نسخة
        <input
          type="file"
          accept=".json"
          aria-label="ملف النسخة الاحتياطية"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void file
                .text()
                .then((text) => setPreview(parseBackup(text)))
                .catch((e) => onError(errorMessage(e)));
          }}
        />
      </label>
      {preview && (
        <div className="backup-preview">
          <p>
            {preview.rows.filter((r) => r._table === "projects").length} روايات
            · {preview.rows.filter((r) => r._table === "scenes").length} مشاهد
          </p>
          <small>
            ستُضاف نسخ جديدة بمعرّفات مستقلة؛ لن تُستبدل أعمالك الحالية.
          </small>
          <button
            className="primary full"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void restoreBackup(preview)
                .then((n) => {
                  setMessage(`تمت استعادة ${n} روايات كنسخ جديدة.`);
                  setPreview(null);
                  onChanged();
                })
                .catch((e) => onError(errorMessage(e)))
                .finally(() => setBusy(false));
            }}
          >
            <Upload size={16} />
            استيراد كنسخة جديدة
          </button>
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
