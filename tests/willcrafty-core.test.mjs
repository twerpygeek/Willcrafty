import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWillDocument,
  createNotificationDraft,
  generateFileName,
  validateWill,
} from "../willcrafty-core.mjs";

const completeWill = {
  testator: {
    fullName: "Maya Tan",
    address: "21 Marina View, Singapore",
    dateOfBirth: "1988-04-12",
    jurisdiction: "Singapore",
  },
  executor: {
    fullName: "Avery Lim",
    email: "avery@example.com",
    relationship: "Sibling",
  },
  beneficiaries: [
    {
      fullName: "Jon Tan",
      relationship: "Spouse",
      email: "jon@example.com",
      share: 60,
    },
    {
      fullName: "Lina Tan",
      relationship: "Child",
      email: "lina@example.com",
      share: 40,
    },
  ],
  assets: [
    {
      name: "Primary residence",
      description: "Apartment and household contents",
      recipient: "Jon Tan",
      share: 100,
    },
  ],
  guardians: [
    {
      fullName: "Sofia Lee",
      relationship: "Aunt",
      note: "Preferred guardian for minor children.",
    },
  ],
  wishes: "I ask that my family keeps the memorial simple and private.",
};

test("validateWill accepts a complete will with distributions totaling 100%", () => {
  const result = validateWill(completeWill);

  assert.deepEqual(result.errors, []);
  assert.equal(result.isValid, true);
});

test("validateWill flags missing identity and uneven beneficiary shares", () => {
  const result = validateWill({
    ...completeWill,
    testator: { ...completeWill.testator, fullName: "" },
    beneficiaries: [
      { ...completeWill.beneficiaries[0], share: 30 },
      { ...completeWill.beneficiaries[1], share: 40 },
    ],
  });

  assert.equal(result.isValid, false);
  assert.match(result.errors.join("\n"), /full legal name/i);
  assert.match(result.errors.join("\n"), /add up to 100%/i);
});

test("buildWillDocument includes core sections and jurisdiction-aware disclaimer", () => {
  const document = buildWillDocument(completeWill);

  assert.match(document, /LAST WILL AND TESTAMENT OF MAYA TAN/);
  assert.match(document, /Executor Appointment/);
  assert.match(document, /Beneficiaries and Distributions/);
  assert.match(document, /Singapore signing and witness requirements/);
  assert.match(document, /two competent adult witnesses/i);
});

test("createNotificationDraft creates beneficiary acknowledgement copy", () => {
  const draft = createNotificationDraft(completeWill, completeWill.beneficiaries[0]);

  assert.equal(draft.to, "jon@example.com");
  assert.match(draft.subject, /Maya Tan/);
  assert.match(draft.body, /acknowledge receipt/i);
  assert.match(draft.body, /WillCrafty/);
});

test("generateFileName produces a safe dated filename", () => {
  assert.equal(
    generateFileName("Maya Tan", "pdf", new Date("2026-05-12T10:00:00Z")),
    "willcrafty-maya-tan-2026-05-12.pdf",
  );
});
