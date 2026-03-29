import { requiredDocKeys } from "./flow.js";

export const LANG_ORDER = ["uz", "ru", "tg", "ky"];

export const STRINGS = {
  uz: {
    greet: "Ассалому алайкум! Рўйхатдан ўтиш учун тилни танланг.",
    pick_language: "Тилни танланг:",
    pick_service: "Қайси сервисда ишламоқчи сиз?",
    pick_tariff: "Қайси тарифда ишламоқчи сиз?",
    ask_phone_step:
      "📱 Мобил телефон\n\nИшчи мобил рақамингизни ёзинг ёки контакт юборинг (📎 → Контакт).",
    invalid_phone_step: "Илтимос, тўғри мобил рақам ёки контакт юборинг.",
    user_summary_title: "👤 Маълумотларингиз:",
    summary_phone: "📱 Телефон: {phone}",
    summary_name: "👤 Исм: {name}",
    summary_username: "✉️ Telegram: @{username}",
    ask_city: "Қайси шаҳарда ишламоқчисиз? Шаҳар номини ёзинг.",
    city_received: "Қабул қилинди: {city}",
    checklist_title: "Керакли ҳужжатлар рўйхати:",
    doc_passport: "• Паспорт (фото)",
    doc_license: "• Ҳайдовчилик гувоҳномаси",
    doc_sts: "• СТС (авто учун)",
    doc_phone: "• Телефон рақами",
    doc_patent_front: "• Патент — олд томони",
    doc_patent_back: "• Патент — орқа томони",
    doc_registration: "• Рўйхатдан ўтганлик (скрин/фото)",
    doc_migration: "• Миграция картаси",
    doc_receipt_first: "• Патент тўлови — биринчи квитанция",
    doc_receipt_last: "• Патент тўлови — охирги квитанция",
    doc_bank: "• Банк картаси: 16 рақам + банк боғлаган телефон",
    send_photo_or_file: "Илтимос, {label} учун фото ёки файл юборинг.",
    send_phone_contact:
      "Рақамни матн кўринишида ёзинг ёки контакт юборинг (📎 → Контакт).",
    send_bank:
      "16 рақамли карта рақами ва банк билан боғланган телефонни бир хабарда ёзинг (масалан: 8600... +998...).",
    start_upload: "▶️ Юклашни бошлаш",
    back: "◀️ Орқага",
    saved: "✅ Сақланди: {label}",
    completed: "🤝 Барча маълумотлар қабул қилинди. Паркка юбориш учун тайёр.",
    invalid_input: "Илтимос, талаб қилинган форматда юборинг.",
    use_buttons: "Илтимос, тугмалардан фойдаланинг.",
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пеша & 🚲 Велосипед",
    tariff_car: "🚗 Авто",
    tariff_truck: "🚚 Юк машинаси",
    labels: {
      passport: "паспорт",
      license: "гувоҳнома",
      sts: "СТС",
      phone: "телефон",
      patent_front: "патент (олд)",
      patent_back: "патент (орқа)",
      registration: "рўйхатдан ўтиш",
      migration: "миграция картаси",
      receipt_first: "биринчи квитанция",
      receipt_last: "охирги квитанция",
      bank: "банк маълумотлари",
    },
  },
  ru: {
    greet: "Здравствуйте! Выберите язык для регистрации.",
    pick_language: "Выберите язык:",
    pick_service: "В каком сервисе хотите работать?",
    pick_tariff: "На каком тарифе хотите работать?",
    ask_phone_step:
      "📱 Мобильный телефон\n\nУкажите рабочий номер текстом или отправьте контакт (📎 → Контакт).",
    invalid_phone_step: "Пожалуйста, укажите корректный номер или отправьте контакт.",
    user_summary_title: "👤 Ваши данные:",
    summary_phone: "📱 Телефон: {phone}",
    summary_name: "👤 Имя: {name}",
    summary_username: "✉️ Telegram: @{username}",
    ask_city: "В каком городе планируете работать? Напишите название города.",
    city_received: "Принято: {city}",
    checklist_title: "Список необходимых документов:",
    doc_passport: "• Паспорт (фото)",
    doc_license: "• Водительское удостоверение",
    doc_sts: "• СТС (для авто)",
    doc_phone: "• Номер телефона",
    doc_patent_front: "• Патент — лицевая сторона",
    doc_patent_back: "• Патент — оборот",
    doc_registration: "• Регистрация (скрин/фото)",
    doc_migration: "• Миграционная карта",
    doc_receipt_first: "• Квитанция по патенту — первая",
    doc_receipt_last: "• Квитанция по патенту — последняя",
    doc_bank: "• Банковская карта: 16 цифр + телефон, привязанный к банку",
    send_photo_or_file: "Пожалуйста, отправьте фото или файл для: {label}.",
    send_phone_contact:
      "Напишите номер текстом или отправьте контакт (📎 → Контакт).",
    send_bank:
      "В одном сообщении укажите 16 цифр карты и телефон, привязанный к банку.",
    start_upload: "▶️ Начать загрузку",
    back: "◀️ Назад",
    saved: "✅ Сохранено: {label}",
    completed: "🤝 Все данные получены. Готово для отправки в парк.",
    invalid_input: "Пожалуйста, отправьте в нужном формате.",
    use_buttons: "Пожалуйста, используйте кнопки.",
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пешком & 🚲 Велосипед",
    tariff_car: "🚗 Авто",
    tariff_truck: "🚚 Грузовой",
    labels: {
      passport: "паспорт",
      license: "права",
      sts: "СТС",
      phone: "телефон",
      patent_front: "патент (лицо)",
      patent_back: "патент (оборот)",
      registration: "регистрация",
      migration: "миграционная карта",
      receipt_first: "первая квитанция",
      receipt_last: "последняя квитанция",
      bank: "банковские данные",
    },
  },
  tg: {
    greet: "Салом! Барои бақайдгирӣ забонро интихоб кунед.",
    pick_language: "Забонро интихоб кунед:",
    pick_service: "Дар кадом хизматрасонӣ кор кардан мехоҳед?",
    pick_tariff: "Дар кадом тариф кор кардан мехоҳед?",
    ask_phone_step:
      "📱 Телефони мобилӣ\n\nРақами кории худро нависед ё контакт фиристед (📎 → Контакт).",
    invalid_phone_step: "Лутфан рақами дуруст ё контакт фиристед.",
    user_summary_title: "👤 Маълумоти шумо:",
    summary_phone: "📱 Телефон: {phone}",
    summary_name: "👤 Ном: {name}",
    summary_username: "✉️ Telegram: @{username}",
    ask_city: "Дар кадом шаҳр кор кардан мехоҳед? Номи шаҳрро нависед.",
    city_received: "Қабул шуд: {city}",
    checklist_title: "Рӯйхати ҳуҷҷатҳои лозима:",
    doc_passport: "• Паспорт (акс)",
    doc_license: "• Гувоҳиномаи ронандагӣ",
    doc_sts: "• СТС (барои мошин)",
    doc_phone: "• Рақами телефон",
    doc_patent_front: "• Патент — рӯй",
    doc_patent_back: "• Патент — пушт",
    doc_registration: "• Сабти ном (скрин/акс)",
    doc_migration: "• Корти муҳоҷират",
    doc_receipt_first: "• Квитансияи аввали пардохти патент",
    doc_receipt_last: "• Квитансияи охирини пардохти патент",
    doc_bank: "• Корти бонкӣ: 16 рақам + телефони пайваст ба бонк",
    send_photo_or_file: "Лутфан барои {label} акс ё файл фиристед.",
    send_phone_contact: "Рақамро матн нависед ё контакт фиристед.",
    send_bank: "Дар як паём 16 рақами корт ва телефони бонкро нависед.",
    start_upload: "▶️ Оғози боргирӣ",
    back: "◀️ Бозгашт",
    saved: "✅ Захира шуд: {label}",
    completed: "🤝 Ҳама маълумот қабул шуд. Барои фиристодан ба парк омода аст.",
    invalid_input: "Лутфан дар формати дуруст фиристед.",
    use_buttons: "Лутфан аз тугмаҳо истифода баред.",
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Пиёда & 🚲 Дучарха",
    tariff_car: "🚗 Мошин",
    tariff_truck: "🚚 Боркаш",
    labels: {
      passport: "паспорт",
      license: "гуваҳнома",
      sts: "СТС",
      phone: "телефон",
      patent_front: "патент (рӯй)",
      patent_back: "патент (пушт)",
      registration: "сабти ном",
      migration: "корти муҳоҷират",
      receipt_first: "квитансияи аввал",
      receipt_last: "квитансияи охир",
      bank: "маълумоти бонк",
    },
  },
  ky: {
    greet: "Саламатсызбы! Катталоо үчүн тилди тандаңыз.",
    pick_language: "Тилди тандаңыз:",
    pick_service: "Кайсы кызматта иштегиңиз келет?",
    pick_tariff: "Кайсы тарифте иштегиңиз келет?",
    ask_phone_step:
      "📱 Мобилдик телефон\n\nИштөөчү номериңизди жазыңыз же контакт жөнөтүңүз (📎 → Контакт).",
    invalid_phone_step: "Сураныч, туура номер же контакт жөнөтүңүз.",
    user_summary_title: "👤 Маалыматыңыз:",
    summary_phone: "📱 Телефон: {phone}",
    summary_name: "👤 Аты: {name}",
    summary_username: "✉️ Telegram: @{username}",
    ask_city: "Кайсы шаарда иштегиңиз келет? Шаардын атын жазыңыз.",
    city_received: "Кабыл алынды: {city}",
    checklist_title: "Керектүү документтердин тизмеси:",
    doc_passport: "• Паспорт (сүрөт)",
    doc_license: "• Айдоочулук күбөлүгү",
    doc_sts: "• СТС (унаа үчүн)",
    doc_phone: "• Телефон номери",
    doc_patent_front: "• Патент — алдыңкы жагы",
    doc_patent_back: "• Патент — арткы жагы",
    doc_registration: "• Катталуу (скрин/сүрөт)",
    doc_migration: "• Миграция картасы",
    doc_receipt_first: "• Патент төлөмү — биринчи квитанция",
    doc_receipt_last: "• Патент төлөмү — акыркы квитанция",
    doc_bank: "• Банк картасы: 16 сан + банкка байланган телефон",
    send_photo_or_file: "Сураныч, {label} үчүн сүрөт же файл жөнөтүңүз.",
    send_phone_contact: "Номерди текст менен жазыңыз же контакт жөнөтүңүз.",
    send_bank: "Бир билдирүүдө 16 сан картасы жана банк телефону жазыңыз.",
    start_upload: "▶️ Жүктөөнү баштоо",
    back: "◀️ Артка",
    saved: "✅ Сакталды: {label}",
    completed: "🤝 Бардык маалымат кабыл алынды. Паркка жөнөтүүгө даяр.",
    invalid_input: "Сураныч, туура форматта жөнөтүңүз.",
    use_buttons: "Сураныч, баскычтарды колдонуңуз.",
    service_yandex_eda: "Яндекс Еда",
    service_yandex_lavka: "Яндекс Лавка",
    service_taximeter: "Таксометр (Экспресс) Парк",
    tariff_foot_bike: "🚶 Жөө & 🚲 Велосипед",
    tariff_car: "🚗 Унаа",
    tariff_truck: "🚚 Жүк ташуучу",
    labels: {
      passport: "паспорт",
      license: "күбөлүк",
      sts: "СТС",
      phone: "телефон",
      patent_front: "патент (алдың)",
      patent_back: "патент (арткы)",
      registration: "катталуу",
      migration: "миграция картасы",
      receipt_first: "биринчи квитанция",
      receipt_last: "акыркы квитанция",
      bank: "банк маалыматы",
    },
  },
};

/** Profil yoki DB dan kelgan til kodini faqat qo‘llab-quvvatlanadigan qiymatlarga moslaydi. */
export function normalizeLang(lang) {
  if (lang == null || typeof lang !== "string") return "uz";
  const l = lang.trim().toLowerCase();
  if (STRINGS[l]) return l;
  return "uz";
}

export function t(lang, key, kwargs = {}) {
  const lg = normalizeLang(lang);
  const block = STRINGS[lg];
  const val = block[key];
  if (val === undefined) return key;
  if (typeof val === "object" && val !== null) return String(val);
  let s = String(val);
  if (Object.keys(kwargs).length) {
    try {
      s = s.replace(/\{(\w+)\}/g, (_, k) =>
        kwargs[k] !== undefined ? String(kwargs[k]) : `{${k}}`
      );
    } catch {
      /* ignore */
    }
  }
  return s;
}

export function docLabel(lang, docKey) {
  const lg = normalizeLang(lang);
  const labels = STRINGS[lg].labels;
  return String(labels[docKey] || docKey);
}

const KEY_TO_MSG = {
  passport: "doc_passport",
  license: "doc_license",
  sts: "doc_sts",
  patent_front: "doc_patent_front",
  patent_back: "doc_patent_back",
  registration: "doc_registration",
  migration: "doc_migration",
  receipt_first: "doc_receipt_first",
  receipt_last: "doc_receipt_last",
  bank: "doc_bank",
};

export function checklistLines(lang, tariff) {
  const lg = normalizeLang(lang);
  const keys = requiredDocKeys(tariff);
  const lines = [t(lg, "checklist_title")];
  for (const k of keys) {
    const mk = KEY_TO_MSG[k];
    if (mk) lines.push(t(lg, mk));
  }
  return lines;
}

/** Shahar qabul qilingandan keyin — telefon va Telegram ismi qisqa blok. */
export function formatUserSummary(lang, profile) {
  if (!profile) return "";
  const lg = normalizeLang(lang);
  const parts = [];
  if (profile.phone) {
    parts.push(t(lg, "summary_phone", { phone: profile.phone }));
  }
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (name) {
    parts.push(t(lg, "summary_name", { name }));
  }
  if (profile.username) {
    parts.push(t(lg, "summary_username", { username: profile.username }));
  }
  if (parts.length === 0) return "";
  return `${t(lg, "user_summary_title")}\n${parts.join("\n")}`;
}
