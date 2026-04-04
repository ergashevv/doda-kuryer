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
      yx_col_tm_contact: phone,
    };
  }
  return clearYandexStagingSessionFields({
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

function lineUzPatent(yx) {
  const L = [
    photo("yx_uz_pat_pass", "yx_p_uz_pat_pass"),
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

/** UZ/TJ + VNJ/RVP: VNJ old/orqa → pasport → INN → SNILS → Amina/reg → mig → tel (agar kerak) → rekvizit → 16 raqam */
function lineUzVnzh(yx) {
  const L = [
    photo("yx_uz_vnzh_f", "yx_p_vnzh_f"),
    photo("yx_uz_vnzh_b", "yx_p_vnzh_b"),
    photo("yx_uz_vnzh_pass", "yx_p_vnzh_pass"),
    textField("yx_col_inn", "yx_p_inn", "inn"),
    textField("yx_col_snils", "yx_p_snils", "snils"),
  ];
  if (!yx.regAmina) {
    L.push(choice("ram_vnzh", "yx_p_ram_choice"));
    return L;
  }
  if (yx.regAmina === "reg") {
    L.push(
      photo("yx_uz_vnzh_reg_f", "yx_p_reg_f"),
      photo("yx_uz_vnzh_reg_b", "yx_p_reg_b")
    );
  } else {
    L.push(photo("yx_uz_vnzh_amina", "yx_p_amina"));
  }
  L.push(photo("yx_uz_vnzh_mig", "yx_p_mig"), ...tailRfAfterMig(yx));
  return L;
}

function lineUzStudent(yx) {
  const L = [
    photo("yx_uz_st_bilet", "yx_p_st_bilet"),
    photo("yx_uz_st_spravka", "yx_p_st_spravka"),
    photo("yx_uz_st_pass", "yx_p_st_pass"),
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
  if (yx.kzDocKind === "pass") {
    L.push(photo("yx_kz_pass_face", "yx_p_kz_pass_face"));
  } else {
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
  const L = [photo("yx_tm_pass", "yx_p_tm_pass")];
  if (!tmVisaKind) {
    L.push(choice("visa_kind", "yx_ask_tm_visa"));
    return L;
  }
  const tmTail = [];
  if (!yx || !yx.useRegisteredPhone) {
    tmTail.push(textField("yx_col_tm_contact", "yx_p_contact_phone", "phone"));
  }
  L.push(
    photo("yx_tm_visa", "yx_p_tm_visa"),
    pdfOrPhoto("yx_tm_amina_or_reg", "yx_p_tm_amina_or_reg"),
    photo("yx_tm_mig", "yx_p_mig"),
    ...tmTail,
    ...tailRekvizitCard16()
  );
  return L;
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

export function buildYxLine(yx) {
  if (!yx?.citizen) return [];
  if (isYxCitizenUzTjGroup(yx.citizen)) {
    if (yx.uzDocKind === "patent") return lineUzPatent(yx);
    if (yx.uzDocKind === "vnzh") return lineUzVnzh(yx);
    if (yx.uzDocKind === "student") return lineUzStudent(yx);
    return [];
  }
  if (isYxCitizenKzKgGroup(yx.citizen)) return lineKzKg(yx);
  if (yx.citizen === "rf" || isYxCitizenOther(yx.citizen)) return lineRf(yx);
  if (yx.citizen === "tm") return lineTm(yx);
  return [];
}

export function getYandexUiState(yx, completedLen, td) {
  if (td?.yx_staged_doc) return { ui: "staged" };
  if (!yx?.service) return { ui: "none" };
  if (!yx.cityKey) return { ui: "city" };
  if (!yx.citizen) return { ui: "citizen" };
  if (isYxCitizenUzTjGroup(yx.citizen) && !yx.uzDocKind) return { ui: "uz_doc" };
  if (isYxCitizenKzKgGroup(yx.citizen) && !yx.kzDocKind) return { ui: "kz_doc" };
  const line = buildYxLine(yx);
  if (line.length === 0) {
    if (isYxCitizenUzTjGroup(yx.citizen)) return { ui: "uz_doc" };
    return { ui: "none" };
  }
  if (completedLen >= line.length) return { ui: "done" };
  return { ui: "step", step: line[completedLen] };
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
