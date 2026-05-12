# WillCrafty Onboarding Animation

This folder contains two ways to produce the animated onboarding explainer.

## HyperFrames

HyperFrames is the easiest path for HTML-to-video rendering.

```bash
cd video/hyperframes
npx hyperframes preview
npx hyperframes render --output willcrafty-onboarding.mp4
```

The composition is `video/hyperframes/index.html`. It follows the HyperFrames pattern of a root element with `data-composition-id`, `data-width`, and `data-height`, plus a paused GSAP timeline registered on `window.__timelines`.

## Remotion

Remotion is the React video source. It is intentionally isolated from the static website so the deploy stays simple.

```bash
cd video/remotion
npm install
npm run studio
npm run render
```

The Remotion composition is registered as `WillCraftyOnboarding` at `1920x1080`, `30fps`, `480` frames.

## Story

1. Answer simple questions
2. Name people who matter
3. Preview a clear will draft
4. Download privately

The visual storyboard image was generated with ChatGPT Images and saved as `assets/willcrafty-onboarding-storyboard.png`.
