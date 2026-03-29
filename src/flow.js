/** Document collection order per tariff (internal keys) */
export const FOOT_BIKE_DOCS = [
  "passport",
  "patent_front",
  "patent_back",
  "registration",
  "migration",
  "receipt_first",
  "receipt_last",
  "bank",
];

export const CAR_TRUCK_DOCS = [
  "passport",
  "license",
  "sts",
  "patent_front",
  "patent_back",
  "registration",
  "migration",
  "receipt_first",
  "receipt_last",
  "bank",
];

export function requiredDocKeys(tariff) {
  if (tariff === "car" || tariff === "truck") {
    return [...CAR_TRUCK_DOCS];
  }
  return [...FOOT_BIKE_DOCS];
}

export function isPhotoDoc(docKey) {
  return docKey !== "phone" && docKey !== "bank";
}

export function nextPending(completed, tariff) {
  for (const k of requiredDocKeys(tariff)) {
    if (!completed.includes(k)) return k;
  }
  return null;
}
