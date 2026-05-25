function clean(value) {
  return String(value ?? "").trim();
}

export function getPlanRecommendationMessage(recommendation) {
  if (recommendation.id === "free") {
    return "Your draft looks suitable for the free self-help path. Upgrade only if you want a cleaner signing pack or review.";
  }

  return `Recommended next step: ${recommendation.name} for ${recommendation.priceLabel} ${recommendation.cadence}.`;
}

export function renderValidationPanel(document, container, result) {
  if (result.isValid) {
    const message = document.createElement("p");
    message.className = "valid";
    message.textContent = "Your draft has the required sections. Review carefully before signing.";
    container.replaceChildren(message);
    return;
  }

  const list = document.createElement("ul");
  result.errors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = error;
    list.append(item);
  });
  container.replaceChildren(list);
}

export function renderPlanRecommendation(document, container, recommendation) {
  const wrapper = document.createElement("div");
  const message = document.createElement("strong");
  const bestFor = document.createElement("p");
  const button = document.createElement("button");

  message.textContent = getPlanRecommendationMessage(recommendation);
  bestFor.textContent = recommendation.bestFor;

  button.className = "button small";
  button.type = "button";
  button.dataset.planId = recommendation.id;
  button.textContent = recommendation.cta;

  wrapper.append(message, bestFor, button);
  container.replaceChildren(wrapper);
}

export function renderNotificationList(document, container, beneficiaries, acknowledged) {
  if (beneficiaries.length === 0) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Add beneficiaries to prepare notification drafts.";
    container.replaceChildren(message);
    return;
  }

  const list = document.createElement("div");
  list.className = "notify-list";

  beneficiaries.forEach((beneficiary, index) => {
    const row = document.createElement("div");
    const summary = document.createElement("div");
    const name = document.createElement("strong");
    const lineBreak = document.createElement("br");
    const email = document.createElement("span");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const labelText = document.createTextNode(" Acknowledged");
    const button = document.createElement("button");

    row.className = "notify-row";
    name.textContent = clean(beneficiary.fullName) || `Beneficiary ${index + 1}`;
    email.textContent = clean(beneficiary.email) || "No email yet";
    summary.append(name, lineBreak, email);

    checkbox.dataset.ackIndex = String(index);
    checkbox.type = "checkbox";
    checkbox.checked = acknowledged.has(String(index));
    label.append(checkbox, labelText);

    button.className = "button small";
    button.type = "button";
    button.dataset.notifyIndex = String(index);
    button.textContent = "Prepare email";

    row.append(summary, label, button);
    list.append(row);
  });

  container.replaceChildren(list);
}
