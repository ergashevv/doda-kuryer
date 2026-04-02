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
          bk.truckLoaders != null
            ? `${tBK(lg, "group_label_truck_loaders")} ${
                [0, 1, 2].includes(bk.truckLoaders)
                  ? tBK(lg, `group_truck_loader_word_${bk.truckLoaders}`)
                  : bk.truckLoaders
              }`
            : `${tBK(lg, "group_label_truck_loaders")} ${dash}`,
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
            ? [`${tBK(lg, "group_label_bike_inn")} ${bk.inn || dash}`]
            : []),
          typeof bk.hasThermal === "boolean"
            ? `${tBK(lg, "group_label_bike_thermal")} ${
                bk.hasThermal ? y : tBK(lg, "summary_thermal_no")
              }`
            : `${tBK(lg, "group_label_bike_thermal")} ${dash}`,
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
