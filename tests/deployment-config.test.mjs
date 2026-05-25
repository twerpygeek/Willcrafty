import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

test("deploy configs preserve the static security header contract", async () => {
  const vercel = JSON.parse(await readProjectFile("vercel.json"));
  const netlify = await readProjectFile("netlify.toml");

  const vercelHeaders = JSON.stringify(vercel);
  assert.match(vercelHeaders, /Content-Security-Policy/);
  assert.match(vercelHeaders, /frame-ancestors 'none'/);
  assert.match(vercelHeaders, /X-Frame-Options/);
  assert.match(vercelHeaders, /Cross-Origin-Opener-Policy/);

  assert.match(netlify, /Content-Security-Policy =/);
  assert.match(netlify, /frame-ancestors 'none'/);
  assert.match(netlify, /X-Frame-Options = "DENY"/);
  assert.match(netlify, /Cross-Origin-Opener-Policy = "same-origin"/);
});
