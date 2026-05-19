import test from "node:test";
import assert from "node:assert/strict";

import {
  createPlanLeadDraft,
  getPlanById,
  getRecommendedPlan,
  pricingPlans,
} from "../monetization-core.mjs";

test("pricingPlans keeps the free draft promise and defines three paid offers", () => {
  assert.equal(pricingPlans.length, 4);
  assert.equal(pricingPlans[0].id, "free");
  assert.equal(pricingPlans[0].price, 0);
  assert.deepEqual(
    pricingPlans.filter((plan) => plan.price > 0).map((plan) => plan.id),
    ["plus", "review", "family"],
  );
});

test("getRecommendedPlan selects review for complex single-person wills", () => {
  const plan = getRecommendedPlan({
    hasSpouseWill: false,
    beneficiaries: 4,
    hasMinorChildren: true,
    hasSpecificAssets: true,
  });

  assert.equal(plan.id, "review");
});

test("getRecommendedPlan selects family pack for couple planning", () => {
  const plan = getRecommendedPlan({
    hasSpouseWill: true,
    beneficiaries: 2,
    hasMinorChildren: false,
    hasSpecificAssets: false,
  });

  assert.equal(plan.id, "family");
});

test("createPlanLeadDraft includes plan, price, and legal scope caveat", () => {
  const draft = createPlanLeadDraft(getPlanById("review"), {
    fullName: "Maya Tan",
    email: "maya@example.com",
    notes: "I have minor children and a property in Sabah.",
  });

  assert.equal(draft.to, "hello@willcrafty.com");
  assert.match(draft.subject, /Expert Review/);
  assert.match(draft.body, /RM499/);
  assert.match(draft.body, /not legal advice/i);
  assert.match(draft.mailto, /^mailto:/);
});
