# WillCrafty Design Direction

## Current Decision

WillCrafty stays a fast static app. The design should use premium glass, motion, and a more ownable Tiffany Blue logo without adding React, Three.js, or package installs to the production app.

## Tool Fit

| Tool | Fit | Decision |
| --- | --- | --- |
| Skiper UI | High as visual reference, low as direct dependency | Borrow the sharper component density, hover detail, and motion taste. Do not install because the app is not shadcn/React. |
| liquid-logo | High for brand experiments | Use the idea to make the WillCrafty mark feel more liquid and premium. Keep implementation as plain SVG/CSS. |
| liquid-glass-js | High concept fit | Adopt the glass surface language with CSS first. Consider the JS library later for a richer dashboard. |
| shadergradient | Medium for hero drama, low for current architecture | Defer. It requires React, Three, and peer dependencies, which is too heavy for this static privacy-first flow. |
| react-three-fiber | Low for current production app | Defer until WillCrafty becomes a React SaaS. Useful later for a high-end interactive brand system or explainer, not for the will form. |
| Motion | Already used | Keep Motion for lightweight entrance and product-story movement; avoid hiding content behind animation. |
| Playwright / axe / Lighthouse CI | High for future QA | Add when this repo moves to npm-managed website QA. For now use local CDP screenshots plus existing Node tests. |
| Lenis / Tempus | Low for current static app | Defer smooth-scroll orchestration; legal-adjacent flows need deterministic anchors more than cinematic scrolling. |
| Floating UI / Embla / Storybook / Ladle | Low until componentized | Useful after a React or component-system migration, not for this plain HTML form. |
| Radix Colors | Medium as reference | Use as a contrast and token-quality reference while preserving Tiffany Blue as the brand anchor. |

## Brand System

- Primary color: Tiffany Blue `#0ABAB5`.
- Supporting colors: Deep Ink `#102126`, Soft Mint `#D9FBF8`, Signal Coral `#FF7A59`, warm paper accents.
- Logo: document, folded corner, checkmark, and flowing signature line.
- Surface style: frosted glass panels with crisp borders, subtle highlights, and restrained shadows.
- Motion: quiet, useful, short. Logo shimmer and section reveals are acceptable. Form transitions must stay calm.

## Guardrails

- No package install for visual polish.
- No server-side storage changes for design.
- Keep text legible on mobile.
- Keep legal-adjacent flows calm, not gimmicky.

## Layout Pattern

- Use a compact pathway band after the hero to explain the execution journey before asking users to start.
- Keep the create workspace dense and operational: progress rail, prep note, short trust metrics, then the form.
- Use glass only for surfaces that contain actionable information. Avoid decorative glass blocks that do not advance the will-making task.
