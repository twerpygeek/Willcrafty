import {
  buildWillDocument,
  createNotificationDraft,
  generateFileName,
  toWordHtml,
  validateWill,
} from "./willcrafty-core.mjs";
import {
  getOnboardingScene,
  getOnboardingTimeline,
} from "./onboarding-core.mjs";
import {
  createPlanLeadDraft,
  formatPrice,
  getPlanById,
  getRecommendedPlan,
  pricingPlans,
} from "./monetization-core.mjs";

let motion = {};
try {
  motion = await import("https://cdn.jsdelivr.net/npm/motion@12.37.0/+esm");
} catch {
  motion = {};
}

const { animate, inView, stagger } = motion;

const form = document.querySelector("#willForm");
const steps = [...document.querySelectorAll(".form-step")];
const stepButtons = [...document.querySelectorAll("[data-step-target]")];
const completionScore = document.querySelector("#completionScore");
const ringFill = document.querySelector(".ring-fill");
const preview = document.querySelector("#willPreview");
const validationPanel = document.querySelector("#validationPanel");
const notificationList = document.querySelector("#notificationList");
const printDocument = document.querySelector("#printDocument");
const notifyDialog = document.querySelector("#notifyDialog");
const notifyTo = document.querySelector("#notifyTo");
const notifySubject = document.querySelector("#notifySubject");
const notifyBody = document.querySelector("#notifyBody");
const mailtoLink = document.querySelector("#mailtoLink");
const planDialog = document.querySelector("#planDialog");
const planDialogTitle = document.querySelector("#planDialogTitle");
const planDialogSummary = document.querySelector("#planDialogSummary");
const planLeadName = document.querySelector("#planLeadName");
const planLeadEmail = document.querySelector("#planLeadEmail");
const planLeadNotes = document.querySelector("#planLeadNotes");
const planMailtoLink = document.querySelector("#planMailtoLink");
const acknowledged = new Set();
const onboarding = {
  index: 0,
  paused: false,
  timer: null,
  secondsPerScene: 4,
};

let currentStep = 0;
let selectedPlan = getPlanById("free");

const repeaterConfig = {
  beneficiaries: {
    label: "Beneficiary",
    rows: [
      ["fullName", "Full legal name", "Jon Tan", "text"],
      ["relationship", "Relationship", "Spouse", "text"],
      ["email", "Email for notification", "jon@example.com", "email"],
      ["share", "Estate share (%)", "60", "number"],
    ],
    empty: { fullName: "", relationship: "", email: "", share: "" },
  },
  assets: {
    label: "Asset",
    rows: [
      ["name", "Asset or gift", "Primary residence", "text"],
      ["description", "Description", "Apartment and household contents", "text"],
      ["recipient", "Recipient", "Jon Tan", "text"],
      ["share", "Share (%)", "100", "number"],
    ],
    empty: { name: "", description: "", recipient: "", share: "100" },
  },
  guardians: {
    label: "Guardian",
    rows: [
      ["fullName", "Full legal name", "Sofia Lee", "text"],
      ["relationship", "Relationship", "Aunt", "text"],
      ["note", "Care note", "Preferred guardian for minor children.", "text"],
    ],
    empty: { fullName: "", relationship: "", note: "" },
  },
};

const starterWill = {
  beneficiaries: [
    { fullName: "", relationship: "", email: "", share: "" },
  ],
  assets: [
    { name: "", description: "", recipient: "", share: "100" },
  ],
  guardians: [],
};

renderRepeaters(starterWill);
renderPricing();
bindEvents();
showStep(0);
updateComputedPanels();
initOnboarding();
runAnimations();

function bindEvents() {
  document.querySelector(".nav-toggle").addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => document.body.classList.remove("nav-open"));
  });

  form.addEventListener("input", updateComputedPanels);
  form.addEventListener("change", updateComputedPanels);

  document.querySelector("#prevStep").addEventListener("click", () => {
    showStep(Math.max(0, currentStep - 1));
  });

  document.querySelector("#nextStep").addEventListener("click", () => {
    if (currentStep === steps.length - 1) {
      document.querySelector("#downloadPdf").focus();
      return;
    }
    showStep(Math.min(steps.length - 1, currentStep + 1));
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => showStep(Number(button.dataset.stepTarget)));
  });

  document.querySelector("#addBeneficiary").addEventListener("click", () => addRepeaterRow("beneficiaries"));
  document.querySelector("#addAsset").addEventListener("click", () => addRepeaterRow("assets"));
  document.querySelector("#addGuardian").addEventListener("click", () => addRepeaterRow("guardians"));

  document.querySelector("#downloadText").addEventListener("click", () => downloadWill("txt"));
  document.querySelector("#downloadWord").addEventListener("click", () => downloadWill("doc"));
  document.querySelector("#downloadPdf").addEventListener("click", printWill);

  document.querySelector("#onboardingReplay").addEventListener("click", () => {
    onboarding.paused = false;
    document.querySelector("#onboardingToggle").textContent = "Pause";
    showOnboardingScene(0);
    scheduleOnboarding();
  });

  document.querySelector("#onboardingToggle").addEventListener("click", () => {
    onboarding.paused = !onboarding.paused;
    document.querySelector("#onboardingToggle").textContent = onboarding.paused ? "Play" : "Pause";
    if (onboarding.paused) clearTimeout(onboarding.timer);
    else scheduleOnboarding();
  });

  document.querySelector("#sceneDots").addEventListener("click", (event) => {
    const dot = event.target.closest("[data-scene-index]");
    if (!dot) return;
    showOnboardingScene(Number(dot.dataset.sceneIndex));
    scheduleOnboarding();
  });

  document.querySelector("#pricingGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-plan-id]");
    if (!button) return;
    openPlanDialog(button.dataset.planId);
  });

  document.querySelector("#planRecommendation").addEventListener("click", (event) => {
    const button = event.target.closest("[data-plan-id]");
    if (!button) return;
    openPlanDialog(button.dataset.planId);
  });

  [planLeadName, planLeadEmail, planLeadNotes].forEach((field) => {
    field.addEventListener("input", updatePlanMailto);
  });

  notificationList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-notify-index]");
    if (!button) return;

    const index = Number(button.dataset.notifyIndex);
    const will = readWill();
    const beneficiary = will.beneficiaries[index];
    const draft = createNotificationDraft(will, beneficiary);
    openNotificationDraft(draft);
  });

  notificationList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-ack-index]");
    if (!checkbox) return;

    if (checkbox.checked) acknowledged.add(checkbox.dataset.ackIndex);
    else acknowledged.delete(checkbox.dataset.ackIndex);
  });
}

function renderPricing() {
  document.querySelector("#pricingGrid").innerHTML = pricingPlans
    .map((plan) => {
      const features = plan.features.map((feature) => `<li>${feature}</li>`).join("");
      const badge = plan.highlighted ? `<span class="plan-badge">Recommended</span>` : "";

      return `<article class="pricing-card ${plan.highlighted ? "highlighted" : ""}">
        <div class="pricing-card-head">
          <div>
            <h3>${plan.name}</h3>
            <p>${plan.tagline}</p>
          </div>
          ${badge}
        </div>
        <div class="plan-price">
          <strong>${formatPrice(plan)}</strong>
          <span>${plan.cadence}</span>
        </div>
        <p class="best-for">${plan.bestFor}</p>
        <ul>${features}</ul>
        <p class="plan-caveat">${plan.caveat}</p>
        <button class="button ${plan.highlighted ? "primary" : "secondary"}" type="button" data-plan-id="${plan.id}">
          ${plan.cta}
        </button>
      </article>`;
    })
    .join("");
}

function initOnboarding() {
  const dots = document.querySelector("#sceneDots");
  const timeline = getOnboardingTimeline(onboarding.secondsPerScene);
  dots.innerHTML = timeline.scenes
    .map((scene, index) => {
      return `<button type="button" data-scene-index="${index}" aria-label="${scene.title}"></button>`;
    })
    .join("");

  showOnboardingScene(0);
  scheduleOnboarding();
}

function showOnboardingScene(index) {
  onboarding.index = index;
  const scene = getOnboardingScene(index);
  const stage = document.querySelector(".onboarding-stage");
  const visual = document.querySelector("#motionVisual");

  document.querySelector("#sceneKicker").textContent = scene.eyebrow;
  document.querySelector("#sceneTitle").textContent = scene.title;
  document.querySelector("#sceneCopy").textContent = scene.copy;
  document.querySelector("#sceneMetric").textContent = scene.metric;
  stage.dataset.scene = scene.id;
  visual.style.setProperty("--scene-accent", scene.accent);

  document.querySelectorAll("[data-scene-index]").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });

  if (animate) {
    animate(".motion-frame > *", { opacity: [0, 1], y: [18, 0] }, { duration: 0.48, delay: stagger(0.06) });
    animate(".animated-device", { opacity: [0.4, 1], y: [28, 0], rotate: [-3, 0] }, { duration: 0.62 });
    animate(".animated-document", { opacity: [0, 1], x: [36, 0], rotate: [5, 0] }, { duration: 0.62, delay: 0.1 });
  }
}

function scheduleOnboarding() {
  clearTimeout(onboarding.timer);
  if (onboarding.paused) return;

  onboarding.timer = setTimeout(() => {
    showOnboardingScene(onboarding.index + 1);
    scheduleOnboarding();
  }, onboarding.secondsPerScene * 1000);
}

function showStep(nextStep) {
  currentStep = nextStep;

  steps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  stepButtons.forEach((button, index) => {
    button.classList.toggle("active", index === currentStep);
  });

  document.querySelector("#prevStep").disabled = currentStep === 0;
  document.querySelector("#nextStep").textContent = currentStep === steps.length - 1 ? "Review ready" : "Continue";

  if (animate) {
    animate(steps[currentStep], { opacity: [0, 1], y: [12, 0] }, { duration: 0.34, ease: "easeOut" });
  }

  updateComputedPanels();
}

function addRepeaterRow(type) {
  const will = readWill();
  will[type].push({ ...repeaterConfig[type].empty });
  renderRepeaters(will);
  updateComputedPanels();
}

function removeRepeaterRow(type, index) {
  const will = readWill();
  will[type].splice(index, 1);
  renderRepeaters(will);
  updateComputedPanels();
}

function renderRepeaters(will) {
  for (const type of Object.keys(repeaterConfig)) {
    const container = document.querySelector(`#${type}`);
    const rows = will[type] || [];
    const config = repeaterConfig[type];

    container.innerHTML = rows
      .map((row, rowIndex) => renderRepeaterCard(type, row, rowIndex, config))
      .join("");

    container.querySelectorAll("[data-remove-row]").forEach((button) => {
      button.addEventListener("click", () => {
        removeRepeaterRow(type, Number(button.dataset.removeRow));
      });
    });
  }
}

function renderRepeaterCard(type, row, rowIndex, config) {
  const fields = config.rows
    .map(([key, label, placeholder, inputType]) => {
      const value = escapeAttribute(row[key] ?? "");
      const typeAttribute =
        inputType === "number"
          ? 'type="text" inputmode="decimal" pattern="[0-9]*"'
          : inputType === "email"
            ? 'type="text" inputmode="email"'
            : `type="${inputType}"`;

      return `<label>
        ${label}
        <input name="${type}.${rowIndex}.${key}" ${typeAttribute} placeholder="${placeholder}" value="${value}">
      </label>`;
    })
    .join("");

  return `<article class="repeat-card">
    <div class="repeat-card-header">
      <strong>${config.label} ${rowIndex + 1}</strong>
      <button class="remove-row" type="button" data-remove-row="${rowIndex}">Remove</button>
    </div>
    <div class="field-grid">${fields}</div>
  </article>`;
}

function readWill() {
  const data = new FormData(form);
  const will = {
    testator: {},
    executor: {},
    beneficiaries: [],
    assets: [],
    guardians: [],
    wishes: data.get("wishes") || "",
  };

  for (const [name, value] of data.entries()) {
    const parts = name.split(".");
    if (parts.length === 2) {
      will[parts[0]][parts[1]] = value;
    }

    if (parts.length === 3) {
      const [collection, index, key] = parts;
      will[collection][Number(index)] ||= {};
      will[collection][Number(index)][key] = value;
    }
  }

  return will;
}

function updateComputedPanels() {
  const will = readWill();
  const result = validateWill(will);
  const documentText = buildWillDocument(will);

  preview.textContent = documentText;
  renderValidation(result);
  renderPlanRecommendation(will);
  renderNotifications(will);
  updateCompletion(will, result);
}

function renderValidation(result) {
  if (result.isValid) {
    validationPanel.innerHTML = `<p class="valid">Your draft has the required sections. Review carefully before signing.</p>`;
    return;
  }

  validationPanel.innerHTML = `<ul>${result.errors.map((error) => `<li>${error}</li>`).join("")}</ul>`;
}

function renderPlanRecommendation(will) {
  const recommendation = getRecommendedPlan({
    hasSpouseWill: will.beneficiaries.some((beneficiary) => /spouse|wife|husband|partner/i.test(beneficiary.relationship || "")),
    beneficiaries: will.beneficiaries.filter((beneficiary) => beneficiary.fullName).length,
    hasMinorChildren:
      will.guardians.some((guardian) => guardian.fullName) ||
      /minor|child|children|guardian/i.test(will.wishes || ""),
    hasSpecificAssets: will.assets.some((asset) => asset.name),
  });

  const message =
    recommendation.id === "free"
      ? "Your draft looks suitable for the free self-help path. Upgrade only if you want a cleaner signing pack or review."
      : `Recommended next step: ${recommendation.name} for ${formatPrice(recommendation)} ${recommendation.cadence}.`;

  document.querySelector("#planRecommendation").innerHTML = `<div>
    <strong>${message}</strong>
    <p>${recommendation.bestFor}</p>
    <button class="button small" type="button" data-plan-id="${recommendation.id}">${recommendation.cta}</button>
  </div>`;
}

function renderNotifications(will) {
  const beneficiaries = will.beneficiaries.filter((beneficiary) => beneficiary.fullName || beneficiary.email);

  if (beneficiaries.length === 0) {
    notificationList.innerHTML = `<p class="muted">Add beneficiaries to prepare notification drafts.</p>`;
    return;
  }

  notificationList.innerHTML = `<div class="notify-list">
    ${beneficiaries
      .map((beneficiary, index) => {
        const email = beneficiary.email || "No email yet";
        const checked = acknowledged.has(String(index)) ? "checked" : "";
        return `<div class="notify-row">
          <div>
            <strong>${escapeHtml(beneficiary.fullName || `Beneficiary ${index + 1}`)}</strong><br>
            <span>${escapeHtml(email)}</span>
          </div>
          <label>
            <input data-ack-index="${index}" type="checkbox" ${checked}>
            Acknowledged
          </label>
          <button class="button small" type="button" data-notify-index="${index}">Prepare email</button>
        </div>`;
      })
      .join("")}
  </div>`;
}

function updateCompletion(will, validationResult) {
  const checks = [
    will.testator.fullName,
    will.testator.address,
    will.testator.dateOfBirth,
    will.testator.jurisdiction,
    will.executor.fullName,
    will.executor.relationship,
    will.executor.email,
    will.beneficiaries.some((beneficiary) => beneficiary.fullName),
    will.beneficiaries.some((beneficiary) => beneficiary.relationship),
    will.beneficiaries.some((beneficiary) => Number(beneficiary.share) > 0),
    will.assets.some((asset) => asset.name),
    will.assets.some((asset) => asset.recipient),
    will.wishes,
    validationResult.isValid,
  ];

  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  completionScore.textContent = `${percent}%`;
  ringFill.style.strokeDashoffset = String(302 - 302 * (percent / 100));
}

function downloadWill(format) {
  const will = readWill();
  const result = validateWill(will);
  if (!result.isValid) {
    showStep(5);
    return;
  }

  const documentText = buildWillDocument(will);
  const name = will.testator.fullName || "my-will";
  const blob =
    format === "doc"
      ? new Blob([toWordHtml(documentText)], { type: "application/msword" })
      : new Blob([documentText], { type: "text/plain;charset=utf-8" });
  const extension = format === "doc" ? "doc" : "txt";

  saveBlob(blob, generateFileName(name, extension));
}

function printWill() {
  const will = readWill();
  const result = validateWill(will);
  showStep(5);

  if (!result.isValid) return;

  printDocument.textContent = buildWillDocument(will);
  window.print();
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openNotificationDraft(draft) {
  notifyTo.textContent = `To: ${draft.to || "Add an email address first"}`;
  notifySubject.textContent = draft.subject;
  notifyBody.value = draft.body;
  mailtoLink.href = createMailto(draft);
  notifyDialog.showModal();
}

function openPlanDialog(planId) {
  const will = readWill();
  selectedPlan = getPlanById(planId);
  planDialogTitle.textContent = selectedPlan.name;
  planDialogSummary.textContent = `${formatPrice(selectedPlan)} ${selectedPlan.cadence} · ${selectedPlan.tagline}`;
  planLeadName.value = will.testator.fullName || "";
  planLeadEmail.value = will.executor.email || "";
  planLeadNotes.value = buildPlanNotes(will, selectedPlan);
  updatePlanMailto();
  planDialog.showModal();
}

function updatePlanMailto() {
  const draft = createPlanLeadDraft(selectedPlan, {
    fullName: planLeadName.value,
    email: planLeadEmail.value,
    notes: planLeadNotes.value,
  });
  planMailtoLink.href = draft.mailto;
}

function buildPlanNotes(will, plan) {
  const beneficiaryCount = will.beneficiaries.filter((beneficiary) => beneficiary.fullName).length;
  const assetCount = will.assets.filter((asset) => asset.name).length;
  const guardianCount = will.guardians.filter((guardian) => guardian.fullName).length;

  return [
    `I am interested in ${plan.name}.`,
    `Beneficiaries listed: ${beneficiaryCount}`,
    `Specific assets listed: ${assetCount}`,
    `Guardians listed: ${guardianCount}`,
    `Jurisdiction: ${will.testator.jurisdiction || "Not selected"}`,
  ].join("\n");
}

function createMailto(draft) {
  const query = new URLSearchParams({
    subject: draft.subject,
    body: draft.body,
  });
  return `mailto:${encodeURIComponent(draft.to || "")}?${query.toString()}`;
}

function runAnimations() {
  if (!animate) return;

  animate(
    ".floating-card",
    { y: [0, -12, 0], rotate: [-1, 0.5, -1] },
    { duration: 6, repeat: Infinity, ease: "easeInOut", delay: stagger(0.28) },
  );

  animate(
    ".lock-orbit",
    { rotate: 360 },
    { duration: 9, repeat: Infinity, ease: "linear" },
  );

  document.querySelectorAll("[data-animate]").forEach((section) => {
    inView(
      section,
      () => {
        animate(section, { opacity: 1, y: 0 }, { duration: 0.65, ease: [0.16, 1, 0.3, 1] });
      },
      { margin: "0px 0px -12% 0px" },
    );
  });
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
