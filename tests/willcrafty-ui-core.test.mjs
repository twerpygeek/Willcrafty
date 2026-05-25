import test from "node:test";
import assert from "node:assert/strict";

import {
  getPlanRecommendationMessage,
  renderNotificationList,
  renderPlanRecommendation,
  renderPricingGrid,
  renderRepeaterCards,
  renderSceneDots,
  renderValidationPanel,
} from "../willcrafty-ui-core.mjs";

test("renderValidationPanel builds a valid-state paragraph without HTML strings", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderValidationPanel(document, container, { isValid: true, errors: [] });

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].tagName, "P");
  assert.equal(container.children[0].className, "valid");
  assert.equal(container.children[0].textContent, "Your draft has the required sections. Review carefully before signing.");
  assert.equal(container.innerHTML, "");
});

test("renderValidationPanel lists each validation error as text", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderValidationPanel(document, container, {
    isValid: false,
    errors: ["Missing executor name.", "<script>alert(1)</script>"],
  });

  assert.equal(container.children[0].tagName, "UL");
  assert.equal(container.children[0].children[1].textContent, "<script>alert(1)</script>");
  assert.equal(container.innerHTML, "");
});

test("renderPlanRecommendation builds structured recommendation content", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderPlanRecommendation(document, container, {
    id: "review",
    name: "Expert Review",
    priceLabel: "RM499",
    cadence: "from",
    bestFor: "Property and minor children",
    cta: "Request review",
  });

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].children[0].textContent, getPlanRecommendationMessage({
    id: "review",
    name: "Expert Review",
    priceLabel: "RM499",
    cadence: "from",
  }));
  assert.equal(container.children[0].children[2].dataset.planId, "review");
  assert.equal(container.innerHTML, "");
});

test("renderNotificationList keeps beneficiary content as text nodes", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderNotificationList(
    document,
    container,
    [
      {
        fullName: "<img src=x onerror=alert(1)>",
        email: "unsafe@example.com<script>",
      },
    ],
    new Set(["0"]),
  );

  const list = container.children[0];
  const row = list.children[0];
  const summary = row.children[0];
  const label = row.children[1];
  const button = row.children[2];

  assert.equal(list.className, "notify-list");
  assert.equal(summary.children[0].textContent, "<img src=x onerror=alert(1)>");
  assert.equal(summary.children[2].textContent, "unsafe@example.com<script>");
  assert.equal(label.children[0].checked, true);
  assert.equal(button.dataset.notifyIndex, "0");
  assert.equal(container.innerHTML, "");
});

test("renderPricingGrid builds pricing cards without HTML string injection", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderPricingGrid(
    document,
    container,
    [
      {
        id: "review",
        name: "<Expert Review>",
        tagline: "Human support",
        highlighted: true,
        cadence: "from",
        bestFor: "Property and children",
        features: ["Checklist", "<script>alert(1)</script>"],
        caveat: "Not legal advice.",
        cta: "Request review",
      },
    ],
    () => "RM499",
  );

  const card = container.children[0];
  assert.equal(card.className, "pricing-card highlighted");
  assert.equal(card.children[0].children[0].children[0].textContent, "<Expert Review>");
  assert.equal(card.children[0].children[1].textContent, "Recommended");
  assert.equal(card.children[3].children[1].textContent, "<script>alert(1)</script>");
  assert.equal(card.children[5].dataset.planId, "review");
  assert.equal(container.innerHTML, "");
});

test("renderSceneDots keeps scene labels in button attributes", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderSceneDots(document, container, [
    { title: "Private setup" },
    { title: "Review and sign" },
  ]);

  assert.equal(container.children.length, 2);
  assert.equal(container.children[0].dataset.sceneIndex, "0");
  assert.equal(container.children[0].attributes["aria-label"], "Private setup");
  assert.equal(container.innerHTML, "");
});

test("renderRepeaterCards keeps row values in input properties", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderRepeaterCards(
    document,
    container,
    "beneficiaries",
    [
      {
        fullName: "<img src=x onerror=alert(1)>",
        relationship: "Sibling",
        email: "unsafe@example.com<script>",
        share: "60",
      },
    ],
    {
      label: "Beneficiary",
      rows: [
        ["fullName", "Full legal name", "Jon Tan", "text"],
        ["relationship", "Relationship", "Sibling", "text"],
        ["email", "Email for notification", "jon@example.com", "email"],
        ["share", "Estate share (%)", "60", "number"],
      ],
    },
  );

  const card = container.children[0];
  const fieldGrid = card.children[1];
  const fullNameInput = fieldGrid.children[0].children[2];
  const emailInput = fieldGrid.children[2].children[2];
  const shareInput = fieldGrid.children[3].children[2];

  assert.equal(card.children[0].children[1].dataset.removeRow, "0");
  assert.equal(fullNameInput.value, "<img src=x onerror=alert(1)>");
  assert.equal(emailInput.value, "unsafe@example.com<script>");
  assert.equal(emailInput.inputMode, "email");
  assert.equal(shareInput.pattern, "[0-9]*");
  assert.equal(container.innerHTML, "");
});

class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createTextNode(text) {
    return new FakeTextNode(text);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.textContent = "";
    this.innerHTML = "";
    this.className = "";
    this.dataset = {};
    this.attributes = {};
    this.type = "";
    this.checked = false;
    this.placeholder = "";
    this.value = "";
    this.inputMode = "";
    this.pattern = "";
  }

  append(...nodes) {
    this.children.push(...nodes);
    this.textContent = this.children.map((node) => node.textContent).join("");
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
    this.innerHTML = "";
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

class FakeTextNode {
  constructor(text) {
    this.textContent = String(text);
  }
}
