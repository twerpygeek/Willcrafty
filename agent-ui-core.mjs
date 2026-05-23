export function createAgentAnswerState({ heading, body, routedVia = "" }) {
  return {
    heading: String(heading ?? "").trim(),
    body: String(body ?? "").trim(),
    routedVia: String(routedVia ?? "").trim(),
  };
}

export function getPendingAgentAnswerState() {
  return createAgentAnswerState({
    heading: "Working on it",
    body: "Routing your question through the configured AI endpoint.",
  });
}

export function getAnsweredAgentAnswerState({ answer, routedVia = "" }) {
  return createAgentAnswerState({
    heading: "WillCrafty AI",
    body: answer,
    routedVia,
  });
}

export function getSetupAgentAnswerState() {
  return createAgentAnswerState({
    heading: "Setup needed",
    body: "Add FREELLMAPI_BASE_URL and FREELLMAPI_API_KEY in your deployment environment, then connect them to a running FreeLLMAPI proxy.",
  });
}

export function renderAgentAnswer(document, container, state) {
  const heading = document.createElement("strong");
  heading.textContent = state.heading;

  const nodes = [heading];

  if (state.routedVia) {
    const routeLabel = document.createElement("span");
    routeLabel.textContent = `Routed via ${state.routedVia}`;
    nodes.push(routeLabel);
  }

  const body = document.createElement("p");
  body.textContent = state.body;
  nodes.push(body);

  container.replaceChildren(...nodes);
}
