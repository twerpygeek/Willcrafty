const REQUIRED_TESTATOR_FIELDS = [
  ["fullName", "Enter your full legal name."],
  ["address", "Enter your current address."],
  ["dateOfBirth", "Enter your date of birth."],
  ["jurisdiction", "Choose a jurisdiction."],
];

const REQUIRED_EXECUTOR_FIELDS = [
  ["fullName", "Name an executor."],
  ["email", "Add your executor's email address."],
  ["relationship", "Describe your executor's relationship to you."],
];

export function validateWill(will) {
  const errors = [];

  for (const [field, message] of REQUIRED_TESTATOR_FIELDS) {
    if (!clean(will?.testator?.[field])) errors.push(message);
  }

  for (const [field, message] of REQUIRED_EXECUTOR_FIELDS) {
    if (!clean(will?.executor?.[field])) errors.push(message);
  }

  const beneficiaries = compactPeople(will?.beneficiaries);
  if (beneficiaries.length === 0) {
    errors.push("Add at least one beneficiary.");
  }

  const beneficiaryShareTotal = roundPercentage(
    beneficiaries.reduce((total, beneficiary) => total + numericShare(beneficiary.share), 0),
  );
  if (beneficiaries.length > 0 && beneficiaryShareTotal !== 100) {
    errors.push("Beneficiary distributions must add up to 100%.");
  }

  const unnamedBeneficiary = beneficiaries.find((beneficiary) => !clean(beneficiary.fullName));
  if (unnamedBeneficiary) {
    errors.push("Every beneficiary needs a full legal name.");
  }

  const assets = compactAssets(will?.assets);
  const unnamedAsset = assets.find((asset) => !clean(asset.name) || !clean(asset.recipient));
  if (unnamedAsset) {
    errors.push("Every asset needs a name and recipient.");
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}

export function buildWillDocument(will) {
  const testator = normalizePerson(will?.testator);
  const executor = normalizePerson(will?.executor);
  const beneficiaries = compactPeople(will?.beneficiaries);
  const assets = compactAssets(will?.assets);
  const guardians = compactPeople(will?.guardians);
  const wishes = clean(will?.wishes) || "No additional personal wishes were provided.";
  const today = new Date().toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    `LAST WILL AND TESTAMENT OF ${testator.fullName.toUpperCase()}`,
    "",
    "1. Declaration",
    `I, ${testator.fullName}, residing at ${testator.address}, born on ${formatDate(testator.dateOfBirth)}, declare this to be my Last Will and Testament. I revoke all prior wills and codicils made by me.`,
    "",
    "2. Executor Appointment",
    `I appoint ${executor.fullName} (${executor.relationship}, ${executor.email}) to act as executor of this will. If this executor cannot serve, my witnesses and loved ones should follow the applicable local process to appoint a replacement.`,
    "",
    "3. Beneficiaries and Distributions",
    ...beneficiaries.map((beneficiary, index) => {
      const email = beneficiary.email ? `, ${beneficiary.email}` : "";
      return `${index + 1}. ${beneficiary.fullName} (${beneficiary.relationship}${email}) receives ${numericShare(beneficiary.share)}% of my residuary estate.`;
    }),
    "",
    "4. Assets and Specific Gifts",
    ...(assets.length
      ? assets.map((asset, index) => {
          const detail = asset.description ? ` - ${asset.description}` : "";
          return `${index + 1}. ${asset.name}${detail}. Recipient: ${asset.recipient}. Share: ${numericShare(asset.share)}%.`;
        })
      : ["No specific assets were listed."]),
    "",
    "5. Guardianship Wishes",
    ...(guardians.length
      ? guardians.map((guardian, index) => {
          const note = guardian.note ? ` ${guardian.note}` : "";
          return `${index + 1}. ${guardian.fullName} (${guardian.relationship}).${note}`;
        })
      : ["No guardian designation was provided."]),
    "",
    "6. Personal Wishes",
    wishes,
    "",
    "7. Legal Disclaimer",
    jurisdictionDisclaimer(testator.jurisdiction),
    "",
    "8. Signing",
    "Signed by me in the presence of two competent adult witnesses, who are not beneficiaries, and who sign below in my presence and in the presence of each other.",
    "",
    `Date prepared: ${today}`,
    "",
    "Testator signature: _______________________________",
    "Witness 1 name and signature: ______________________",
    "Witness 2 name and signature: ______________________",
  ].join("\n");
}

export function createNotificationDraft(will, beneficiary) {
  const testatorName = clean(will?.testator?.fullName) || "the will maker";
  const recipientName = clean(beneficiary?.fullName) || "there";

  return {
    to: clean(beneficiary?.email),
    subject: `${testatorName} finalized a will with WillCrafty`,
    body: `Hi ${recipientName},

${testatorName} has finalized a will using WillCrafty and listed you as a beneficiary or trusted contact.

Please reply to acknowledge receipt of this notice. This message does not replace the signed will, legal advice, or the formal probate process.

Acknowledgement:
I acknowledge that I received this notification and understand that the signed will controls any distribution.

Sent from WillCrafty`,
  };
}

export function generateFileName(name, extension, date = new Date()) {
  const safeName = clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "my-will";
  const dateStamp = date.toISOString().slice(0, 10);
  const safeExtension = clean(extension).replace(/^\./, "") || "txt";

  return `willcrafty-${safeName}-${dateStamp}.${safeExtension}`;
}

export function toWordHtml(documentText) {
  const escaped = escapeHtml(documentText).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WillCrafty Will</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #172121; margin: 48px; }
    h1 { font-size: 24px; }
  </style>
</head>
<body>${escaped}</body>
</html>`;
}

export function clean(value) {
  return String(value ?? "").trim();
}

function normalizePerson(person) {
  return {
    fullName: clean(person?.fullName) || "Unnamed person",
    address: clean(person?.address) || "Address not provided",
    dateOfBirth: clean(person?.dateOfBirth) || "Date of birth not provided",
    jurisdiction: clean(person?.jurisdiction) || "your jurisdiction",
    relationship: clean(person?.relationship) || "Relationship not provided",
    email: clean(person?.email) || "Email not provided",
  };
}

function compactPeople(people = []) {
  return people
    .map((person) => ({
      fullName: clean(person.fullName),
      relationship: clean(person.relationship),
      email: clean(person.email),
      share: numericShare(person.share),
      note: clean(person.note),
    }))
    .filter((person) => person.fullName || person.relationship || person.email || person.share || person.note);
}

function compactAssets(assets = []) {
  return assets
    .map((asset) => ({
      name: clean(asset.name),
      description: clean(asset.description),
      recipient: clean(asset.recipient),
      share: numericShare(asset.share || 100),
    }))
    .filter((asset) => asset.name || asset.description || asset.recipient);
}

function numericShare(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundPercentage(value) {
  return Math.round(value * 100) / 100;
}

function formatDate(value) {
  if (!value) return "Date of birth not provided";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function jurisdictionDisclaimer(jurisdiction) {
  const place = clean(jurisdiction) || "your jurisdiction";
  return `${place} signing and witness requirements can vary. This WillCrafty draft is a self-help document, not legal advice. Review it against local law before signing, and sign it only when you are of sound mind, acting voluntarily, and in the presence of two competent adult witnesses who are not beneficiaries.`;
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
