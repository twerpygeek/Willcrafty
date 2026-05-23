# WillCrafty Agent Instructions

Use the Superpowers workflow for non-trivial WillCrafty changes.

## Default Operating Mode

- Keep the core app static and privacy-preserving unless a task explicitly requires backend state.
- Preserve the promise that the free will draft is browser-first and not stored on WillCrafty servers.
- Do not commit secrets, API keys, Basic Auth passwords, or live provider credentials.
- Treat legal claims conservatively. WillCrafty is a self-help drafting tool, not a law firm.

## When To Use Subagents

Use Superpowers-style subagents when a task has two or more independent workstreams, such as:

- UI/layout polish plus tests.
- AI-discovery/SEO updates plus hosting headers.
- Stripe/checkout logic plus pricing copy.
- Security/privacy audit plus implementation.
- Deployment config plus post-deploy verification.

Do not use subagents for tiny single-file edits, secret handling, or tightly coupled changes where the next step depends on one immediate answer.

## Required Workflow

1. Read `docs/superpowers/willcrafty-subagents.md`.
2. Define disjoint file ownership for every worker.
3. Give each subagent a self-contained prompt.
4. Run the relevant verification commands after integrating work.
5. Use reviewer agents for major changes before shipping.

## Standard Verification

```bash
node --test tests/*.mjs
node --check app.js && node --check api/agent.js && node --check api/checkout.js && node --check onboarding-core.mjs && node --check willcrafty-core.mjs && node --check monetization-core.mjs
git diff --check
```
