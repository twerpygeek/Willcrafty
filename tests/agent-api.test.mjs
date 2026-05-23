import test from "node:test";
import assert from "node:assert/strict";

const agentModule = await import("../api/agent.js");
const agent = agentModule.default;

test("normalizeLlmBaseUrl appends the OpenAI-compatible v1 path", () => {
  assert.equal(agent.normalizeLlmBaseUrl("http://localhost:3001"), "http://localhost:3001/v1");
  assert.equal(agent.normalizeLlmBaseUrl("http://localhost:3001/v1"), "http://localhost:3001/v1");
  assert.equal(agent.getChatCompletionUrl("http://localhost:3001"), "http://localhost:3001/v1/chat/completions");
});

test("getAgentConfig accepts current and legacy environment variable names", () => {
  assert.deepEqual(
    agent.getAgentConfig({
      FREELLMAPI_BASE_URL: "https://proxy.example/v1",
      FREELLMAPI_API_KEY: "current-key",
      FREE_LLM_API_BASE_URL: "https://legacy.example/v1",
      FREE_LLM_API_KEY: "legacy-key",
    }),
    {
      baseUrl: "https://proxy.example/v1",
      apiKey: "current-key",
    },
  );

  assert.deepEqual(
    agent.getAgentConfig({
      FREE_LLM_API_BASE_URL: "https://legacy.example/v1",
      FREE_LLM_API_KEY: "legacy-key",
    }),
    {
      baseUrl: "https://legacy.example/v1",
      apiKey: "legacy-key",
    },
  );
});

test("buildAgentPayload constrains the assistant to general self-help answers", () => {
  const payload = agent.buildAgentPayload({
    question: "Can witnesses be beneficiaries?",
    model: "auto",
  });

  assert.equal(payload.model, "auto");
  assert.match(payload.messages[0].content, /not provide jurisdiction-specific legal advice/i);
  assert.match(payload.messages[0].content, /qualified local professional/i);
  assert.equal(payload.messages[1].role, "user");
  assert.match(payload.messages[1].content, /Can witnesses be beneficiaries/);
});

test("extractAssistantText supports string and array content", () => {
  assert.equal(
    agent.extractAssistantText({
      choices: [{ message: { content: "Print and sign with witnesses." } }],
    }),
    "Print and sign with witnesses.",
  );
  assert.equal(
    agent.extractAssistantText({
      choices: [{ message: { content: [{ text: "Print " }, { text: "first." }] } }],
    }),
    "Print first.",
  );
});

test("isAllowedOrigin rejects cross-origin agent calls", () => {
  assert.equal(
    agent.isAllowedOrigin({
      origin: "https://willcrafty.vercel.app",
      host: "willcrafty.vercel.app",
    }),
    true,
  );
  assert.equal(
    agent.isAllowedOrigin({
      origin: "https://evil.example",
      host: "willcrafty.vercel.app",
    }),
    false,
  );
});
