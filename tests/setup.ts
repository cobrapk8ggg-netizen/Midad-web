import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export default async function setup() {
  if (
    process.env.E2E_CREDENTIALS_FILE &&
    fs.existsSync(process.env.E2E_CREDENTIALS_FILE)
  )
    return;
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
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL || vars.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const password = "MidadQA!" + crypto.randomUUID();
  const emailA = "midad.e2e.a." + Date.now() + "@gmail.com",
    emailB = "midad.e2e.b." + Date.now() + "@gmail.com";
  for (const email of [emailA, emailB]) {
    const r = await fetch(base + "/functions/v1/midad-signup", {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok)
      throw new Error(
        "Could not provision dedicated E2E account: " +
          r.status +
          " " +
          (await r.text()),
      );
  }
  const file = path.join(os.tmpdir(), "midad-e2e-credentials.json");
  fs.writeFileSync(file, JSON.stringify({ emailA, emailB, password }), {
    mode: 0o600,
  });
  process.env.E2E_CREDENTIALS_FILE = file;
}
