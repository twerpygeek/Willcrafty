const CHECKOUT_PLANS = {
  plus: {
    id: "plus",
    name: "WillCrafty Plus",
    amount: 14900,
    description: "Execution pack with witness checklist, executor letter, and asset inventory worksheet.",
  },
  review: {
    id: "review",
    name: "Expert Review",
    amount: 49900,
    description: "Human review intake path with one revision cycle and signing risk checklist.",
  },
  family: {
    id: "family",
    name: "Family Pack",
    amount: 89900,
    description: "Two coordinated will drafts with family signing and asset planning support.",
  },
};

function getCheckoutPlan(planId) {
  return CHECKOUT_PLANS[String(planId || "").trim()] || null;
}

function buildCheckoutParams({ origin, plan, contact = {} }) {
  const params = new URLSearchParams();
  const safeOrigin = normalizeOrigin(origin);
  const customerName = clean(contact.fullName);
  const customerEmail = clean(contact.email);
  const notes = clean(contact.notes);

  params.set("mode", "payment");
  params.set("success_url", `${safeOrigin}/#pricing?checkout=success`);
  params.set("cancel_url", `${safeOrigin}/#pricing?checkout=cancelled`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "myr");
  params.set("line_items[0][price_data][unit_amount]", String(plan.amount));
  params.set("line_items[0][price_data][product_data][name]", `WillCrafty ${plan.name}`);
  params.set("line_items[0][price_data][product_data][description]", plan.description);
  params.set("metadata[planId]", plan.id);
  params.set("metadata[planName]", plan.name);

  if (customerName) params.set("metadata[customerName]", clip(customerName));
  if (notes) params.set("metadata[notes]", clip(notes));
  if (isLikelyEmail(customerEmail)) params.set("customer_email", customerEmail);

  return params;
}

function isAllowedOrigin({ origin, host }) {
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function checkoutHandler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  if (!isAllowedOrigin({ origin: req.headers.origin, host: req.headers.host })) {
    return sendJson(res, 403, { error: "origin_not_allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return sendJson(res, 503, { error: "checkout_not_configured" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "invalid_json" });
  }

  const plan = getCheckoutPlan(body.planId);
  if (!plan) {
    return sendJson(res, 400, { error: "invalid_plan" });
  }

  const origin = getRequestOrigin(req);
  const params = buildCheckoutParams({
    origin,
    plan,
    contact: {
      fullName: body.fullName,
      email: body.email,
      notes: body.notes,
    },
  });

  let stripeResponse;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
  } catch {
    return sendJson(res, 502, { error: "stripe_unreachable" });
  }

  const stripePayload = await stripeResponse.json().catch(() => ({}));
  if (!stripeResponse.ok || !stripePayload.url) {
    return sendJson(res, 502, { error: "checkout_session_failed" });
  }

  return sendJson(res, 200, {
    mode: "stripe",
    planId: plan.id,
    checkoutSessionId: stripePayload.id,
    checkoutUrl: stripePayload.url,
  });
}

function getRequestOrigin(req) {
  if (req.headers.origin) return normalizeOrigin(req.headers.origin);

  const host = req.headers.host || "willcrafty.vercel.app";
  const proto = req.headers["x-forwarded-proto"] || "https";
  return normalizeOrigin(`${proto}://${host}`);
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
  res.end(JSON.stringify(payload));
}

function normalizeOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.origin;
  } catch {
    return "https://willcrafty.vercel.app";
  }
}

function clean(value) {
  return String(value ?? "").trim();
}

function clip(value) {
  return value.slice(0, 500);
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

checkoutHandler.CHECKOUT_PLANS = CHECKOUT_PLANS;
checkoutHandler.getCheckoutPlan = getCheckoutPlan;
checkoutHandler.buildCheckoutParams = buildCheckoutParams;
checkoutHandler.isAllowedOrigin = isAllowedOrigin;

module.exports = checkoutHandler;
