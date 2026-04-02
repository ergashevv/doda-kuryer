import fs from "node:fs";
import { Input } from "telegraf";
import { docLabel } from "../i18n.js";
import { getPool } from "../db.js";

/** To‘liq nomlar — har bir rasm ostida tushunarli */
const DOC_TITLE_RU = {
  license: "Водительское удостоверение (ВУ)",
  sts: "СТС — свидетельство о регистрации ТС",
  tech_passport_front: "Техпаспорт иностранного ТС — лицевая сторона",
  tech_passport_back: "Техпаспорт иностранного ТС — оборот",
  passport: "Паспорт (разворот)",
  bank: "Банковские реквизиты",
};

function cap(s, max = 1024) {
  if (!s || s.length <= max) return s || "";
  return `${s.slice(0, max - 3)}...`;
}

export function getDocsGroupChatId() {
  const raw = (process.env.DOCS_GROUP_ID || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function docTitleRu(docKey) {
  return DOC_TITLE_RU[docKey] || docLabel("ru", docKey);
}

function contactLine(profile) {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "";
  const un = profile.username ? `@${profile.username}` : "";
  if (name && un) return `${name} · ${un}`;
  if (name) return name;
  if (un) return un;
  return "—";
}

/** Guruh uchun: faqat operatorga kerakli, ID va ichki kodlarsiz */
function formatAnketaBlock(profile) {
  const bk = profile?.session_data?.bk || {};
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "—";
  const un = profile.username ? `@${profile.username}` : "—";
  const phone = profile.phone || "—";
  const city = profile.city || "—";
  const category = bk.categoryLabel || "—";
  const rf =
    typeof bk.rfCitizen === "boolean" ? (bk.rfCitizen ? "Да" : "Нет") : "—";

  const lines = [
    "━━━━━━━━━━━━━━━━━━━━",
    "📋 АНКЕТА",
    "━━━━━━━━━━━━━━━━━━━━",
    `👤 Имя: ${name}`,
    `📱 Telegram: ${un}`,
    `📞 Телефон: ${phone}`,
    "",
    `🚗 Класс доставки: ${category}`,
    ...(bk.categoryKey === "car" && typeof bk.vehicleRf === "boolean"
      ? [
          `🚙 Учёт ТС: ${bk.vehicleRf ? "РФ — СТС" : "Иностранное — техпаспорт"}`,
        ]
      : []),
    `🏙 Город: ${city}`,
    `🪪 Гражданство РФ: ${rf}`,
    ...(bk.categoryKey === "truck"
      ? [
          "",
          typeof bk.truckDimensionLabel === "string" && bk.truckDimensionLabel
            ? `📐 Габариты: ${bk.truckDimensionLabel}`
            : `📐 Габариты: —`,
          bk.truckPayloadKg != null && bk.truckPayloadKg !== ""
            ? `⚖️ Грузоподъемность: ${new Intl.NumberFormat("ru-RU").format(
                Number(bk.truckPayloadKg)
              )} кг`
            : `⚖️ Грузоподъемность: —`,
          bk.truckLoaders != null
            ? `👷 Грузчики: ${[0, 1, 2].includes(bk.truckLoaders) ? ["ни одного", "один", "два"][bk.truckLoaders] : bk.truckLoaders}`
            : `👷 Грузчики: —`,
          typeof bk.truckBranding === "boolean"
            ? `🏷 Оклейка / брендинг: ${bk.truckBranding ? "да" : "нет"}`
            : `🏷 Оклейка / брендинг: —`,
        ]
      : []),
    ...(bk.categoryKey === "bike"
      ? [
          "",
          typeof bk.selfEmployed === "boolean"
            ? `🧾 Самозанятость: ${bk.selfEmployed ? "да" : "нет"}`
            : `🧾 Самозанятость: —`,
          ...(bk.selfEmployed === true
            ? [`#️⃣ ИНН: ${bk.inn || "—"}`]
            : []),
          typeof bk.hasThermal === "boolean"
            ? `📦 Вело термокороб: ${
                bk.hasThermal ? "да" : "нет, необходимо приобрести"
              }`
            : `📦 Вело термокороб: —`,
        ]
      : []),
  ];
  return lines.join("\n");
}

function formatDocsIntroBlock(expectedCount) {
  if (expectedCount <= 0) {
    return [
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "📎 ДОКУМЕНТЫ",
      "━━━━━━━━━━━━━━━━━━━━",
      "Файлы по заявке не прикреплены (проверьте загрузки).",
    ].join("\n");
  }
  const lines = [
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "📎 ДОКУМЕНТЫ",
    "━━━━━━━━━━━━━━━━━━━━",
    `Вложений: ${expectedCount} (ниже — по порядку, как в анкете).`,
  ];
  return lines.join("\n");
}

/** Faqat tartib raqami va hujjat nomi + qisqa kontakt (ID yo‘q) */
function formatDocCaption(index, total, docKey, profile) {
  const title = docTitleRu(docKey);
  const who = contactLine(profile);
  return cap([`[${index}/${total}] ${title}`, "", who].join("\n"));
}

function formatBankBlock(bankText) {
  return cap(
    [
      "━━━━━━━━━━━━━━━━━━━━",
      "🏦 БАНК (текст из заявки)",
      "━━━━━━━━━━━━━━━━━━━━",
      bankText,
    ].join("\n\n")
  );
}

function formatFooter() {
  return "━━━━━━━━━━━━━━━━━━━━\n✅ Заявка принята, все файлы получены\n━━━━━━━━━━━━━━━━━━━━";
}

/**
 * Rasmlar/hujjatlar: completed_docs tartibi bo‘yicha DB dan yuklanadi.
 * Diskda yo‘q fayl o‘tkazib yuboriladi (log).
 */
export async function notifyGroupFullSubmission(telegram, profile) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile) return;

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
      "🔔 Новая заявка · Doda taxi",
      "",
      formatAnketaBlock(profile),
      formatDocsIntroBlock(rows.filter((r) => r.local_path && fs.existsSync(r.local_path)).length),
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
      await telegram.sendMessage(chatId, formatBankBlock(bankText));
    }

    await telegram.sendMessage(chatId, formatFooter());
  } catch (e) {
    console.error("[groupInbox] notifyGroupFullSubmission:", e?.message || e);
  }
}
