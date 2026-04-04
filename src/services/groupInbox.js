import fs from "node:fs";
import { Input } from "telegraf";
import { getPool } from "../db.js";
import { normalizeBKLang, tBK } from "../bk/i18n.js";

function cap(s, max = 1024) {
  if (!s || s.length <= max) return s || "";
  return `${s.slice(0, max - 3)}...`;
}

function localeForLang(lg) {
  const m = { uz: "uz-UZ", ru: "ru-RU", tg: "tg-TJ", ky: "ky-KG" };
  return m[lg] || "ru-RU";
}

export function getDocsGroupChatId() {
  const raw = (process.env.DOCS_GROUP_ID || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function docCaptionTitle(lang, docKey) {
  const k = `group_caption_${docKey}`;
  const t = tBK(lang, k);
  return t === k ? tBK(lang, "group_caption_passport") : t;
}

/** Rasm ostida faqat [i/n] + номи; исм/username анкета блогида */
function formatDocCaption(index, total, docKey, profile) {
  const lg = normalizeBKLang(profile?.language);
  const title = docCaptionTitle(lg, docKey);
  return cap(`[${index}/${total}] ${title}`);
}

function formatAnketaBlock(profile) {
  const lg = normalizeBKLang(profile?.language);
  const dash = tBK(lg, "group_value_dash");
  const bk = profile?.session_data?.bk || {};
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    dash;
  const un = profile.username ? `@${profile.username}` : dash;
  const phone = profile.phone || dash;
  const city = profile.city || dash;
  const category = bk.categoryLabel || dash;
  const y = tBK(lg, "summary_yes");
  const no = tBK(lg, "summary_no");
  const rf =
    typeof bk.rfCitizen === "boolean" ? (bk.rfCitizen ? y : no) : dash;

  const lines = [
    tBK(lg, "group_separator"),
    tBK(lg, "group_anketa_heading"),
    tBK(lg, "group_separator"),
    `${tBK(lg, "group_label_name")} ${name}`,
    `${tBK(lg, "group_label_telegram")} ${un}`,
    `${tBK(lg, "group_label_phone")} ${phone}`,
    "",
    `${tBK(lg, "group_label_category")} ${category}`,
    ...(bk.categoryKey === "car" && typeof bk.vehicleRf === "boolean"
      ? [
          `${tBK(lg, "group_label_vehicle")} ${
            bk.vehicleRf
              ? tBK(lg, "summary_vehicle_rf")
              : tBK(lg, "summary_vehicle_foreign")
          }`,
        ]
      : []),
    `${tBK(lg, "group_label_city")} ${city}`,
    `${tBK(lg, "group_label_citizenship")} ${rf}`,
    ...(bk.categoryKey === "truck"
      ? [
          "",
          typeof bk.truckDimensionLabel === "string" && bk.truckDimensionLabel
            ? `${tBK(lg, "group_label_truck_dims")} ${bk.truckDimensionLabel}`
            : `${tBK(lg, "group_label_truck_dims")} ${dash}`,
          bk.truckPayloadKg != null && bk.truckPayloadKg !== ""
            ? `${tBK(lg, "group_label_truck_payload")} ${tBK(lg, "group_truck_kg", {
                value: new Intl.NumberFormat(localeForLang(lg)).format(
                  Number(bk.truckPayloadKg)
                ),
              })}`
            : `${tBK(lg, "group_label_truck_payload")} ${dash}`,
          typeof bk.truckBranding === "boolean"
            ? `${tBK(lg, "group_label_truck_branding")} ${
                bk.truckBranding ? y : no
              }`
            : `${tBK(lg, "group_label_truck_branding")} ${dash}`,
        ]
      : []),
    ...(bk.categoryKey === "bike"
      ? [
          "",
          typeof bk.selfEmployed === "boolean"
            ? `${tBK(lg, "group_label_bike_self")} ${
                bk.selfEmployed ? y : no
              }`
            : `${tBK(lg, "group_label_bike_self")} ${dash}`,
          ...(bk.selfEmployed === true
            ? bk.rfCitizen === true
              ? [
                  `${tBK(lg, "group_label_bike_smz_phone")} ${bk.moyNalogPhone || dash}`,
                  `${tBK(lg, "group_label_bike_smz_address")} ${bk.smzAddress || dash}`,
                ]
              : [`${tBK(lg, "group_label_bike_inn")} ${bk.inn || dash}`]
            : []),
        ]
      : []),
  ];
  return lines.join("\n");
}

function formatDocsIntroBlock(expectedCount, lang) {
  const lg = normalizeBKLang(lang);
  if (expectedCount <= 0) {
    return [
      "",
      tBK(lg, "group_separator"),
      tBK(lg, "group_docs_heading"),
      tBK(lg, "group_separator"),
      tBK(lg, "group_docs_empty"),
    ].join("\n");
  }
  return [
    "",
    tBK(lg, "group_separator"),
    tBK(lg, "group_docs_heading"),
    tBK(lg, "group_separator"),
    tBK(lg, "group_docs_intro", { count: String(expectedCount) }),
  ].join("\n");
}

function formatBankBlock(bankText, lang) {
  const lg = normalizeBKLang(lang);
  return cap(
    [
      tBK(lg, "group_separator"),
      tBK(lg, "group_bank_heading"),
      tBK(lg, "group_separator"),
      bankText,
    ].join("\n\n")
  );
}

function formatFooter(lang) {
  const lg = normalizeBKLang(lang);
  return tBK(lg, "group_footer_done");
}

/**
 * Rasmlar/hujjatlar: completed_docs tartibi bo‘yicha DB dan yuklanadi.
 */
export async function notifyGroupFullSubmission(telegram, profile) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile) return;

  const lg = normalizeBKLang(profile.language);
  const uid = profile.telegram_id;
  const td = profile.session_data || {};
  const completedDocs = td.completed_docs || [];
  const bankText = td.collected?.bank;
  const photoDocs = completedDocs.filter((d) => d !== "bank");

  try {
    const pool = getPool();
    let rows = [];
    if (photoDocs.length > 0) {
      const r = await pool.query(
        `SELECT doc_type, local_path FROM uploaded_files
         WHERE telegram_user_id = $1 AND doc_type = ANY($2::text[])
         ORDER BY array_position($2::text[], doc_type::text)`,
        [uid, photoDocs]
      );
      rows = r.rows;
    }

    const missingOnDisk = rows.filter((r) => !r.local_path || !fs.existsSync(r.local_path));
    if (missingOnDisk.length > 0) {
      console.warn(
        "[groupInbox] missing files on disk:",
        missingOnDisk.map((r) => r.doc_type).join(", ")
      );
    }

    const header = [
      tBK(lg, "group_header_new"),
      "",
      formatAnketaBlock(profile),
      formatDocsIntroBlock(
        rows.filter((r) => r.local_path && fs.existsSync(r.local_path)).length,
        lg
      ),
    ].join("\n");
    await telegram.sendMessage(chatId, cap(header));

    const validRows = rows.filter((r) => r.local_path && fs.existsSync(r.local_path));
    const total = validRows.length;
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const caption = formatDocCaption(i + 1, total, row.doc_type, profile);
      const lower = row.local_path.toLowerCase();
      const asPdf = lower.endsWith(".pdf");
      if (asPdf) {
        await telegram.sendDocument(chatId, Input.fromLocalFile(row.local_path), {
          caption,
        });
      } else {
        await telegram.sendPhoto(chatId, Input.fromLocalFile(row.local_path), {
          caption,
        });
      }
    }

    if (completedDocs.includes("bank") && bankText) {
      await telegram.sendMessage(chatId, formatBankBlock(bankText, lg));
    }

    await telegram.sendMessage(chatId, formatFooter(lg));
  } catch (e) {
    console.error("[groupInbox] notifyGroupFullSubmission:", e?.message || e);
  }
}

function formatYandexAnketaBlock(profile) {
  const lg = normalizeBKLang(profile?.language);
  const dash = tBK(lg, "group_value_dash");
  const yx = profile?.session_data?.yx || {};
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    dash;
  const un = profile.username ? `@${profile.username}` : dash;
  const phone = profile.phone || dash;
  const svc =
    yx.service === "yandex_lavka"
      ? tBK(lg, "yx_btn_lavka")
      : yx.service === "yandex_eda"
        ? tBK(lg, "yx_btn_eats")
        : dash;
  const city =
    yx.cityKey === "msk"
      ? tBK(lg, "yx_city_msk")
      : yx.cityKey === "spb"
        ? tBK(lg, "yx_city_spb")
        : dash;
  const citMap = {
    uz: "yx_cit_uz",
    tj: "yx_cit_tj",
    kz: "yx_cit_kz",
    kg: "yx_cit_kg",
    uz_tj: "yx_cit_uz_tj",
    kz_kg: "yx_cit_kz_kg",
    rf: "yx_cit_rf",
    tm: "yx_cit_tm",
    other: "yx_cit_other",
  };
  const citizen =
    yx.citizen && citMap[yx.citizen] ? tBK(lg, citMap[yx.citizen]) : yx.citizen || dash;

  const lines = [
    "ANKETA",
    `${tBK(lg, "group_label_name")} ${name}`,
    `${tBK(lg, "group_label_telegram")} ${un}`,
    `${tBK(lg, "group_label_phone")} ${phone}`,
    `${tBK(lg, "group_label_yandex_service")} ${svc}`,
    `${tBK(lg, "group_label_yandex_city")} ${city}`,
    `${tBK(lg, "group_label_yandex_citizen")} ${citizen}`,
  ];
  if (yx.uzDocKind) {
    lines.push(
      `${tBK(lg, "group_label_yandex_uzdoc")} ${tBK(lg, `yx_doc_${yx.uzDocKind}`)}`
    );
  }
  if (yx.kzDocKind) {
    lines.push(
      `${tBK(lg, "group_label_yandex_kzdoc")} ${tBK(lg, yx.kzDocKind === "pass" ? "yx_kz_pass" : "yx_kz_id")}`
    );
  }
  if (yx.tmVisaKind) {
    lines.push(
      `${tBK(lg, "group_label_yandex_tmvisa")} ${tBK(lg, yx.tmVisaKind === "work" ? "yx_tm_work" : "yx_tm_study")}`
    );
  }
  return lines.join("\n");
}

function yandexDocPromptKey(docType) {
  const map = {
    yx_uz_pat_pass: "yx_p_uz_pat_pass",
    yx_uz_pat_front: "yx_p_uz_pat_front",
    yx_uz_pat_back: "yx_p_uz_pat_back",
    yx_uz_pat_reg_f: "yx_p_reg_f",
    yx_uz_pat_reg_b: "yx_p_reg_b",
    yx_uz_pat_amina: "yx_p_amina",
    yx_uz_pat_mig: "yx_p_mig",
    yx_uz_pat_pay_ph: "yx_p_pay_ph",
    yx_uz_pat_pay_file: "yx_p_pay_file",
    yx_uz_vnzh_f: "yx_p_vnzh_f",
    yx_uz_vnzh_b: "yx_p_vnzh_b",
    yx_uz_vnzh_mig: "yx_p_mig",
    yx_uz_st_bilet: "yx_p_st_bilet",
    yx_uz_st_spravka: "yx_p_st_spravka",
    yx_uz_st_pass: "yx_p_st_pass",
    yx_uz_st_reg_f: "yx_p_reg_f",
    yx_uz_st_reg_b: "yx_p_reg_b",
    yx_uz_st_amina: "yx_p_amina",
    yx_uz_st_mig: "yx_p_mig",
    yx_kz_pass_face: "yx_p_kz_pass_face",
    yx_kz_id_f: "yx_p_kz_id_f",
    yx_kz_id_b: "yx_p_kz_id_b",
    yx_kz_mig: "yx_p_mig",
    yx_kz_reg_f: "yx_p_reg_f",
    yx_kz_reg_b: "yx_p_reg_b",
    yx_kz_amina: "yx_p_amina",
    yx_rf_pass_face: "yx_p_rf_pass_face",
    yx_rf_pass_prop: "yx_p_rf_pass_prop",
    yx_tm_pass: "yx_p_tm_pass",
    yx_tm_visa: "yx_p_tm_visa",
    yx_tm_reg_f: "yx_p_reg_f",
    yx_tm_reg_b: "yx_p_reg_b",
    yx_tm_amina: "yx_p_amina",
    yx_tm_mig: "yx_p_mig",
  };
  return map[docType] || null;
}

function formatYandexDocCaption(index, total, docKey, profile) {
  const lg = normalizeBKLang(profile?.language);
  const promptKey = yandexDocPromptKey(docKey);
  let title = promptKey ? tBK(lg, promptKey) : tBK(lg, "group_caption_yx_generic");
  if (!title || title === promptKey) {
    title = tBK(lg, "group_caption_yx_generic");
  }
  title = String(title).replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  return cap(`[${index}/${total}] ${docKey} — ${title}`);
}

function formatYandexTextFieldsBlock(profile, lang) {
  const lg = normalizeBKLang(lang);
  const coll = profile?.session_data?.collected || {};
  const parts = [];
  for (const [k, v] of Object.entries(coll)) {
    if (k.startsWith("yx_col_") && v) {
      const lk = `yx_lbl_${k}`;
      const lbl = tBK(lg, lk);
      const label = lbl === lk ? k : lbl;
      parts.push(`${label}: ${v}`);
    }
  }
  if (!parts.length) return "";
  return ["TEXT", parts.join("\n")].join("\n");
}

/** Яндекс Лавка / Еда: анкета + вложения yx_* по порядку completed_yx */
export async function notifyGroupYandexSubmission(telegram, profile) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile) return;

  const lg = normalizeBKLang(profile.language);
  const uid = profile.telegram_id;
  const td = profile.session_data || {};
  const order = (td.completed_yx || []).filter(
    (x) => typeof x === "string" && x.startsWith("yx_")
  );

  try {
    const pool = getPool();
    let rows = [];
    if (order.length > 0) {
      const r = await pool.query(
        `SELECT doc_type, local_path FROM uploaded_files
         WHERE telegram_user_id = $1 AND doc_type = ANY($2::text[])
         ORDER BY array_position($2::text[], doc_type::text)`,
        [uid, order]
      );
      rows = r.rows;
    }

    const docsCount = rows.filter((r) => r.local_path && fs.existsSync(r.local_path)).length;
    const header = [
      tBK(lg, "group_header_yandex"),
      "",
      formatYandexAnketaBlock(profile),
      "",
      `DOKUMENTI: ${docsCount}`,
    ].join("\n");
    await telegram.sendMessage(chatId, cap(header));

    const validRows = rows.filter((r) => r.local_path && fs.existsSync(r.local_path));
    const total = validRows.length;
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const caption = formatYandexDocCaption(i + 1, total, row.doc_type, profile);
      const lower = row.local_path.toLowerCase();
      if (lower.endsWith(".mp4")) {
        await telegram.sendVideo(chatId, Input.fromLocalFile(row.local_path), {
          caption,
        });
      } else if (lower.endsWith(".pdf")) {
        await telegram.sendDocument(chatId, Input.fromLocalFile(row.local_path), {
          caption,
        });
      } else {
        await telegram.sendPhoto(chatId, Input.fromLocalFile(row.local_path), {
          caption,
        });
      }
    }

    const textBlock = formatYandexTextFieldsBlock(profile, lg);
    if (textBlock) {
      await telegram.sendMessage(chatId, cap(textBlock));
    }

    await telegram.sendMessage(chatId, formatFooter(lg));
  } catch (e) {
    console.error("[groupInbox] notifyGroupYandexSubmission:", e?.message || e);
  }
}

