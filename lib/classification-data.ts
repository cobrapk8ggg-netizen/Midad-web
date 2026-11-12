type Row = Record<string, unknown> & { _table: string };
export const CLASSIFICATION_TABLES = [
  "novel_metadata",
  "project_genres",
  "novel_tags",
];
export function classificationPayloads(rows: Row[]) {
  const projects = [
    ...new Set(
      rows
        .filter((r) => CLASSIFICATION_TABLES.includes(r._table))
        .map((r) => String(r.project_id)),
    ),
  ];
  return projects.map((id) => {
    const m = rows.find(
      (r) => r._table === "novel_metadata" && r.project_id === id,
    );
    return {
      project_id: id,
      metadata: {
        status: m?.status || "ongoing",
        age_rating: m?.age_rating || "all",
        language: m?.language || "ar",
        warnings: m?.warnings || [],
      },
      genres: rows
        .filter((r) => r._table === "project_genres" && r.project_id === id)
        .map((r) => String(r.genre_code)),
      tags: rows
        .filter((r) => r._table === "novel_tags" && r.project_id === id)
        .map((r) => String(r.tag)),
    };
  });
}
