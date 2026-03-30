import fs from "node:fs";
import { Input } from "telegraf";
import { docLabel } from "../i18n.js";
import { getPool } from "../db.js";

const SERVICE_RU = {
  yandex_eda: "Яндекс Еда",
  yandex_lavka: "Яндекс Лавка",
  taximeter: "Таксометр (Экспресс) Парк",
};

const TARIFF_RU = {
  foot_bike: "Пешком / велосипед",
  car: "Авто",
  truck: "Грузовой",
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

function formatAdminProfile(profile) {
  const un = profile.username ? `@${profile.username}` : "—";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "—";
  const phone = profile.phone || "—";
  const city = profile.city || "—";
  const svc = SERVICE_RU[profile.service] || profile.service || "—";
  const trf = TARIFF_RU[profile.tariff] || profile.tariff || "—";
  return [
    `TG: ${un}`,
    `Имя: ${name}`,
    `Тел: ${phone}  |  Город: ${city}`,
    `Сервис: ${svc}  |  Тариф: ${trf}`,
  ].join("\n");
}

function docCaptionShort(docKey) {
  const ru = docLabel("ru", docKey);
  return `Документ: ${ru}`;
}

/**
 * Barcha hujjatlar yig‘ilgach — bitta «paket»: profil, keyin DB dagi fayllar tartibda, oxirida bank.
 * Yig‘ish davomida guruhga hech narsa yuborilmaydi.
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

    const header = [
      `✅ Новая заявка — все документы`,
      `──────────────`,
      formatAdminProfile(profile),
      `──────────────`,
      `Файлы ниже по порядку.`,
    ].join("\n");
    await telegram.sendMessage(chatId, cap(header));

    for (const row of rows) {
      if (!row.local_path || !fs.existsSync(row.local_path)) continue;
      const caption = cap(docCaptionShort(row.doc_type));
      const lower = row.local_path.toLowerCase();
      const asPdf = lower.endsWith(".pdf");
      if (asPdf) {
        await telegram.sendDocument(chatId, Input.fromLocalFile(row.local_path), { caption });
      } else {
        await telegram.sendPhoto(chatId, Input.fromLocalFile(row.local_path), { caption });
      }
    }

    if (completedDocs.includes("bank") && bankText) {
      await telegram.sendMessage(chatId, cap([`Банк (текст)`, bankText].join("\n\n")));
    }

    await telegram.sendMessage(chatId, `✅ Загрузка завершена`);
  } catch (e) {
    console.error("[groupInbox] notifyGroupFullSubmission:", e?.message || e);
  }
}
