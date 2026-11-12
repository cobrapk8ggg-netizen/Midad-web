import type { JSONContent } from "@tiptap/react";
export type Project = {
  user_id?: string;
  story?: string;
  access_role?: "owner" | "reader" | "editor";
  cover_path?: string | null;
  id: string;
  title: string;
  description: string;
  goal: number;
  created_at: string;
  updated_at: string;
};
export type Book = {
  id: string;
  title: string;
  project_id: string;
  position: number;
};
export type Chapter = {
  writing_mode?: "continuous" | "scenes";
  draft_id?: string | null;
  id: string;
  title: string;
  book_id: string;
  position: number;
};
export type Scene = {
  id: string;
  chapter_id: string;
  title: string;
  content: JSONContent;
  plain_text: string;
  version: number;
  position: number;
};
export type Revision = {
  id: string;
  content: JSONContent;
  plain_text: string;
  version: number;
  created_at: string;
};
export type Note = { id: string; title: string; body: string };
export type Entity = {
  image_path?: string | null;
  id: string;
  name: string;
  kind: string;
  description: string;
  background: string;
  goals: string;
};
export type PlotEvent = {
  id: string;
  title: string;
  body: string;
  stage: string;
  story_date: string;
  position: number;
};
