export const pricingPlans = [
  {
    id: "free",
    name: "Free Draft",
    price: 0,
    cadence: "forever",
    tagline: "Create and download your will draft privately.",
    cta: "Start free",
    bestFor: "Simple self-help drafting",
    features: [
      "Guided will builder",
      "PDF, Word, and text export",
      "Jurisdiction-aware signing reminder",
      "No account and no server-side will storage",
    ],
    caveat: "Self-help document only. Review local law before signing.",
  },
  {
    id: "plus",
    name: "WillCrafty Plus",
    price: 149,
    cadence: "one-time",
    tagline: "Execution pack for people who want a cleaner signing workflow.",
    cta: "Request Plus",
    bestFor: "Better handoff to witnesses and executor",
    features: [
      "Premium formatted will pack",
      "Witness checklist",
      "Executor letter",
      "Asset inventory worksheet",
      "Beneficiary notification templates",
    ],
    caveat: "Does not include legal review.",
  },
  {
    id: "review",
    name: "Expert Review",
    price: 499,
    cadence: "from",
    tagline: "A human review path for higher-confidence estate planning.",
    cta: "Request review",
    bestFor: "Property, children, multiple beneficiaries, or complex wishes",
    highlighted: true,
    features: [
      "Planner or legal-partner review intake",
      "One revision cycle",
      "Malaysia/Sabah execution guidance",
      "Risk checklist before signing",
      "Priority support within 3 working days",
    ],
    caveat: "Review scope must be confirmed by the provider. Not legal advice until formally engaged.",
  },
  {
    id: "family",
    name: "Family Pack",
    price: 899,
    cadence: "from",
    tagline: "Two wills and a coordinated plan for couples or families.",
    cta: "Request family pack",
    bestFor: "Couples, parents, and shared asset planning",
    features: [
      "Two coordinated will drafts",
      "Guardian planning prompts",
      "Shared asset checklist",
      "Executor and beneficiary coordination",
      "Family signing checklist",
    ],
    caveat: "Complex trusts, tax planning, and custody services require separate quotation.",
  },
];

export function getPlanById(id) {
  return pricingPlans.find((plan) => plan.id === id) || pricingPlans[0];
}

export function formatPrice(plan) {
  if (!plan.price) return "Free";
  return `RM${plan.price.toLocaleString("en-MY")}`;
}

export function getRecommendedPlan(input = {}) {
  if (input.hasSpouseWill) return getPlanById("family");

  const complexityScore = [
    Number(input.beneficiaries || 0) >= 3,
    Boolean(input.hasMinorChildren),
    Boolean(input.hasSpecificAssets),
  ].filter(Boolean).length;

  if (complexityScore >= 2) return getPlanById("review");
  if (complexityScore === 1) return getPlanById("plus");
  return getPlanById("free");
}

export function createPlanLeadDraft(plan, contact = {}) {
  const selectedPlan = plan || pricingPlans[0];
  const fullName = clean(contact.fullName) || "Prospective WillCrafty customer";
  const email = clean(contact.email) || "Not provided";
  const notes = clean(contact.notes) || "No extra notes provided.";
  const price = formatPrice(selectedPlan);
  const subject = `WillCrafty ${selectedPlan.name} request`;
  const body = [
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Selected plan: ${selectedPlan.name}`,
    `Displayed price: ${price}${selectedPlan.price ? ` ${selectedPlan.cadence}` : ""}`,
    "",
    "Notes:",
    notes,
    "",
    "Scope note:",
    `${selectedPlan.caveat} WillCrafty is a self-help drafting tool and is not legal advice unless a qualified professional is formally engaged.`,
  ].join("\n");

  return {
    to: "hello@willcrafty.com",
    subject,
    body,
    mailto: `mailto:hello@willcrafty.com?${new URLSearchParams({ subject, body }).toString()}`,
  };
}

function clean(value) {
  return String(value ?? "").trim();
}
