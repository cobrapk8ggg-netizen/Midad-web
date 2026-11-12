import fs from "node:fs";
import assert from "node:assert/strict";
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
  ),
  c = JSON.parse(fs.readFileSync("/tmp/midad-e2e-credentials.json", "utf8")),
  f = JSON.parse(fs.readFileSync("/tmp/midad-v4-fixture.json", "utf8"));
const client = () =>
    createClient(
      vars.NEXT_PUBLIC_SUPABASE_URL,
      vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    ),
  a = client(),
  b = client(),
  anon = client(),
  good = (r) => {
    if (r.error) throw r.error;
    return r.data;
  };
good(
  await a.auth.signInWithPassword({ email: c.emailA, password: c.password }),
);
good(
  await b.auth.signInWithPassword({ email: c.emailB, password: c.password }),
);
const report = { date: new Date().toISOString(), passed: 0, checks: [] };
const check = (name, v) => {
  assert.ok(v, name);
  report.passed++;
  report.checks.push(name);
};
const score = good(
  await b
    .from("midad_ratings")
    .select("score")
    .eq("project_id", f.novel)
    .eq("user_id", f.bu)
    .single(),
).score;
try {
  good(
    await a
      .from("midad_profiles")
      .update({ is_public: false })
      .eq("user_id", f.au),
  );
  const n = good(await anon.rpc("midad_catalog", { p_novel: f.novel }))[0];
  check(
    "Published novel with private author masks name handle and photo",
    n.author_name === "كاتب في مِداد" &&
      n.author_username === null &&
      n.author_avatar === null,
  );
  good(
    await a
      .from("midad_profiles")
      .update({ is_public: true })
      .eq("user_id", f.au),
  );
  good(
    await a
      .from("midad_members")
      .insert({ project_id: f.novel, member_id: f.bu, role: "editor" }),
  );
  check(
    "Existing reader vote excluded when reader becomes coauthor",
    good(await anon.rpc("midad_catalog", { p_novel: f.novel }))[0]
      .rating_count === 0,
  );
  check(
    "Coauthor cannot update old reader rating",
    !!(
      await b
        .from("midad_ratings")
        .update({ score: 3 })
        .eq("project_id", f.novel)
    ).error,
  );
  good(
    await a
      .from("midad_members")
      .delete()
      .eq("project_id", f.novel)
      .eq("member_id", f.bu),
  );
  check(
    "Confidence ranking uses five prior votes at three point five",
    Math.abs(
      Number(
        good(await anon.rpc("midad_catalog", { p_novel: f.novel }))[0]
          .rank_score,
      ) -
        (score + 17.5) / 6,
    ) < 0.0001,
  );
  fs.writeFileSync(
    "docs/v4-privacy-results.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await a
    .from("midad_profiles")
    .update({ is_public: true })
    .eq("user_id", f.au);
  await a
    .from("midad_members")
    .delete()
    .eq("project_id", f.novel)
    .eq("member_id", f.bu);
}
