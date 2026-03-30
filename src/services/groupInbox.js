import { Input } from "telegraf";
import { docLabel } from "../i18n.js";

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

function formatProfileBlock(profile) {
  const id = profile.telegram_id;
  const un = profile.username ? `@${profile.username}` : "—";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "—";
  const phone = profile.phone || "—";
  const city = profile.city || "—";
  const svc = SERVICE_RU[profile.service] || profile.service || "—";
  const trf = TARIFF_RU[profile.tariff] || profile.tariff || "—";
  return [
    `════════════════════`,
    `ID: ${id}`,
    `TG: ${un}`,
    `Имя: ${name}`,
    `Тел: ${phone}  |  Город: ${city}`,
    `Сервис: ${svc}  |  Тариф: ${trf}`,
    `════════════════════`,
  ].join("\n");
}

function docCaptionLine(docKey) {
  const ru = docLabel("ru", docKey);
  return `Документ: ${ru} (${docKey})`;
}

/** Har bir media uchun — ID va asosiy maydonlar (aralashmaslik uchun). */
function shortDocCaption(profile, docKey) {
  const id = profile.telegram_id;
  const un = profile.username ? `@${profile.username}` : "—";
  const phone = profile.phone || "—";
  const city = profile.city || "—";
  return [`[ID:${id}]`, docCaptionLine(docKey), `TG: ${un} | Тел: ${phone} | Город: ${city}`].join("\n");
}

/**
 * Yuklash boshlanganda — bitta foydalanuvchini boshqalardan ajratib ko‘rsatadi.
 */
export async function notifyGroupSessionStart(telegram, profile) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile) return;
  try {
    const body = [
      `▶ НАЧАЛО ЗАГРУЗКИ ДОКУМЕНТОВ`,
      formatProfileBlock(profile),
      `Дальше по одному сообщению — каждый файл с ID выше.`,
    ].join("\n");
    await telegram.sendMessage(chatId, cap(body));
  } catch (e) {
    console.error("[groupInbox] notifyGroupSessionStart:", e?.message || e);
  }
}

/**
 * Bitta hujjat (foto/fayl yoki bank matni).
 */
export async function notifyGroupDocReceived(telegram, profile, docKey, payload) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile || !payload) return;

  try {
    if (payload.bankText != null) {
      const text = [
        shortDocCaption(profile, docKey),
        "",
        "─── Банк (текст) ───",
        payload.bankText,
        "",
        formatProfileBlock(profile),
      ].join("\n");
      await telegram.sendMessage(chatId, cap(text));
      return;
    }

    const { localPath, mime } = payload;
    if (!localPath) return;

    const lower = localPath.toLowerCase();
    const asPdf = lower.endsWith(".pdf") || (mime && String(mime).includes("pdf"));
    const caption = cap(shortDocCaption(profile, docKey));

    if (asPdf) {
      await telegram.sendDocument(chatId, Input.fromLocalFile(localPath), { caption });
    } else {
      await telegram.sendPhoto(chatId, Input.fromLocalFile(localPath), { caption });
    }
  } catch (e) {
    console.error("[groupInbox] notifyGroupDocReceived:", e?.message || e);
  }
}

/**
 * Barcha hujjatlar yig‘ilganda.
 */
export async function notifyGroupSessionComplete(telegram, profile) {
  const chatId = getDocsGroupChatId();
  if (!chatId || !profile) return;
  try {
    const body = [`✅ ЗАГРУЗКА ЗАВЕРШЕНА (все документы)`, formatProfileBlock(profile)].join("\n\n");
    await telegram.sendMessage(chatId, cap(body));
  } catch (e) {
    console.error("[groupInbox] notifyGroupSessionComplete:", e?.message || e);
  }
}
