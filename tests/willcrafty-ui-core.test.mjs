import test from "node:test";
import assert from "node:assert/strict";

import {
  getPlanRecommendationMessage,
  renderNotificationList,
  renderPlanRecommendation,
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
    this.type = "";
    this.checked = false;
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
}

class FakeTextNode {
  constructor(text) {
    this.textContent = String(text);
  }
}
