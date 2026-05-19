import test from "node:test";
import assert from "node:assert/strict";

const checkoutModule = await import("../api/checkout.js");
const checkout = checkoutModule.default;

test("getCheckoutPlan exposes paid monetization plans only", () => {
  assert.equal(checkout.getCheckoutPlan("free"), null);
  assert.equal(checkout.getCheckoutPlan("plus").amount, 14900);
  assert.equal(checkout.getCheckoutPlan("review").amount, 49900);
  assert.equal(checkout.getCheckoutPlan("family").amount, 89900);
});

test("buildCheckoutParams creates a MYR one-time Stripe Checkout payload", () => {
  const params = checkout.buildCheckoutParams({
    origin: "https://willcrafty.vercel.app",
    plan: checkout.getCheckoutPlan("review"),
    contact: {
      fullName: "Maya Tan",
      email: "maya@example.com",
      notes: "Need Sabah review.",
    },
  });

  assert.equal(params.get("mode"), "payment");
  assert.equal(params.get("currency"), null);
  assert.equal(params.get("line_items[0][price_data][currency]"), "myr");
  assert.equal(params.get("line_items[0][price_data][unit_amount]"), "49900");
  assert.equal(params.get("line_items[0][quantity]"), "1");
  assert.equal(params.get("customer_email"), "maya@example.com");
  assert.equal(params.get("metadata[planId]"), "review");
  assert.equal(params.get("success_url"), "https://willcrafty.vercel.app/#pricing?checkout=success");
  assert.equal(params.get("cancel_url"), "https://willcrafty.vercel.app/#pricing?checkout=cancelled");
});

test("isAllowedOrigin rejects cross-origin checkout attempts", () => {
  assert.equal(
    checkout.isAllowedOrigin({
      origin: "https://willcrafty.vercel.app",
      host: "willcrafty.vercel.app",
    }),
    true,
  );
  assert.equal(
    checkout.isAllowedOrigin({
      origin: "https://evil.example",
      host: "willcrafty.vercel.app",
    }),
    false,
  );
});
