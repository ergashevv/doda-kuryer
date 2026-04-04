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
 * Yuk mashinasi: VU → СТС → габариты → грузоподъемность → оклейка → паспорт.
 * Velosiped: самозанятость → (РФ+да: «Мой налог» тел. + адрес | иначе ИНН) → паспорт.
 * Moto: telefon (til qadamida) → VU → pasport; shahar va RK fuqaroligi so‘ralmaydi.
 * Piyoda: VU → СТС → паспорт.
 */
export function dodaDocSequence(categoryKey, bk = {}) {
  if (categoryKey === "truck") {
    return [
      "license",
      "sts",
      "truck_dimensions",
      "truck_payload",
      "truck_branding",
      "passport",
    ];
  }
  if (categoryKey === "bike") {
    const seq = ["self_employed"];
    if (bk.selfEmployed === true) {
      if (bk.rfCitizen === true) {
        seq.push("bike_smz_phone", "bike_smz_address");
      } else {
        seq.push("inn");
      }
    }
    seq.push("passport");
    return seq;
  }
  if (categoryKey === "moto") {
    return ["license", "passport"];
  }
  if (categoryKey !== "car") {
    return ["license", "sts", "passport"];
  }
  if (bk.vehicleRf === false) {
    return ["license", "tech_passport_front", "tech_passport_back", "passport"];
  }
  return ["license", "sts", "passport"];
}

/**
 * DBsiz test va handlerlar uchun: keyingi to‘ldirilmagan Doda qadamini hisoblaydi.
 * `uploaded` — yuklangan `doc_type` lar (Set yoki massiv).
 */
export function getFirstMissingDodaStepSync(bk, uploaded) {
  const uploadedSet = uploaded instanceof Set ? uploaded : new Set(uploaded);
  const seq = dodaDocSequence(bk.categoryKey || "foot", bk);
  for (const key of seq) {
    if (key === "self_employed") {
      if (typeof bk.selfEmployed !== "boolean") return key;
      continue;
    }
    if (key === "inn") {
      if (!bk.inn || String(bk.inn).trim() === "") return key;
      continue;
    }
    if (key === "bike_smz_phone") {
      if (!bk.moyNalogPhone || String(bk.moyNalogPhone).trim() === "")
        return key;
      continue;
    }
    if (key === "bike_smz_address") {
      const a = bk.smzAddress != null ? String(bk.smzAddress).trim() : "";
      if (a.length < 12) return key;
      continue;
    }
    if (isDodaUploadDocKey(key)) {
      if (!uploadedSet.has(key)) return key;
      continue;
    }
    if (key === "truck_dimensions") {
      if (!bk.truckDimensionLabel) return key;
      continue;
    }
    if (key === "truck_payload") {
      if (bk.truckPayloadKg == null || bk.truckPayloadKg === "") return key;
      continue;
    }
    if (key === "truck_branding") {
      if (typeof bk.truckBranding !== "boolean") return key;
      continue;
    }
  }
  return null;
}

/** `bk_TR:d:S` kabi callback — prefix `bk_TR:` 6 belgi. slice(7) xato bo‘lardi. */
export function parseBkTrCallbackData(data) {
  if (!data || !data.startsWith("bk_TR:")) return null;
  const sub = data.slice(6);
  const colon = sub.indexOf(":");
  if (colon < 0) return null;
  return { kind: sub.slice(0, colon), val: sub.slice(colon + 1) };
}
