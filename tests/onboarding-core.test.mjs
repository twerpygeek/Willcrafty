import test from "node:test";
import assert from "node:assert/strict";

import {
  getOnboardingScene,
  getOnboardingTimeline,
  onboardingScenes,
} from "../onboarding-core.mjs";

test("onboardingScenes defines the four product explanation beats", () => {
  assert.equal(onboardingScenes.length, 4);
  assert.deepEqual(
    onboardingScenes.map((scene) => scene.id),
    ["questions", "people", "preview", "download"],
  );
});

test("getOnboardingTimeline returns sequential scene timing", () => {
  const timeline = getOnboardingTimeline(4);

  assert.equal(timeline.durationSeconds, 16);
  assert.deepEqual(
    timeline.scenes.map(({ id, start, end }) => ({ id, start, end })),
    [
      { id: "questions", start: 0, end: 4 },
      { id: "people", start: 4, end: 8 },
      { id: "preview", start: 8, end: 12 },
      { id: "download", start: 12, end: 16 },
    ],
  );
});

test("getOnboardingScene wraps indexes for looping playback", () => {
  assert.equal(getOnboardingScene(-1).id, "download");
  assert.equal(getOnboardingScene(4).id, "questions");
});
