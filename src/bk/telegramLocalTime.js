import { tBK } from "./i18n.js";

/**
 * Telegram `language_code` (va ixtiyoriy `xx-YY` mintaqasi) bo‘yicha taxminiy IANA vaqt zonasi.
 * Server vaqti emas — foydalanuvchi interfeysi tiliga mos taxmin (GPS yo‘q).
 */
const LANG_TO_TZ = {
  uz: "Asia/Tashkent",
  tg: "Asia/Dushanbe",
  tj: "Asia/Dushanbe",
  ky: "Asia/Bishkek",
  kk: "Asia/Almaty",
  tk: "Asia/Ashgabat",
  ru: "Europe/Moscow",
  uk: "Europe/Kyiv",
  be: "Europe/Minsk",
  ka: "Asia/Tbilisi",
  hy: "Asia/Yerevan",
  az: "Asia/Baku",
  en: "Europe/Moscow",
};

/** ISO 3166-1 alpha-2 (ikkinchi qism) → zona */
const REGION_TO_TZ = {
  uz: "Asia/Tashkent",
  tj: "Asia/Dushanbe",
  kz: "Asia/Almaty",
  kg: "Asia/Bishkek",
  tm: "Asia/Ashgabat",
  ru: "Europe/Moscow",
  ua: "Europe/Kyiv",
  by: "Europe/Minsk",
  ge: "Asia/Tbilisi",
  am: "Asia/Yerevan",
  az: "Asia/Baku",
  gb: "Europe/London",
  us: "America/New_York",
};

export function approxTimeZoneForTelegramUser(from) {
  const raw = String(from?.language_code || "").toLowerCase();
  const parts = raw.split(/[-_]/).filter(Boolean);
  const region = parts[1];
  if (region && REGION_TO_TZ[region]) return REGION_TO_TZ[region];
  const lang = parts[0];
  if (lang && LANG_TO_TZ[lang]) return LANG_TO_TZ[lang];
  return "Europe/Moscow";
}

export function localHourInZone(timeZone, d = new Date()) {
  try {
    const h = parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(d),
      10
    );
    return Number.isFinite(h) ? h : 12;
  } catch {
    return localHourInZone("Europe/Moscow", d);
  }
}

/** Soat `timeZone` bo‘yicha (0–23). */
export function hourForTelegramUser(from, d = new Date()) {
  return localHourInZone(approxTimeZoneForTelegramUser(from), d);
}

/**
 * Ruscha kun bo‘limi salomi (tanlangan zonadagi mahalliy soat bo‘yicha).
 * 05–11 утро, 12–17 день, 18–22 вечер, qolganlari түн.
 */
export function russianTimeOfDayGreeting(hour) {
  if (hour >= 5 && hour <= 11) return "Доброе утро!";
  if (hour >= 12 && hour <= 17) return "Добрый день!";
  if (hour >= 18 && hour <= 22) return "Добрый вечер!";
  return "Доброй ночи!";
}

/** /start: til tanlashdan oldin (har doim ruscha blok). */
export function buildBkStartLanguagePrompt(from, d = new Date()) {
  const hour = hourForTelegramUser(from, d);
  const greet = russianTimeOfDayGreeting(hour);
  return `${greet}\n\n${tBK("ru", "start_thanks_courier")}\n\n${tBK("ru", "start_pick_language")}`;
}
