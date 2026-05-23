import test from "node:test";
import assert from "node:assert/strict";

import {
  getAnsweredAgentAnswerState,
  getPendingAgentAnswerState,
  getSetupAgentAnswerState,
  renderAgentAnswer,
} from "../agent-ui-core.mjs";

test("agent answer states keep plain text copy for pending and setup flows", () => {
  assert.deepEqual(getPendingAgentAnswerState(), {
    heading: "Working on it",
    body: "Routing your question through the configured AI endpoint.",
    routedVia: "",
  });

  assert.deepEqual(getSetupAgentAnswerState(), {
    heading: "Setup needed",
    body: "Add FREELLMAPI_BASE_URL and FREELLMAPI_API_KEY in your deployment environment, then connect them to a running FreeLLMAPI proxy.",
    routedVia: "",
  });
});

test("renderAgentAnswer builds structured nodes without HTML string injection", () => {
  const container = new FakeElement("div");
  const document = new FakeDocument();

  renderAgentAnswer(
    document,
    container,
    getAnsweredAgentAnswerState({
      answer: "<script>alert(1)</script> Print first.",
      routedVia: "proxy<unsafe>",
    }),
  );

  assert.equal(container.children.length, 3);
  assert.equal(container.children[0].tagName, "STRONG");
  assert.equal(container.children[0].textContent, "WillCrafty AI");
  assert.equal(container.children[1].tagName, "SPAN");
  assert.equal(container.children[1].textContent, "Routed via proxy<unsafe>");
  assert.equal(container.children[2].tagName, "P");
  assert.equal(container.children[2].textContent, "<script>alert(1)</script> Print first.");
  assert.equal(container.innerHTML, "");
});

class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.textContent = "";
    this.innerHTML = "";
  }

  replaceChildren(...nodes) {
    this.children = nodes;
    this.textContent = nodes.map((node) => node.textContent).join("");
    this.innerHTML = "";
  }
}
