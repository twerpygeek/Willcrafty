export const onboardingScenes = [
  {
    id: "questions",
    eyebrow: "Step 1",
    title: "Answer simple questions",
    copy: "WillCrafty turns estate planning into calm, guided prompts for your identity, jurisdiction, and executor.",
    metric: "04 min",
    visual: "guided-form",
    accent: "#0ABAB5",
  },
  {
    id: "people",
    eyebrow: "Step 2",
    title: "Name people who matter",
    copy: "Add beneficiaries, guardians, and trusted contacts so your wishes are easy to understand later.",
    metric: "100%",
    visual: "beneficiary-web",
    accent: "#12A878",
  },
  {
    id: "preview",
    eyebrow: "Step 3",
    title: "Preview a clear will draft",
    copy: "Watch the document assemble with executor details, asset distributions, personal wishes, and signing reminders.",
    metric: "Ready",
    visual: "document-preview",
    accent: "#FF7A59",
  },
  {
    id: "download",
    eyebrow: "Step 4",
    title: "Download privately",
    copy: "Export PDF, Word, or plain text. No account required and no will data stored on WillCrafty servers.",
    metric: "0 data",
    visual: "secure-export",
    accent: "#102126",
  },
];

export function getOnboardingTimeline(secondsPerScene = 4) {
  const scenes = onboardingScenes.map((scene, index) => ({
    ...scene,
    start: index * secondsPerScene,
    end: (index + 1) * secondsPerScene,
  }));

  return {
    durationSeconds: scenes.length * secondsPerScene,
    scenes,
  };
}

export function getOnboardingScene(index) {
  const wrappedIndex = ((index % onboardingScenes.length) + onboardingScenes.length) % onboardingScenes.length;
  return onboardingScenes[wrappedIndex];
}
