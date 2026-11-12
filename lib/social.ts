import { supabase } from "./supabase";
export type Genre = { code: string; name_ar: string; name_en: string };
export type CatalogNovel = {
  id: string;
  title: string;
  description: string;
  cover_path: string | null;
  author_id: string;
  author_name: string;
  author_username: string | null;
  author_avatar: string | null;
  genres: string[];
  tags: string[];
  status: string;
  age_rating: string;
  language: string;
  warnings: string[];
  chapter_count: number;
  word_count: number;
  rating_avg: number;
  rating_count: number;
  rank_score: number;
  updated_at: string;
  featured: boolean;
};
export type WriterLink = { label: string; url: string; position?: number };
export type WriterProfile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  is_public?: boolean;
  tagline: string;
  location: string;
  avatar_path: string | null;
  banner_path: string | null;
  created_at?: string;
  links?: WriterLink[];
  books?: CatalogNovel[];
  followers?: number;
  following?: number;
};
export const STATUS_LABELS: Record<string, string> = {
  ongoing: "مستمرة",
  completed: "مكتملة",
  hiatus: "متوقفة مؤقتًا",
};
export const WARNING_LABELS: Record<string, string> = {
  violence: "عنف",
  "strong-language": "لغة حادة",
  death: "موت وفقد",
  abuse: "إساءة",
  "sexual-themes": "موضوعات للبالغين",
};
export const GENRE_LABELS: Record<string, string> = {
  fantasy: "فانتازيا",
  "science-fiction": "خيال علمي",
  romance: "رومانسية",
  mystery: "غموض",
  thriller: "إثارة وتشويق",
  horror: "رعب",
  adventure: "مغامرة",
  action: "أكشن",
  drama: "دراما",
  comedy: "كوميديا",
  historical: "تاريخية",
  litrpg: "LitRPG",
  cultivation: "فنون قتالية وارتقاء",
  "slice-of-life": "حياة يومية",
  psychological: "نفسية",
  dystopian: "ديستوبيا",
  sports: "رياضة",
  literary: "أدب واقعي",
};
export async function catalog(params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc("midad_catalog", params);
  if (error) throw error;
  return (data || []) as CatalogNovel[];
}
export async function writerProfile(handle: string) {
  const { data, error } = await supabase.rpc("midad_writer_profile", {
    handle,
  });
  if (error) throw error;
  return data as WriterProfile | null;
}
