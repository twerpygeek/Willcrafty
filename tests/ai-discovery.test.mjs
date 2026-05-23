import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

test("llms.txt describes WillCrafty and links to key mirrors", async () => {
  const llms = await readProjectFile("llms.txt");

  assert.match(llms, /^# WillCrafty/m);
  assert.match(llms, /^> WillCrafty is a free, browser-first will drafting tool/m);
  assert.match(llms, /https:\/\/willcrafty\.com\/create\.md/);
  assert.match(llms, /https:\/\/willcrafty\.com\/security\.md/);
  assert.match(llms, /not a law firm/i);
});

test("sitemap lists html, markdown, and AI discovery assets", async () => {
  const sitemap = await readProjectFile("sitemap.xml");

  for (const url of [
    "https://willcrafty.com/",
    "https://willcrafty.com/index.md",
    "https://willcrafty.com/create.md",
    "https://willcrafty.com/ai-help.md",
    "https://willcrafty.com/pricing.md",
    "https://willcrafty.com/security.md",
    "https://willcrafty.com/brand-guidelines.md",
    "https://willcrafty.com/llms.txt",
  ]) {
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll(".", "\\.")}</loc>`));
  }
});

test("markdown mirrors stay content-focused and avoid page chrome", async () => {
  const createMirror = await readProjectFile("create.md");
  const securityMirror = await readProjectFile("security.md");
  const combined = `${createMirror}\n${securityMirror}`;

  assert.match(combined, /browser-only/i);
  assert.match(combined, /not store/i);
  assert.doesNotMatch(combined, /<nav|<footer|<script|cookie banner/i);
});

test("homepage includes parseable structured data for search engines", async () => {
  const html = await readProjectFile("index.html");
  const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);

  assert.ok(match, "expected a JSON-LD script tag");

  const schema = JSON.parse(match[1]);
  const types = schema["@graph"].map((item) => item["@type"]);

  assert.equal(schema["@context"], "https://schema.org");
  assert.deepEqual(types, ["Organization", "WebSite", "SoftwareApplication", "Service", "FAQPage"]);
  assert.match(JSON.stringify(schema), /self-help drafting tool/i);
});

test("hosting config serves discovery text files with crawlable headers", async () => {
  const vercel = JSON.parse(await readProjectFile("vercel.json"));
  const netlify = await readProjectFile("netlify.toml");

  assert.match(JSON.stringify(vercel), /X-Robots-Tag/);
  assert.match(JSON.stringify(vercel), /text\/plain; charset=utf-8/);
  assert.match(netlify, /for = "\/llms\.txt"/);
  assert.match(netlify, /X-Robots-Tag = "index, follow"/);
});
