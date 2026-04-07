/**
 * Яндекс Лавка / Еда: очередь шагов и вспомогательные типы.
 * session_data.yx — флаги; completed_yx — порядок завершённых doc_type (префикс yx_).
 */

export const YX_LAVKA = "yandex_lavka";
export const YX_EATS = "yandex_eda";

export function initYandexSession(td, serviceKey, registeredPhone = null) {
  const phone = (registeredPhone && String(registeredPhone).trim()) || "";
  const useRegisteredPhone = phone.length > 0;
  let collected = clearYandexCollected(td);
  if (useRegisteredPhone) {
    collected = {
      ...collected,
      yx_col_contact_phone: phone,
    };
  }
  const fresh = clearYandexStagingSessionFields({
    ...td,
    yx: {
      service: serviceKey,
      cityKey: null,
      citizen: null,
      uzDocKind: null,
      kzDocKind: null,
      tmVisaKind: null,
      regAmina: null,
      useRegisteredPhone,
    },
    completed_yx: [],
    collected,
  });
  delete fresh.yx_review_restore_tail;
  delete fresh.yx_review_redo_edit_index;
  return fresh;
}

export function clearYandexCollected(td) {
  const coll = { ...(td.collected || {}) };
  for (const k of Object.keys(coll)) {
    if (k.startsWith("yx_col_")) delete coll[k];
  }
  return coll;
}

/** Shahar / fuqarolik / hujjat turi o‘zgarganda Yandex fayl staging kalitlarini tozalaydi. */
export function clearYandexStagingSessionFields(td) {
  const o = { ...(td || {}) };
  delete o.yx_staged_doc;
  delete o.yx_prompt_msg_ids;
  delete o.yx_preview_msg_ids;
  delete o.bk_pending_user_message_id;
  return o;
}

function photo(docType, promptKey) {
  return { t: "photo", docType, promptKey };
}
function video(docType, promptKey) {
  return { t: "video", docType, promptKey };
}
function pdfOrPhoto(docType, promptKey) {
  return { t: "doc", docType, promptKey };
}
function textField(colKey, promptKey, mode) {
  return { t: "text", colKey, promptKey, mode: mode || "plain" };
}
function choice(choiceId, promptKey) {
  return { t: "choice", choiceId, promptKey };
}

function tailRekvizitCard16() {
  // Rekvizitlar: matn + karta raqami (selfie / video yo'q)
  return [
    textField("yx_col_req_text", "yx_p_req_text", "plain"),
    textField("yx_col_card16", "yx_p_card16", "digits16"),
  ];
}

function tailRfAfterMig(yx) {
  if (yx && yx.useRegisteredPhone) return tailRekvizitCard16();
  return [
    textField("yx_col_contact_phone", "yx_p_contact_phone", "phone"),
    ...tailRekvizitCard16(),
  ];
}

function tailKzAfterMig() {
  return tailRekvizitCard16();
}

/** UZ/TJ: fuqarolikdan keyin, hujjat turidan oldin — pasport (old → orqa). */
export const UZ_TJ_PASSPORT_PREFIX = [
  photo("yx_uz_pre_pass_f", "yx_p_uz_pre_pass_f"),
  photo("yx_uz_pre_pass_b", "yx_p_uz_pre_pass_b"),
];

export function uzTjPassportPrefixComplete(completed) {
  const c = completed || [];
  return (
    c.length >= 2 &&
    c[0] === "yx_uz_pre_pass_f" &&
    c[1] === "yx_uz_pre_pass_b"
  );
}

/** Eski oqim: prefixsiz boshlangan sessiyalar (completed birinchi elementi patent/VNJ/talaba). */
function uzTjLegacyBodyFirst(completed, yx) {
  if (!yx?.uzDocKind || !completed?.length) return false;
  if (completed[0] === "yx_uz_pre_pass_f") return false;
  return true;
}

function lineUzPatent(yx) {
  const L = [
    photo("yx_uz_pat_front", "yx_p_uz_pat_front"),
    photo("yx_uz_pat_back", "yx_p_uz_pat_back"),
  ];
  if (!yx.regAmina) {
    L.push(choice("ram_pat", "yx_p_ram_choice"));
    return L;
  }
  if (yx.regAmina === "reg") {
    L.push(
      photo("yx_uz_pat_reg_f", "yx_p_reg_f"),
      photo("yx_uz_pat_reg_b", "yx_p_reg_b")
    );
  } else {
    L.push(photo("yx_uz_pat_amina", "yx_p_amina"));
  }
  L.push(
    photo("yx_uz_pat_mig", "yx_p_mig"),
    photo("yx_uz_pat_pay_ph", "yx_p_pay_ph"),
    pdfOrPhoto("yx_uz_pat_pay_file", "yx_p_pay_file"),
    ...tailRekvizitCard16()
  );
  return L;
}

/** UZ/TJ + VNJ/RVP: VNJ old/orqa → INN → SNILS → migratsiya → tel (agar kerak) → rekvizit → 16 raqam (регистрация / Амина yo‘q). */
function lineUzVnzh(yx) {
  return [
    photo("yx_uz_vnzh_f", "yx_p_vnzh_f"),
    photo("yx_uz_vnzh_b", "yx_p_vnzh_b"),
    textField("yx_col_inn", "yx_p_inn", "inn"),
    textField("yx_col_snils", "yx_p_snils", "snils"),
    photo("yx_uz_vnzh_mig", "yx_p_mig"),
    ...tailRfAfterMig(yx),
  ];
}

function lineUzStudent(yx) {
  const L = [
    photo("yx_uz_st_bilet", "yx_p_st_bilet"),
    photo("yx_uz_st_spravka", "yx_p_st_spravka"),
  ];
  if (!yx.regAmina) {
    L.push(choice("ram_st", "yx_p_ram_choice"));
    return L;
  }
  if (yx.regAmina === "reg") {
    L.push(photo("yx_uz_st_reg_f", "yx_p_reg_f"), photo("yx_uz_st_reg_b", "yx_p_reg_b"));
  } else {
    L.push(photo("yx_uz_st_amina", "yx_p_amina"));
  }
  L.push(photo("yx_uz_st_mig", "yx_p_mig"), ...tailRekvizitCard16());
  return L;
}

function lineKzKg(yx) {
  const L = [];
  if (!yx.kzDocKind) return L;
  if (yx.kzDocKind !== "pass") {
    L.push(photo("yx_kz_id_f", "yx_p_kz_id_f"), photo("yx_kz_id_b", "yx_p_kz_id_b"));
  }
  L.push(photo("yx_kz_mig", "yx_p_mig"));
  if (!yx.regAmina) {
    L.push(choice("ram_kz", "yx_p_ram_choice"));
    return L;
  }
  if (yx.regAmina === "reg") {
    L.push(photo("yx_kz_reg_f", "yx_p_reg_f"), photo("yx_kz_reg_b", "yx_p_reg_b"));
  } else {
    L.push(photo("yx_kz_amina", "yx_p_amina"));
  }
  L.push(...tailKzAfterMig());
  return L;
}

function lineRf(yx) {
  return [
    photo("yx_rf_pass_face", "yx_p_rf_pass_face"),
    photo("yx_rf_pass_prop", "yx_p_rf_pass_prop"),
    ...tailRfAfterMig(yx),
  ];
}

/** TZ: pasport → viza turi → viza surati → Amina/reg (bitta fayl) → mig → telefon → rekvizit → 16 raqam. Faqat işçi wiza. */
function lineTm(yx) {
  const tmVisaKind =
    yx.tmVisaKind === "study" ? "work" : yx.tmVisaKind;
  if (!tmVisaKind) {
    return [choice("visa_kind", "yx_ask_tm_visa")];
  }
  const tmTail = [];
  if (!yx || !yx.useRegisteredPhone) {
    tmTail.push(textField("yx_col_tm_contact", "yx_p_contact_phone", "phone"));
  }
  return [
    photo("yx_tm_visa", "yx_p_tm_visa"),
    pdfOrPhoto("yx_tm_amina_or_reg", "yx_p_tm_amina_or_reg"),
    photo("yx_tm_mig", "yx_p_mig"),
    ...tmTail,
    ...tailRekvizitCard16(),
  ];
}

/** UZ/TJ guruh (alohida tugmalar: uz, tj; eski: uz_tj) */
export function isYxCitizenUzTjGroup(c) {
  return c === "uz" || c === "tj" || c === "uz_tj";
}

/** KZ/KG guruh (alohida: kz, kg; eski: kz_kg) */
export function isYxCitizenKzKgGroup(c) {
  return c === "kz" || c === "kg" || c === "kz_kg";
}

/** Boshqa davlat — hujjatlar RF bilan bir xil ketma-kilik */
export function isYxCitizenOther(c) {
  return c === "other";
}

export function buildYxLine(yx, completed = []) {
  if (!yx?.citizen) return [];
  if (isYxCitizenUzTjGroup(yx.citizen)) {
    const skipPrefix = uzTjLegacyBodyFirst(completed, yx);
    const prefix = skipPrefix ? [] : UZ_TJ_PASSPORT_PREFIX;
    if (!yx.uzDocKind) return prefix;
    let body = [];
    if (yx.uzDocKind === "patent") body = lineUzPatent(yx);
    else if (yx.uzDocKind === "vnzh") body = lineUzVnzh(yx);
    else if (yx.uzDocKind === "student") body = lineUzStudent(yx);
    return prefix.concat(body);
  }
  if (isYxCitizenKzKgGroup(yx.citizen)) return lineKzKg(yx);
  if (yx.citizen === "rf" || isYxCitizenOther(yx.citizen)) return lineRf(yx);
  if (yx.citizen === "tm") return lineTm(yx);
  return [];
}

/**
 * Yakuniy tekshiruvdan bitta qadamni qayta bosish: `fromIndex` dan boshlab tail olib tashlash.
 * `completed_yx` ichida `yx_*` fayl qadamlari va `__text__:yx_col_*` belgilari.
 * @returns {{ completed_yx: string[], collected: object, docTypesToDelete: string[] } | null}
 */
export function stripYandexTailFromCompleted(td, fromIndex) {
  const completed = [...(td.completed_yx || [])];
  if (fromIndex < 0 || fromIndex >= completed.length) return null;
  const tail = completed.slice(fromIndex);
  const newCompleted = completed.slice(0, fromIndex);
  const coll = { ...(td.collected || {}) };
  const docTypesToDelete = [];
  for (const entry of tail) {
    if (typeof entry !== "string") continue;
    if (entry.startsWith("__text__:")) {
      const colKey = entry.slice("__text__:".length);
      delete coll[colKey];
    } else if (entry.startsWith("yx_")) {
      docTypesToDelete.push(entry);
    }
  }
  return {
    completed_yx: newCompleted,
    collected: coll,
    docTypesToDelete,
  };
}

/**
 * Yakuniy tekshiruvdan faqat bitta qadamni qayta: keyingi qadamlar `completed_yx` va DB da saqlanadi.
 * `session_data` ga `yx_review_restore_tail` va `yx_review_redo_edit_index` qo‘yiladi — qadam tugagach merge.
 */
export function prepareYandexSingleReviewRedo(td, editIndex) {
  const completed = [...(td.completed_yx || [])];
  if (editIndex < 0 || editIndex >= completed.length) return null;
  const entry = completed[editIndex];
  const prefix = completed.slice(0, editIndex);
  const restoreTail = completed.slice(editIndex + 1);
  const coll = { ...(td.collected || {}) };
  const docTypesToDelete = [];
  if (typeof entry === "string") {
    if (entry.startsWith("__text__:")) {
      const colKey = entry.slice("__text__:".length);
      delete coll[colKey];
    } else if (entry.startsWith("yx_")) {
      docTypesToDelete.push(entry);
    }
  }
  return {
    completed_yx: prefix,
    collected: coll,
    docTypesToDelete,
    yx_review_restore_tail: restoreTail,
    yx_review_redo_edit_index: editIndex,
  };
}

/** Faqat bitta qadam qayta oqimida: prefix + yangi qadam bo‘lganda tail ni qayta qo‘shadi. */
export function mergeCompletedIfYxReviewRedoDone(td, completed) {
  const tail = td.yx_review_restore_tail;
  const idx = td.yx_review_redo_edit_index;
  if (!Array.isArray(tail) || typeof idx !== "number" || idx < 0) {
    return { completed, clearRedoMeta: false };
  }
  if (completed.length !== idx + 1) {
    return { completed, clearRedoMeta: false };
  }
  return {
    completed: [...completed, ...tail],
    clearRedoMeta: true,
  };
}

export function getYandexUiState(yx, completedLen, td) {
  if (td?.yx_staged_doc) return { ui: "staged" };
  if (!yx?.service) return { ui: "none" };
  if (!yx.cityKey) return { ui: "city" };
  if (!yx.citizen) return { ui: "citizen" };

  const hasTd = td !== undefined && td !== null;
  const completed = hasTd ? (td.completed_yx || []) : [];
  const doneCount = hasTd ? completed.length : completedLen;

  const uzDocKindValid =
    yx.uzDocKind === "patent" ||
    yx.uzDocKind === "vnzh" ||
    yx.uzDocKind === "student";

  if (isYxCitizenUzTjGroup(yx.citizen) && !uzDocKindValid) {
    if (completed.length < UZ_TJ_PASSPORT_PREFIX.length) {
      return {
        ui: "step",
        step: UZ_TJ_PASSPORT_PREFIX[completed.length],
      };
    }
    return { ui: "uz_doc" };
  }

  if (isYxCitizenKzKgGroup(yx.citizen) && !yx.kzDocKind) return { ui: "kz_doc" };
  const line = buildYxLine(yx, completed);
  if (line.length === 0) {
    if (isYxCitizenUzTjGroup(yx.citizen)) return { ui: "uz_doc" };
    return { ui: "none" };
  }
  if (doneCount >= line.length) return { ui: "done" };
  return { ui: "step", step: line[doneCount] };
}

export function yxForbiddenMedia(msg, step) {
  if (!step) return true;
  if (step.t === "video") {
    return !!(msg.voice || msg.video_note || msg.sticker || msg.animation);
  }
  return !!(msg.voice || msg.video || msg.video_note || msg.sticker || msg.animation);
}

export function yxExtractFile(msg, step) {
  if (step.t === "video" && msg.video) {
    const f = msg.video;
    return { fileId: f.file_id, mime: f.mime_type || "video/mp4" };
  }
  if ((step.t === "photo" || step.t === "doc") && msg.photo?.length) {
    const f = msg.photo[msg.photo.length - 1];
    return { fileId: f.file_id, mime: "image/jpeg" };
  }
  if ((step.t === "photo" || step.t === "doc") && msg.document) {
    return { fileId: msg.document.file_id, mime: msg.document.mime_type || "application/pdf" };
  }
  return null;
}

export function validateYxText(step, text) {
  const raw = (text || "").trim();
  if (!raw) return null;
  if (step.mode === "digits16") {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 16) return null;
    return d;
  }
  if (step.mode === "phone") {
    const d = raw.replace(/\D/g, "");
    if (d.length < 10) return null;
    return raw;
  }
  if (step.mode === "inn") {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 10 && d.length !== 12) return null;
    return d;
  }
  if (step.mode === "snils") {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 11) return null;
    return d;
  }
  return raw;
}
