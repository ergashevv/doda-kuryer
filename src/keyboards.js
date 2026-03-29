import { Markup } from "telegraf";
import { t } from "./i18n.js";

export function languageKb() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇿 O‘zbek", "lang_uz"),
      Markup.button.callback("🇷🇺 Русский", "lang_ru"),
    ],
    [
      Markup.button.callback("🇹🇯 Тоҷикӣ", "lang_tg"),
      Markup.button.callback("🇰🇬 Кыргызча", "lang_ky"),
    ],
  ]);
}

export function serviceKb(lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "service_yandex_eda"), "svc_eda")],
    [Markup.button.callback(t(lang, "service_yandex_lavka"), "svc_lavka")],
    [Markup.button.callback(t(lang, "service_taximeter"), "svc_tax")],
    [Markup.button.callback(t(lang, "back"), "act_back_lang")],
  ]);
}

export function tariffKb(lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "tariff_foot_bike"), "trf_fb")],
    [Markup.button.callback(t(lang, "tariff_car"), "trf_car")],
    [Markup.button.callback(t(lang, "tariff_truck"), "trf_truck")],
    [Markup.button.callback(t(lang, "back"), "act_back_svc")],
  ]);
}

export function startDocsKb(lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "start_upload"), "act_start")],
    [Markup.button.callback(t(lang, "back"), "act_back_tariff")],
  ]);
}

export function backOnlyKb(lang, backData = "act_back_collect") {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "back"), backData)],
  ]);
}
