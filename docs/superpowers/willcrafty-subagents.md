# WillCrafty Superpowers Subagent Workflow

This document adapts the `obra/superpowers` methodology to WillCrafty.

## Goal

Use subagents to improve WillCrafty faster without creating conflicting edits, privacy drift, or unverified product claims.

The main agent remains responsible for coordination, integration, final verification, and deployment decisions.

## When To Dispatch

Dispatch subagents when work can be split into independent domains:

- Design/UI polish.
- Will builder logic.
- Monetization and checkout.
- AI helper integration.
- AI/search discovery.
- Security/privacy/deployment headers.
- Test coverage and regression checks.
- Legal-risk copy review.

Keep the task local when it is a small single-file edit, needs secret handling, or requires one tightly coupled decision.

## Workstream Ownership

Use disjoint file ownership by default.

| Workstream | Typical Owner | Files |
| --- | --- | --- |
| Landing/UI | worker | `index.html`, `styles.css`, `brand-guidelines.html`, `favicon.svg` |
| Will builder | worker | `app.js`, `willcrafty-core.mjs`, `tests/willcrafty-core.test.mjs` |
| Monetization | worker | `monetization-core.mjs`, `api/checkout.js`, `tests/monetization-core.test.mjs`, `tests/checkout-api.test.mjs` |
| AI helper | worker | `api/agent.js`, `app.js`, `tests/agent-api.test.mjs` |
| AI/search discovery | worker | `llms.txt`, `sitemap.xml`, `robots.txt`, `*.md`, `tests/ai-discovery.test.mjs` |
| Deployment/security | worker | `vercel.json`, `netlify.toml`, `README.md`, deployment-related tests |
| Video/onboarding | worker | `onboarding-core.mjs`, `video/`, `assets/`, `tests/onboarding-core.test.mjs` |

If two workstreams need the same file, the main agent owns that file and integrates the subagent findings manually.

## Agent Types

### Explorer

Use explorers for read-only investigation.

Good explorer tasks:

- Find which files own a feature.
- Identify missing test coverage.
- Audit privacy/security claims.
- Compare deployment config against expected headers.
- Review AI-discovery assets for crawlability.

Expected output:

- Findings with exact file references.
- Recommended next actions.
- Explicit uncertainty.

### Worker

Use workers for bounded implementation in disjoint files.

Worker rules:

- Own only assigned files.
- Do not revert unrelated changes.
- Add or update tests for the assigned behavior.
- Return changed file paths and verification commands.
- Preserve the browser-only privacy promise unless the task explicitly changes architecture.

### Reviewer

Use reviewers after meaningful implementation.

Reviewer roles:

- Spec reviewer: checks whether the change matches the requested behavior and did not add unrelated scope.
- Code-quality reviewer: checks bugs, regressions, missing tests, security/privacy issues, and maintainability.
- Final reviewer: checks the integrated diff before deploy or commit.

## Standard Prompts

Prompt templates live in `docs/superpowers/prompts/`:

- `explorer-prompt.md`
- `implementer-prompt.md`
- `spec-reviewer.md`
- `code-quality-reviewer.md`

Copy the relevant template into the subagent prompt and fill every placeholder before dispatch.

## Verification Commands

Run these after integrating subagent work:

```bash
node --test tests/*.mjs
node --check app.js && node --check api/agent.js && node --check api/checkout.js && node --check onboarding-core.mjs && node --check willcrafty-core.mjs && node --check monetization-core.mjs
git diff --check
```

For visual/UI changes, also run a local server and capture at least one desktop screenshot:

```bash
python3 -m http.server 4173
```

Then inspect `http://localhost:4173/` and the changed route or hash.

## Non-Negotiables

- Never expose secrets in code, docs, tests, command output, or screenshots.
- Never tell users the generated draft is automatically legally valid.
- Never weaken the privacy model without making the tradeoff explicit.
- Never let two workers edit the same file in parallel.
- Never ship without local verification.
