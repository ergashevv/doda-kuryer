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

/** Hujjat yuklanadigan qadamlar (DB doc_type) — guruhga yuborish tartibi */
export const DODA_UPLOAD_DOC_KEYS = new Set([
  "license",
  "sts",
  "tech_passport_front",
  "tech_passport_back",
  "passport",
]);

export function isDodaUploadDocKey(key) {
  return DODA_UPLOAD_DOC_KEYS.has(key);
}

/**
 * Doda taxi: VU → (legkovoy: RF=СТС | chet el=2× техпаспорт) → загран паспорт.
 * Yuk mashinasi: VU → СТС → габариты → грузоподъемность → грузчики → оклейка → паспорт.
 * Velosiped: самозанятость → (если да — ИНН) → термокороб → паспорт.
 * Piyoda / moto: VU → СТС → паспорт.
 */
export function dodaDocSequence(categoryKey, bk = {}) {
  if (categoryKey === "truck") {
    return [
      "license",
      "sts",
      "truck_dimensions",
      "truck_payload",
      "truck_loaders",
      "truck_branding",
      "passport",
    ];
  }
  if (categoryKey === "bike") {
    const seq = ["self_employed"];
    if (bk.selfEmployed === true) seq.push("inn");
    seq.push("thermal", "passport");
    return seq;
  }
  if (categoryKey !== "car") {
    return ["license", "sts", "passport"];
  }
  if (bk.vehicleRf === false) {
    return ["license", "tech_passport_front", "tech_passport_back", "passport"];
  }
  return ["license", "sts", "passport"];
}
