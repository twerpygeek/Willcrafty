# WillCrafty

WillCrafty is a static, mobile-first willmaker prototype built with plain HTML, CSS, and JavaScript. It uses Tiffany Blue (`#0ABAB5`) as the main brand color and keeps the will creation flow private by default: no account, no server database, and no packages to install.

## Open The App

Open `index.html` in a browser, or run a tiny local server from this folder:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Included

- Modern landing page for `willcrafty.com`
- Multi-step will creation form
- Beneficiary, asset, executor, guardian, and personal wishes sections
- Jurisdiction-aware disclaimer text
- Download as print-to-PDF, Word-compatible `.doc`, or plain text
- Beneficiary notification email drafts with acknowledgement checklist
- Monetization layer with Free, Plus, Expert Review, and Family Pack offers
- Plan recommendation logic based on draft complexity
- Optional AI question helper through a server-side FreeLLMAPI-compatible proxy
- Motion-powered animation via CDN, with graceful fallback
- Animated onboarding walkthrough on the landing page
- HyperFrames and Remotion source files in `video/` for rendering an onboarding MP4
- Rendered onboarding video at `assets/willcrafty-onboarding.mp4`
- Brand guidelines page at `brand-guidelines.html`
- Design direction and tool-fit notes in `DESIGN.md`
- AI/search discovery files: `llms.txt`, `sitemap.xml`, `robots.txt`, and Markdown mirrors for key pages
- Superpowers subagent workflow in `AGENTS.md` and `docs/superpowers/`

## Important Note

This is a self-help web app prototype, not legal advice. Users should review local signing and witness requirements before signing any will.

## Monetization

The app keeps basic drafting free and charges for support layers:

- `Free Draft`: RM0 self-help draft and export
- `WillCrafty Plus`: RM149 execution pack
- `Expert Review`: RM499+ human review intake
- `Family Pack`: RM899+ two coordinated wills

Paid plans use the Vercel serverless endpoint at `/api/checkout` to create one-time Stripe Checkout Sessions in MYR. The browser never receives the Stripe secret key.

Required Vercel environment variable:

- `STRIPE_SECRET_KEY`: Stripe restricted or secret key with Checkout Session creation access.

The email lead request remains available as a fallback when checkout is not configured or when a user needs a custom review scope.

## AI Helper

The AI helper calls `/api/agent`, which forwards to a FreeLLMAPI-compatible OpenAI chat endpoint. Do not put upstream provider keys or the FreeLLMAPI unified key in browser JavaScript.

Required deployment variables:

- `FREELLMAPI_BASE_URL`: your FreeLLMAPI server base URL, for example `https://your-proxy.example.com/v1`.
- `FREELLMAPI_API_KEY`: your FreeLLMAPI unified bearer key, for example `freellmapi-...`.

Backward-compatible aliases are also supported: `FREE_LLM_API_BASE_URL` and `FREE_LLM_API_KEY`.

The helper is for general self-help explanations only. It does not automatically send the user’s will draft to the AI endpoint.

## AI And Search Discovery

The root discovery layer is designed for crawlers, search engines, and AI assistants:

- `llms.txt`: short Markdown summary of WillCrafty, services, differentiators, key links, and AI usage notes.
- `sitemap.xml`: crawlable index of the HTML page, Markdown mirrors, and discovery files.
- `robots.txt`: allows crawling and points to the sitemap.
- `*.md` mirrors: plain-content versions of the home, create, AI help, pricing, security, and brand pages.
- `index.html`: includes JSON-LD for Organization, WebSite, SoftwareApplication, Service, and FAQPage.

Vercel and Netlify configs set Markdown and discovery files to crawlable plain text where supported.
They should also mirror the same static security baseline: CSP, `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy: same-origin`. The CSP still permits `style-src 'unsafe-inline'` until inline brand-guideline swatches are removed.

## Superpowers Subagents

For non-trivial improvement cycles, use the Superpowers workflow captured in `AGENTS.md` and `docs/superpowers/willcrafty-subagents.md`.

The durable pattern is:

- Explorer agents investigate independent questions.
- Worker agents own disjoint file sets.
- Spec reviewers check requirement fit.
- Code-quality reviewers check bugs, tests, privacy, security, and maintainability.
- The main agent integrates and runs final verification.
