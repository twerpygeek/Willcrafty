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
- Motion-powered animation via CDN, with graceful fallback
- Animated onboarding walkthrough on the landing page
- HyperFrames and Remotion source files in `video/` for rendering an onboarding MP4
- Rendered onboarding video at `assets/willcrafty-onboarding.mp4`
- Brand guidelines page at `brand-guidelines.html`

## Important Note

This is a self-help web app prototype, not legal advice. Users should review local signing and witness requirements before signing any will.

## Monetization

The app keeps basic drafting free and charges for support layers:

- `Free Draft`: RM0 self-help draft and export
- `WillCrafty Plus`: RM149 execution pack
- `Expert Review`: RM499+ human review intake
- `Family Pack`: RM899+ two coordinated wills

Current implementation creates an email lead request. Real checkout should be added only after Stripe or another payment provider is configured and review operations are ready.
