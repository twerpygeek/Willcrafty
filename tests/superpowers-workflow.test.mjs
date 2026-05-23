import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

test("repo-level agent instructions point to the WillCrafty subagent workflow", async () => {
  const agents = await readProjectFile("AGENTS.md");

  assert.match(agents, /Superpowers workflow/);
  assert.match(agents, /docs\/superpowers\/willcrafty-subagents\.md/);
  assert.match(agents, /node --test tests\/\*\.mjs/);
});

test("subagent workflow defines roles, ownership, and non-negotiables", async () => {
  const workflow = await readProjectFile("docs/superpowers/willcrafty-subagents.md");

  for (const expected of [
    "Explorer",
    "Worker",
    "Reviewer",
    "Workstream Ownership",
    "Never expose secrets",
    "Never let two workers edit the same file in parallel",
  ]) {
    assert.match(workflow, new RegExp(expected));
  }
});

test("subagent prompt templates cover explorer, worker, and reviewer flows", async () => {
  const templates = [
    "docs/superpowers/prompts/explorer-prompt.md",
    "docs/superpowers/prompts/implementer-prompt.md",
    "docs/superpowers/prompts/spec-reviewer.md",
    "docs/superpowers/prompts/code-quality-reviewer.md",
  ];

  for (const template of templates) {
    const body = await readProjectFile(template);
    assert.match(body, /WillCrafty/);
    assert.match(body, /Output Schema/);
    assert.match(body, /Relevant Context/);
  }
});
