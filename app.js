import {
  buildWillDocument,
  createNotificationDraft,
  generateFileName,
  toWordHtml,
  validateWill,
} from "./willcrafty-core.mjs";

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
const acknowledged = new Set();

let currentStep = 0;

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
bindEvents();
showStep(0);
updateComputedPanels();
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
