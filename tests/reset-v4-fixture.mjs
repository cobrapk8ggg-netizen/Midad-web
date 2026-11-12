// Reset only the dedicated V4 QA fixture before repeating its browser journey.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const vars = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const c = JSON.parse(
    fs.readFileSync("/tmp/midad-e2e-credentials.json", "utf8"),
  ),
  f = JSON.parse(fs.readFileSync("/tmp/midad-v4-fixture.json", "utf8"));
const client = () =>
    createClient(
      vars.NEXT_PUBLIC_SUPABASE_URL,
      vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    ),
  a = client(),
  b = client();
const good = (r) => {
  if (r.error) throw r.error;
  return r.data;
};
const au = good(
    await a.auth.signInWithPassword({ email: c.emailA, password: c.password }),
  ).user.id,
  bu = good(
    await b.auth.signInWithPassword({ email: c.emailB, password: c.password }),
  ).user.id;
const p = good(
  await a.from("midad_profiles").select("*").eq("user_id", au).single(),
);
good(
  await a.rpc("midad_save_writer_profile", {
    p_profile: {
      ...p,
      username: f.handle,
      display_name: "ليان السامر",
      is_public: true,
    },
    p_links: [{ label: "تليجرام", url: "https://t.me/example" }],
    p_showcase: [
      { project_id: f.teaser, position: 0, featured: true },
      { project_id: f.novel, position: 1, featured: false },
    ],
  }),
);
good(
  await b
    .from("midad_follows")
    .delete()
    .eq("follower_id", bu)
    .eq("author_id", au),
);
good(await b.from("midad_follows").insert({ follower_id: bu, author_id: au }));
good(
  await b
    .from("midad_ratings")
    .upsert({ project_id: f.novel, user_id: bu, score: 5 }),
);
good(
  await b
    .from("midad_reading_list")
    .delete()
    .eq("project_id", f.novel)
    .eq("user_id", bu),
);
good(
  await b
    .from("midad_reading_list")
    .insert({ project_id: f.novel, user_id: bu }),
);
console.log("Only V4 QA profile and social interactions reset.");

// The editor journey owns this exact QA title; remove earlier copies before repeating.
good(
  await a
    .from("midad_projects")
    .delete()
    .eq("user_id", au)
    .eq("title", "مدائن الغيم"),
);
