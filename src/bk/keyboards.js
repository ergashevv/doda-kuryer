import { Markup } from "telegraf";
import {
  categoryLabelForLang,
  faqItems,
  normalizeBKLang,
  summaryTitle,
  tBK,
} from "./i18n.js";

/** Reply klaviaturani yopib, xabar ostida inline (odatiy bot UX). */
export function replyRemoveWithInline(markupFromTelegraf) {
  const ik = markupFromTelegraf?.reply_markup?.inline_keyboard;
  return {
    reply_markup: {
      remove_keyboard: true,
      ...(ik ? { inline_keyboard: ik } : {}),
    },
  };
}

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

/** Pastki reply menyu (faqat kerak bo‘lsa, masalan maxsus integratsiya). */
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

/** Asosiy menyu — inline (`bk_M:in|out|support`). */
export function mainMenuInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "btn_in_park"), "bk_M:in")],
    [Markup.button.callback(tBK(lg, "btn_not_in_park"), "bk_M:out")],
    [Markup.button.callback(tBK(lg, "btn_support"), "bk_M:support")],
  ]);
}

/** Telefon qadam: kontakt qo‘llanmasi + «raqam yozaman» (`bk_P:contact_hint`, `bk_P:manual`). */
export function phoneStepInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        tBK(lg, "btn_phone_from_telegram"),
        "bk_P:contact_hint"
      ),
    ],
    [Markup.button.callback(tBK(lg, "btn_phone_manual"), "bk_P:manual")],
  ]);
}

/** BK uslubi: kontakt yoki qo‘lda nomer */
export function phoneStepReply(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.keyboard([
    [Markup.button.contactRequest(tBK(lg, "btn_phone_from_telegram"))],
    [tBK(lg, "btn_phone_manual")],
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
      Markup.button.callback(tBK(lg, "cit_uz"), "bk_Z:uz"),
      Markup.button.callback(tBK(lg, "cit_tj"), "bk_Z:tj"),
    ],
    [
      Markup.button.callback(tBK(lg, "cit_kg"), "bk_Z:kg"),
      Markup.button.callback(tBK(lg, "cit_kz"), "bk_Z:kz"),
    ],
    [
      Markup.button.callback(tBK(lg, "cit_rf"), "bk_Z:rf"),
      Markup.button.callback(tBK(lg, "cit_tm"), "bk_Z:tm"),
    ],
  ]);
}

/** Легковое: учёт РФ (СТС) yoki chet el (техпаспорт) */
export function vehicleRfInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "btn_vehicle_rf_sts"), "bk_V:1")],
    [Markup.button.callback(tBK(lg, "btn_vehicle_foreign_tech"), "bk_V:0")],
  ]);
}

/** Velosiped: самозанятость */
export function selfEmployedInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "cit_yes"), "bk_SE:1"),
      Markup.button.callback(tBK(lg, "cit_no"), "bk_SE:0"),
    ],
  ]);
}

const TRUCK_DIM_CODES = ["S", "M", "L", "XL", "XXL"];

export function truckDimensionsInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard(
    TRUCK_DIM_CODES.map((c) => [
      Markup.button.callback(tBK(lg, `truck_dim_btn_${c}`), `bk_TR:d:${c}`),
    ])
  );
}

export function truckBrandingInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "cit_yes"), "bk_TR:b:1"),
      Markup.button.callback(tBK(lg, "cit_no"), "bk_TR:b:0"),
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

/**
 * Yakuniy ko‘rib chiqish: faqat summaryda bor maydonlar uchun tahrir tugmalari.
 * @param {object|null} profile — `user_profiles` qatori (phone, city, session_data).
 */
export function reviewKb(lang, profile) {
  const lg = normalizeBKLang(lang);
  const bk = profile?.session_data?.bk || {};
  const completed = profile?.session_data?.completed_docs || [];
  const comp = new Set(completed);
  const phone = profile?.phone;
  const city = profile?.city;
  const smzCit = ["rf", "kg", "kz"].includes(bk.citizenship);

  const rows = [[Markup.button.callback(tBK(lg, "submit_btn"), "bk_R:send")]];

  const rowPhoneCat = [];
  if (phone) {
    rowPhoneCat.push(
      Markup.button.callback(`📱 ${summaryTitle(lg, "phone")}`, "bk_R:e:phone")
    );
  }
  if (bk.categoryLabel) {
    rowPhoneCat.push(
      Markup.button.callback(`🚗 ${summaryTitle(lg, "category")}`, "bk_R:e:cat")
    );
  }
  if (rowPhoneCat.length) rows.push(rowPhoneCat);

  if (bk.categoryKey === "car" && typeof bk.vehicleRf === "boolean") {
    rows.push([
      Markup.button.callback(`🚙 ${summaryTitle(lg, "vehicle")}`, "bk_R:e:veh"),
    ]);
  }

  if (bk.categoryKey === "truck") {
    if (bk.truckDimensionLabel) {
      rows.push([
        Markup.button.callback(
          `📐 ${summaryTitle(lg, "truck_dims")}`,
          "bk_R:e:tdim"
        ),
      ]);
    }
    if (bk.truckPayloadKg != null && bk.truckPayloadKg !== "") {
      rows.push([
        Markup.button.callback(
          `⚖️ ${summaryTitle(lg, "truck_payload")}`,
          "bk_R:e:tpay"
        ),
      ]);
    }
    if (typeof bk.truckBranding === "boolean") {
      rows.push([
        Markup.button.callback(
          `🏷 ${summaryTitle(lg, "truck_wrap")}`,
          "bk_R:e:twrap"
        ),
      ]);
    }
  }

  if (bk.categoryKey === "bike" && typeof bk.selfEmployed === "boolean") {
    rows.push([
      Markup.button.callback(
        `🧾 ${summaryTitle(lg, "self_employed")}`,
        "bk_R:e:bself"
      ),
    ]);
  }

  if (bk.categoryKey === "bike" && bk.selfEmployed === true && bk.rfCitizen === true) {
    if (bk.moyNalogPhone) {
      rows.push([
        Markup.button.callback(
          `📱 ${summaryTitle(lg, "bike_smz_phone")}`,
          "bk_R:e:bsmzphone"
        ),
      ]);
    }
    if (bk.smzAddress) {
      rows.push([
        Markup.button.callback(
          `📍 ${summaryTitle(lg, "bike_smz_address")}`,
          "bk_R:e:bsmzaddr"
        ),
      ]);
    }
  } else if (
    bk.categoryKey === "bike" &&
    bk.selfEmployed === true &&
    bk.inn &&
    bk.rfCitizen !== true
  ) {
    rows.push([
      Markup.button.callback(`#️⃣ ${summaryTitle(lg, "inn")}`, "bk_R:e:binn"),
    ]);
  }

  const rowCityCit = [];
  if (city) {
    rowCityCit.push(
      Markup.button.callback(`🏙 ${summaryTitle(lg, "city")}`, "bk_R:e:city")
    );
  }
  if (typeof bk.rfCitizen === "boolean") {
    rowCityCit.push(
      Markup.button.callback(`🪪 ${summaryTitle(lg, "citizenship")}`, "bk_R:e:cit")
    );
  }
  if (rowCityCit.length) rows.push(rowCityCit);

  if (smzCit && bk.selfEmployed === true) {
    if (comp.has("reg_amina")) {
      rows.push([
        Markup.button.callback(
          `📎 ${summaryTitle(lg, "car_reg_amina")}`,
          "bk_R:e:reg_amina"
        ),
      ]);
    }
    if (bk.moyNalogPhone && bk.categoryKey !== "bike") {
      rows.push([
        Markup.button.callback(
          `📱 ${summaryTitle(lg, "car_smz_phone")}`,
          "bk_R:e:mnlog"
        ),
      ]);
    }
  }

  /* reg_amina — yuqoridagi SMZ bloki (bir marta) */
  const uploadCols = ["license", "sts", "tech_passport_front", "tech_passport_back"];
  const uploadRow = [];
  for (const dk of uploadCols) {
    if (!comp.has(dk)) continue;
    const label =
      dk === "reg_amina" ? summaryTitle(lg, "car_reg_amina") : summaryTitle(lg, dk);
    const icon =
      dk === "license"
        ? "🪪"
        : dk === "sts"
          ? "📋"
          : dk.startsWith("tech")
            ? "📄"
            : "📎";
    uploadRow.push(Markup.button.callback(`${icon} ${label}`, `bk_R:e:${dk}`));
  }
  for (let i = 0; i < uploadRow.length; i += 2) {
    rows.push(uploadRow.slice(i, i + 2));
  }

  const passRow = [];
  if (comp.has("passport_front")) {
    passRow.push(
      Markup.button.callback(
        `🛂 ${summaryTitle(lg, "passport_front")}`,
        "bk_R:e:pf"
      )
    );
  }
  if (comp.has("passport_back")) {
    passRow.push(
      Markup.button.callback(
        `📄 ${summaryTitle(lg, "passport_back")}`,
        "bk_R:e:pb"
      )
    );
  }
  if (passRow.length) {
    rows.push(passRow);
  }
  if (comp.has("passport_front") && comp.has("passport_back")) {
    rows.push([
      Markup.button.callback(
        `🔄 ${tBK(lg, "review_redo_passport_both")}`,
        "bk_R:e:passport"
      ),
    ]);
  }

  return Markup.inlineKeyboard(rows);
}
