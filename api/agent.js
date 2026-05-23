const DEFAULT_MODEL = "auto";
const MAX_QUESTION_LENGTH = 1600;

function buildAgentPayload({ question, context = "", model = DEFAULT_MODEL }) {
  const safeQuestion = clean(question).slice(0, MAX_QUESTION_LENGTH);
  const safeContext = clean(context).slice(0, 1200);

  return {
    model: clean(model) || DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "You are WillCrafty AI, a concise self-help assistant for a will-drafting web app.",
          "Answer general estate-planning and product questions in plain English.",
          "Do not claim to be a lawyer and do not provide jurisdiction-specific legal advice.",
          "If the user asks legal, tax, Muslim inheritance, Faraid, CPF, EPF, custody, probate, or signing-validity questions, explain the general issue and recommend checking a qualified local professional.",
          "Keep answers practical, calm, and under 180 words.",
        ].join(" "),
      },
      {
        role: "user",
        content: safeContext ? `Context:\n${safeContext}\n\nQuestion:\n${safeQuestion}` : safeQuestion,
      },
    ],
    temperature: 0.35,
    max_tokens: 420,
  };
}

function normalizeLlmBaseUrl(value) {
  const raw = clean(value).replace(/\/+$/, "");
  if (!raw) return "";
  return raw.endsWith("/v1") ? raw : `${raw}/v1`;
}

function getChatCompletionUrl(baseUrl) {
  return `${normalizeLlmBaseUrl(baseUrl)}/chat/completions`;
}

function getAgentConfig(env = {}) {
  return {
    baseUrl: env.FREELLMAPI_BASE_URL || env.FREE_LLM_API_BASE_URL || "",
    apiKey: env.FREELLMAPI_API_KEY || env.FREE_LLM_API_KEY || "",
  };
}

function extractAssistantText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("")
      .trim();
  }
  return clean(content);
}

function isAllowedOrigin({ origin, host }) {
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function agentHandler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  if (!isAllowedOrigin({ origin: req.headers.origin, host: req.headers.host })) {
    return sendJson(res, 403, { error: "origin_not_allowed" });
  }

  const config = getAgentConfig(process.env);
  const baseUrl = normalizeLlmBaseUrl(config.baseUrl);
  const apiKey = clean(config.apiKey);

  if (!baseUrl || !apiKey) {
    return sendJson(res, 503, { error: "agent_not_configured" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "invalid_json" });
  }

  const question = clean(body.question);
  if (!question) {
    return sendJson(res, 400, { error: "question_required" });
  }

  const payload = buildAgentPayload({
    question,
    context: body.context,
    model: body.model,
  });

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(getChatCompletionUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return sendJson(res, 502, { error: "agent_unreachable" });
  }

  const upstreamPayload = await upstreamResponse.json().catch(() => ({}));
  const answer = extractAssistantText(upstreamPayload);

  if (!upstreamResponse.ok || !answer) {
    return sendJson(res, 502, { error: "agent_response_failed" });
  }

  return sendJson(res, 200, {
    answer,
    model: upstreamPayload.model || payload.model,
    routedVia: upstreamResponse.headers.get("x-routed-via") || "",
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function clean(value) {
  return String(value ?? "").trim();
}

agentHandler.buildAgentPayload = buildAgentPayload;
agentHandler.extractAssistantText = extractAssistantText;
agentHandler.getAgentConfig = getAgentConfig;
agentHandler.getChatCompletionUrl = getChatCompletionUrl;
agentHandler.isAllowedOrigin = isAllowedOrigin;
agentHandler.normalizeLlmBaseUrl = normalizeLlmBaseUrl;

module.exports = agentHandler;
