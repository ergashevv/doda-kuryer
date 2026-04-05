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
  "reg_amina",
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
  // Car va Truck: bir xil citizenship/SMZ oqimi. Truck oxirida dimensions+payload+branding qo'shiladi.
  if (categoryKey === "car" || categoryKey === "truck") {
    const seq = [];
    const smzGroup = ["rf", "kg", "kz"];
    if (smzGroup.includes(bk.citizenship)) {
      seq.push("self_employed");
      if (bk.selfEmployed === true) {
        seq.push("reg_amina", "moy_nalog_phone");
      }
    }
    seq.push("vehicle_rf_pick");
    if (bk.vehicleRf === false) {
      seq.push("license", "tech_passport_front", "tech_passport_back");
    } else {
      seq.push("license", "sts");
    }
    if (categoryKey === "truck") {
      seq.push("truck_dimensions", "truck_payload", "truck_branding");
    }
    seq.push("passport");
    return seq;
  }

  // Moto: citizenship + SMZ branch + prava (license) + pasport. STS va mashina qayerda ro'yxat YO'Q.
  if (categoryKey === "moto") {
    const seq = [];
    const smzGroup = ["rf", "kg", "kz"];
    if (smzGroup.includes(bk.citizenship)) {
      seq.push("self_employed");
      if (bk.selfEmployed === true) {
        seq.push("reg_amina", "moy_nalog_phone");
      }
    }
    seq.push("license", "passport");
    return seq;
  }

  // Bike (velo): citizenship + SMZ branch + pasport. Prava, STS, mashina doc YO'Q.
  if (categoryKey === "bike") {
    const seq = [];
    const smzGroup = ["rf", "kg", "kz"];
    if (smzGroup.includes(bk.citizenship)) {
      seq.push("self_employed");
      if (bk.selfEmployed === true) {
        seq.push("reg_amina", "moy_nalog_phone");
      }
    }
    seq.push("passport");
    return seq;
  }

  // Peshkom (foot): bike bilan bir xil — mashina, prava, STS YO'Q.
  const seq = [];
  const smzGroupFoot = ["rf", "kg", "kz"];
  if (smzGroupFoot.includes(bk.citizenship)) {
    seq.push("self_employed");
    if (bk.selfEmployed === true) {
      seq.push("reg_amina", "moy_nalog_phone");
    }
  }
  seq.push("passport");
  return seq;
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
    if (key === "vehicle_rf_pick") {
      if (typeof bk.vehicleRf !== "boolean") return key;
      continue;
    }
    if (key === "inn") {
      if (!bk.inn || String(bk.inn).trim() === "") return key;
      continue;
    }
    if (key === "moy_nalog_phone") {
      if (!bk.moyNalogPhone || String(bk.moyNalogPhone).trim() === "")
        return key;
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
