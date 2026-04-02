import { Markup } from "telegraf";
import {
  categoryLabelForLang,
  faqItems,
  normalizeBKLang,
  summaryTitle,
  tBK,
} from "./i18n.js";

export function languagePickKb() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇿 O‘zbek", "bk_L:uz"),
      Markup.button.callback("🇷🇺 Русский", "bk_L:ru"),
    ],
    [
      Markup.button.callback("🇹🇯 Тоҷикӣ", "bk_L:tg"),
      Markup.button.callback("🇰🇬 Кыргызча", "bk_L:ky"),
    ],
  ]);
}

export function mainMenuReply(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.keyboard([
    [tBK(lg, "btn_in_park")],
    [tBK(lg, "btn_not_in_park")],
    [tBK(lg, "btn_support")],
  ])
    .resize()
    .persistent();
}

export function onboardingReplyThermal(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.keyboard([
    [tBK(lg, "btn_therm_yes"), tBK(lg, "btn_therm_no")],
    [tBK(lg, "btn_support")],
  ])
    .resize()
    .persistent();
}

export function supportOnlyReply(lang) {
  return Markup.keyboard([[tBK(normalizeBKLang(lang), "btn_support")]])
    .resize()
    .persistent();
}

export const CITY_ROWS = [
  ["Москва", "СПб", "Волгоград"],
  ["Воронеж"],
  ["Казань", "Краснодар"],
  ["Н. Новгород", "Новосибирск"],
  ["Омск", "Оренбург", "Пермь"],
  ["Ростов-на-Дону", "Самара"],
  ["Саратов", "Тула", "Тюмень"],
  ["Челябинск", "Ярославль"],
];

export const CITY_FLAT = CITY_ROWS.flat();

export function cityInline(lang) {
  const lg = normalizeBKLang(lang);
  const rows = CITY_ROWS.map((r) =>
    r.map((name) => {
      const idx = CITY_FLAT.indexOf(name);
      return Markup.button.callback(name, `bk_G:${idx}`);
    })
  );
  rows.push([
    Markup.button.callback(tBK(lg, "city_other_btn"), "bk_G:t"),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function cityByIndex(i) {
  const n = Number(i);
  if (!Number.isInteger(n) || n < 0 || n >= CITY_FLAT.length) return null;
  return CITY_FLAT[n];
}

export function categoryInline(lang) {
  const lg = normalizeBKLang(lang);
  const keys = ["car", "truck", "moto", "bike", "foot"];
  return Markup.inlineKeyboard(
    keys.map((k) => [
      Markup.button.callback(
        categoryLabelForLang(lg, k),
        `bk_C:${k}`
      ),
    ])
  );
}

export function citizenshipInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "cit_yes"), "bk_Z:1"),
      Markup.button.callback(tBK(lg, "cit_no"), "bk_Z:0"),
    ],
  ]);
}

export function editOnly(lang, cb) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(normalizeBKLang(lang), "edit_btn"), cb)],
  ]);
}

export function continueInline(lang, step) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "btn_continue"), `bk_D:cont:${step}`)],
  ]);
}

export function passportConfirmKb(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "btn_continue"), "bk_D:cont:passport")],
    [Markup.button.callback(tBK(normalizeBKLang(lang), "edit_btn"), "bk_E:passport")],
  ]);
}

export function faqMenu(lang) {
  const lg = normalizeBKLang(lang);
  const items = faqItems(lg);
  const rows = items.map((item) => [
    Markup.button.callback(item.q, `bk_F:${item.id}`),
  ]);
  rows.push([Markup.button.callback(tBK(lg, "faq_back"), "bk_F:back")]);
  return Markup.inlineKeyboard(rows);
}

export function reviewKb(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "submit_btn"), "bk_R:send")],
    [
      Markup.button.callback(`📱 ${summaryTitle(lg, "phone")}`, "bk_R:e:phone"),
      Markup.button.callback(`🚗 ${summaryTitle(lg, "category")}`, "bk_R:e:cat"),
    ],
    [
      Markup.button.callback(`🏙 ${summaryTitle(lg, "city")}`, "bk_R:e:city"),
      Markup.button.callback(`🪪 ${summaryTitle(lg, "citizenship")}`, "bk_R:e:cit"),
    ],
    [Markup.button.callback(`🛂 ${summaryTitle(lg, "passport")}`, "bk_R:e:passport")],
  ]);
}
