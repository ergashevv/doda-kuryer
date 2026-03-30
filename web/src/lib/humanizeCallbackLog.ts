/** Eski chat log yozuvlari: `[callback] lang_uz` — bot endi to‘g‘ridan-to‘g‘ri matn yozadi; bu fayl tarixiy yozuvlarni ko‘rsatish uchun. */

export type CallbackLang = "uz" | "ru" | "tg" | "ky";

const SVC: Record<string, keyof CallbackStrings> = {
  svc_eda: "service_yandex_eda",
  svc_lavka: "service_yandex_lavka",
  svc_tax: "service_taximeter",
};

const TRF: Record<string, keyof CallbackStrings> = {
  trf_fb: "tariff_foot_bike",
  trf_car: "tariff_car",
  trf_truck: "tariff_truck",
};

type CallbackStrings = {
  lang_display_uz: string;
  lang_display_ru: string;
  lang_display_tg: string;
  lang_display_ky: string;
  cb_pick_lang: string;
  cb_pick_service: string;
  cb_pick_tariff: string;
  cb_act_start: string;
  cb_back_lang: string;
  cb_back_service: string;
  cb_back_tariff: string;
  cb_back_docs: string;
  cb_back_city: string;
  service_yandex_eda: string;
  service_yandex_lavka: string;
  service_taximeter: string;
  tariff_foot_bike: string;
  tariff_car: string;
  tariff_truck: string;
};

const STRINGS: Record<CallbackLang, CallbackStrings> = {
  uz: {
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пеша & 🚲 Велосипед",
    tariff_car: "🚗 Авто",
    tariff_truck: "🚚 Юк машинаси",
    lang_display_uz: "O‘zbek",
    lang_display_ru: "Русский",
    lang_display_tg: "Тоҷикӣ",
    lang_display_ky: "Кыргызча",
    cb_pick_lang: "Тил танланди: {lang}",
    cb_pick_service: "Сервис: {name}",
    cb_pick_tariff: "Тариф: {name}",
    cb_act_start: "Босилди: «Юклашни бошлаш»",
    cb_back_lang: "Орқага — тил танлаш",
    cb_back_service: "Орқага — сервис",
    cb_back_tariff: "Орқага — тариф",
    cb_back_docs: "Орқага — олдинги ҳужжат",
    cb_back_city: "Орқага — шаҳар киритиш",
  },
  ru: {
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пешком & 🚲 Велосипед",
    tariff_car: "🚗 Авто",
    tariff_truck: "🚚 Грузовой",
    lang_display_uz: "Узбекский",
    lang_display_ru: "Русский",
    lang_display_tg: "Таджикский",
    lang_display_ky: "Кыргызский",
    cb_pick_lang: "Выбран язык: {lang}",
    cb_pick_service: "Сервис: {name}",
    cb_pick_tariff: "Тариф: {name}",
    cb_act_start: "Нажато: «Начать загрузку»",
    cb_back_lang: "«Назад» — выбор языка",
    cb_back_service: "«Назад» — сервис",
    cb_back_tariff: "«Назад» — тариф",
    cb_back_docs: "«Назад» — предыдущий документ",
    cb_back_city: "«Назад» — ввод города",
  },
  tg: {
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пиёда & 🚲 Дучарха",
    tariff_car: "🚗 Мошин",
    tariff_truck: "🚚 Боркаш",
    lang_display_uz: "Ӯзбекӣ",
    lang_display_ru: "Русӣ",
    lang_display_tg: "Тоҷикӣ",
    lang_display_ky: "Қирғизӣ",
    cb_pick_lang: "Забон интихоб шуд: {lang}",
    cb_pick_service: "Хизматрасонӣ: {name}",
    cb_pick_tariff: "Тариф: {name}",
    cb_act_start: "Пахш шуд: «Оғози боргирӣ»",
    cb_back_lang: "Бозгашт — интихоби забон",
    cb_back_service: "Бозгашт — хизмат",
    cb_back_tariff: "Бозгашт — тариф",
    cb_back_docs: "Бозгашт — ҳуҷҷати қаблӣ",
    cb_back_city: "Бозгашт — вориди шаҳр",
  },
  ky: {
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Жөө & 🚲 Велосипед",
    tariff_car: "🚗 Унаа",
    tariff_truck: "🚚 Жүк ташуучу",
    lang_display_uz: "Өзбекче",
    lang_display_ru: "Орусча",
    lang_display_tg: "Тажикче",
    lang_display_ky: "Кыргызча",
    cb_pick_lang: "Тил тандалды: {lang}",
    cb_pick_service: "Кызмат: {name}",
    cb_pick_tariff: "Тариф: {name}",
    cb_act_start: "Басылды: «Жүктөөнү баштоо»",
    cb_back_lang: "Артка — тил тандоо",
    cb_back_service: "Артка — кызмат",
    cb_back_tariff: "Артка — тариф",
    cb_back_docs: "Артка — мурунку документ",
    cb_back_city: "Артка — шаар киргизүү",
  },
};

function normalizeLang(lang: string | null | undefined): CallbackLang {
  if (lang == null || typeof lang !== "string") return "uz";
  const l = lang.trim().toLowerCase();
  if (l === "uz" || l === "ru" || l === "tg" || l === "ky") return l;
  return "uz";
}

function t(lg: CallbackLang, key: keyof CallbackStrings): string {
  return STRINGS[lg][key];
}

function fmt(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

function describeCallbackData(data: string, lang: CallbackLang): string {
  const lg = lang;
  if (data.startsWith("lang_")) {
    const code = data.replace("lang_", "").toLowerCase();
    if (!["uz", "ru", "tg", "ky"].includes(code)) return data;
    const langKey = `lang_display_${code}` as keyof CallbackStrings;
    const langName = t(lg, langKey);
    return fmt(t(lg, "cb_pick_lang"), { lang: langName });
  }
  const svcKey = SVC[data];
  if (svcKey) {
    return fmt(t(lg, "cb_pick_service"), { name: t(lg, svcKey) });
  }
  const trfKey = TRF[data];
  if (trfKey) {
    return fmt(t(lg, "cb_pick_tariff"), { name: t(lg, trfKey) });
  }
  if (data === "act_start") return t(lg, "cb_act_start");
  if (data === "act_back_lang") return t(lg, "cb_back_lang");
  if (data === "act_back_svc") return t(lg, "cb_back_service");
  if (data === "act_back_tariff") return t(lg, "cb_back_tariff");
  if (data === "act_back_collect_city") return t(lg, "cb_back_city");
  if (data === "act_back_collect") return t(lg, "cb_back_docs");
  return data;
}

const LEGACY_CALLBACK = /^\s*\[callback\]\s*(.+?)\s*$/i;

/** Chat xabar matnini ko‘rsatish uchun: eski `[callback] data` yozuvlarini tushunarli matnga aylantiradi. */
export function humanizeChatMessageText(text: string | null | undefined, profileLang: string | null | undefined): string {
  if (text == null || text === "") return "—";
  const m = text.match(LEGACY_CALLBACK);
  if (!m) return text;
  const lg = normalizeLang(profileLang);
  return describeCallbackData(m[1].trim(), lg);
}
