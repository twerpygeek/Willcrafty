function clean(value) {
  return String(value ?? "").trim();
}

function createButton(document, { text, className = "", type = "button", dataset = {}, ariaLabel = "" }) {
  const button = document.createElement("button");
  button.type = type;
  button.textContent = text;
  if (className) button.className = className;
  if (ariaLabel) button.setAttribute?.("aria-label", ariaLabel);
  Object.assign(button.dataset, dataset);
  return button;
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

export function renderPricingGrid(document, container, plans, formatPrice) {
  const cards = plans.map((plan) => {
    const card = document.createElement("article");
    const head = document.createElement("div");
    const textGroup = document.createElement("div");
    const title = document.createElement("h3");
    const tagline = document.createElement("p");
    const priceRow = document.createElement("div");
    const price = document.createElement("strong");
    const cadence = document.createElement("span");
    const bestFor = document.createElement("p");
    const features = document.createElement("ul");
    const caveat = document.createElement("p");
    const cta = createButton(document, {
      text: plan.cta,
      className: `button ${plan.highlighted ? "primary" : "secondary"}`,
      dataset: { planId: plan.id },
    });

    card.className = `pricing-card ${plan.highlighted ? "highlighted" : ""}`.trim();
    head.className = "pricing-card-head";
    title.textContent = plan.name;
    tagline.textContent = plan.tagline;
    textGroup.append(title, tagline);
    head.append(textGroup);

    if (plan.highlighted) {
      const badge = document.createElement("span");
      badge.className = "plan-badge";
      badge.textContent = "Recommended";
      head.append(badge);
    }

    priceRow.className = "plan-price";
    price.textContent = formatPrice(plan);
    cadence.textContent = plan.cadence;
    priceRow.append(price, cadence);

    bestFor.className = "best-for";
    bestFor.textContent = plan.bestFor;

    plan.features.forEach((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      features.append(item);
    });

    caveat.className = "plan-caveat";
    caveat.textContent = plan.caveat;

    card.append(head, priceRow, bestFor, features, caveat, cta);
    return card;
  });

  container.replaceChildren(...cards);
}

export function renderSceneDots(document, container, scenes) {
  const dots = scenes.map((scene, index) =>
    createButton(document, {
      text: "",
      dataset: { sceneIndex: String(index) },
      ariaLabel: scene.title,
    }),
  );

  container.replaceChildren(...dots);
}

export function renderRepeaterCards(document, container, type, rows, config) {
  const cards = rows.map((row, rowIndex) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const removeButton = createButton(document, {
      text: "Remove",
      className: "remove-row",
      dataset: { removeRow: String(rowIndex) },
    });
    const fieldGrid = document.createElement("div");

    card.className = "repeat-card";
    header.className = "repeat-card-header";
    title.textContent = `${config.label} ${rowIndex + 1}`;
    fieldGrid.className = "field-grid";

    config.rows.forEach(([key, labelText, placeholder, inputType]) => {
      const label = document.createElement("label");
      const input = document.createElement("input");

      label.append(document.createTextNode(labelText), document.createTextNode("\n"));
      input.name = `${type}.${rowIndex}.${key}`;
      input.placeholder = placeholder;
      input.value = clean(row[key]);

      if (inputType === "number") {
        input.type = "text";
        input.inputMode = "decimal";
        input.pattern = "[0-9]*";
      } else if (inputType === "email") {
        input.type = "text";
        input.inputMode = "email";
      } else {
        input.type = inputType;
      }

      label.append(input);
      fieldGrid.append(label);
    });

    header.append(title, removeButton);
    card.append(header, fieldGrid);
    return card;
  });

  container.replaceChildren(...cards);
}
