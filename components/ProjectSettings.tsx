"use client";
import { useState } from "react";
import { update } from "../lib/supabase";
import type { Project } from "../lib/types";
import { Field, errorMessage } from "./ui";
import { AssetUpload } from "./Assets";
import NovelClassification from "./NovelClassification";
export default function ProjectSettings({
  project,
  onSaved,
  onError,
}: {
  project: Project;
  onSaved: (p: Project) => void;
  onError: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      {" "}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          const p = {
            ...project,
            title: String(f.get("title")).trim(),
            description: String(f.get("description")),
            goal: Number(f.get("goal")),
          };
          void update("projects", p.id, {
            title: p.title,
            description: p.description,
            goal: p.goal,
          })
            .then(() => onSaved(p))
            .catch((e) => onError(errorMessage(e)))
            .finally(() => setBusy(false));
        }}
      >
        <AssetUpload
          table="projects"
          id={project.id}
          column="cover_path"
          path={project.cover_path}
          onError={onError}
          onSaved={(path) => onSaved({ ...project, cover_path: path })}
        />
        <Field
          label="اسم الرواية"
          name="title"
          defaultValue={project.title}
          required
          maxLength={200}
        />
        <Field
          label="عن الرواية"
          name="description"
          defaultValue={project.description}
        />
        <Field
          label="هدف الكلمات"
          type="number"
          name="goal"
          defaultValue={project.goal}
          min={1}
          max={2000000}
          required
        />
        <button className="primary full" disabled={busy}>
          حفظ إعدادات الرواية
        </button>
      </form>
      <NovelClassification projectId={project.id} onError={onError} />
    </>
  );
}
