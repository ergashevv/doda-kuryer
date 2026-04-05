/** BK bot matnlari: 4 til — uz, ru, tg, ky */

export const BK_LANG_ORDER = ["uz", "ru", "tg", "ky"];

export function normalizeBKLang(lang) {
  if (lang == null || typeof lang !== "string") return "ru";
  const l = lang.trim().toLowerCase();
  if (BK_LANG_ORDER.includes(l)) return l;
  return "ru";
}

function interpolate(str, kwargs = {}) {
  if (typeof str !== "string") return String(str);
  let s = str;
  for (const [k, v] of Object.entries(kwargs)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

/** `faq` — массив { id, q, a } */
const BK_STRINGS = {
  uz: {
    pick_language: "Tilni tanlang:",
    err_pick_lang: "Iltimos, tilni pastdagi tugma orqali tanlang.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Asosiy menyu:",
    faq_freedom_hint: "Savolni pastdagi tugma orqali tanlang yoki /start",

    btn_in_park: "😎 Men allaqachon DODA parkidaman",
    btn_not_in_park: "🙏 DODA parkida emasman, ulash kerak",
    btn_support: "❓ Texnik yordam",
    btn_phone_from_telegram:
      "Telegramga biriktirilgan telefon raqamidan foydalanish",
    btn_phone_manual: "Qo'lda kiritaman",
    ask_phone_manual_hint:
      "Raqamni bitta xabarda yozing: +7… (7 dan keyin 10 raqam), yoki 8…, yoki kodisiz 10 raqam. Faqat RF raqami.",
    btn_therm_yes: "Ha",
    btn_therm_no: "Yo'q, sotib olish kerak",
    cit_yes: "Ha",
    cit_no: "Yo'q",
    city_other_btn: "✏️ Boshqa shahar (matn)",

    welcome_video_missing:
      "BOGATY KURYER ekotizim botiga xush kelibsiz!\n\nBu yerda kuryerlar uchun daromadni oshirish bo'yicha hamma narsa bor.\n\n⚔️ BK Zaruba\n🏆 BK turniri\n🤝 BK referal dasturi\n👫 BK jamoasi\n📊 Kunlik statistika\n\nTransport yo'q va ijaraga kerak bo'lsa 👉 /ARENDA\n\nAgar hali BOGATY KURYER parkida bo'lmasangiz — eng yaxshi shartlarda bir necha daqiqada ulashamiz 👇",

    welcome_after_video:
      "BOGATY KURYER ekotizim botiga xush kelibsiz!\n\nBu yerda kuryerlar uchun daromadni oshirish bo'yicha hamma narsa bor.\n\n⚔️ BK Zaruba\n🏆 BK turniri\n🤝 BK referal dasturi\n👫 BK jamoasi\n📊 Kunlik statistika\n\nTransport yo'q va ijaraga kerak bo'lsa 👉 /ARENDA\n\nAgar hali BOGATY KURYER parkida bo'lmasangiz — eng yaxshi shartlarda bir necha daqiqada ulashamiz 👇",

    faq_intro: "Allaqachon parkdasan — savolni tanla:",
    faq_back: "◀️ Asosiy menyuga",

    support:
      "Texnik yordam: muammoni bitta xabarda yozing (arizadagi telefon, nima qildingiz).",

    arenda:
      "Ijara: menejer bilan bog'lanish — Telegramda @{manager}.\n\nQaytish: /start",

    ask_phone:
      "📱 Ariza uchun Rossiya raqamini yozing: +7… yoki 8…, yoki kontakt 📎 (faqat RF).",

    ask_phone_keyboard_nudge:
      "👇 Xabar ostidagi tugmalar yoki raqamni matnda yozing.",

    err_phone_invalid:
      "Faqat Rossiya raqami: +7XXXXXXXXXX, 8XXXXXXXXXX yoki 10 raqam kodisiz. Boshqa davlat raqamlari qabul qilinmaydi.",

    err_phone_no_media:
      "Bu qadamda foto yoki fayl emas — telefon raqamini matn yoki kontakt sifatida yuboring.",

    phone_contact_via_attachment:
      "📎 Skrepka → Kontakt orqali yuboring yoki raqamni matnda yozing (+7…).",

    phone_type_number_cb: "Raqamni chatga yozing: +7… yoki 8…",

    confirm_phone: (phone) => `Telefon: ${phone}`,

    ask_category: "Qaysi kategoriyada ishlashni xohlaysiz? Ijara kerak bo'lsa — /ARENDA",

    cat_car: "🚗 Yengil avtomobil",
    cat_truck: "🚚 Yuk mashinasi",
    cat_moto: "🏍️ Mototransport",
    cat_bike: "🚲 Velosiped",
    cat_foot: "🚶 Piyoda",

    confirm_category: (label) => `Tanlangan kategoriya: ${label}`,

    ask_vehicle_rf:
      "🚗 Yengil avto: transport qayerda ro'yxatdan o'tgan?\n\n" +
      "• Rossiyada (🇷🇺) — STS: odatda bitta foto (barcha maydonlar yaxshi o'qilsin).\n" +
      "• Chet el transport (🌍) — texpasport: avval old tomoni, keyin orqa tomoni — jami 2 ta alohida foto.",

    btn_vehicle_rf_sts: "🇷🇺 Rossiyada ro'yxat — STS",
    btn_vehicle_foreign_tech: "🌍 Chet el TS — texpasport (old + orqa)",

    confirm_vehicle_rf: (rf) =>
      rf
        ? "Rossiyada hisob — keyingi qadamda STS rasmi."
        : "Chet el TS — avval texpasport old tomoni, keyin orqa tomoni rasmlari.",

    summary_vehicle_rf: "Rossiya — STS",
    summary_vehicle_foreign: "Chet el TS — texpasport (old/orqa)",

    btn_continue: "Davom etish 👉",

    ask_license_front:
      "Haydovchilik guvohnomasi (VU) — old tomonidan bitta foto yuboring.",

    confirm_license_uploaded:
      "✅ VU foto qabul qilindi\n\nMaydonlar aniq ko'rinishini tekshiring va «Davom etish 👉»ni bosing\n\nyoki almashtirish uchun boshqa foto yuboring.",

    ask_sts_front:
      "STS — bitta foto: barcha yozuvlar aniq ko'rinadigan qilib yuboring (odatda yoyma yoki asosiy bet).",

    ask_tech_passport_front:
      "Chet el TS texpasporti — OLD tomoni (bitta foto).",

    ask_tech_passport_back:
      "Chet el TS texpasporti — ORQA tomoni (bitta foto).",

    confirm_tech_passport_front:
      "✅ Texpasport old tomoni qabul qilindi\n\nO'qilishini tekshiring, «Davom etish 👉» yoki boshqa foto.",

    confirm_tech_passport_back:
      "✅ Texpasport orqa tomoni qabul qilindi\n\nO'qilishini tekshiring, «Davom etish 👉» yoki boshqa foto.",

    confirm_sts_uploaded:
      "✅ STS foto qabul qilindi\n\nMaydonlar aniq ko'rinishini tekshiring va «Davom etish 👉»ni bosing\n\nyoki almashtirish uchun boshqa foto yuboring.",

    ask_city:
      "Qaysi shaharda ishlaysiz? Tugma yoki matn. Bir nechta bo'lsa — asosiyini yozing.",

    err_city_need_text:
      "Shahar nomini matn bilan yozing; rasm yubormang.",

    confirm_city: (city) => `Tanlangan shahar: ${city}`,

    ask_citizenship: "RF fuqarosimisiz?",

    confirm_citizenship: (yes) => `RF fuqaroligi: ${yes ? "Ha" : "Yo'q"}`,

    ask_self_employed: "O'z-o'zini band qilganmisiz?",
    confirm_self_employed: (yes) =>
      `O'z-o'zini band qilish: ${yes ? "Ha" : "Yo'q"}`,

    ask_inn: "INN ni yozing (10–13 raqam).",
    err_inn_invalid: "INN 10–13 raqamdan iborat bo'lishi kerak.",
    confirm_inn: (inn) => `INN: ${inn}`,

    ask_bike_smz_phone:
      "«Moy nalog» ilovasiga ulangan telefon raqamini yozing (RF: +7… yoki 8…).",

    err_bike_smz_phone_invalid:
      "Faqat Rossiya raqami: +7XXXXXXXXXX, 8XXXXXXXXXX yoki 10 raqam.",

    confirm_bike_smz_phone: (phone) => `«Moy nalog» telefoni: ${phone}`,

    ask_bike_smz_address:
      "To'liq manzilni bitta xabarda yozing: shahar, ko'cha, podyezd, kvartira (barchasi aniq).",

    err_bike_smz_address_short:
      "Juda qisqa. Shahar, ko'cha, podyezd va kvartirani yozing.",

    err_bike_smz_address_no_media:
      "Manzilni matn bilan yozing; rasm yubormang.",

    confirm_bike_smz_address: (addr) => `Manzil: ${addr}`,

    ask_thermal: "Termokorob bormi?",

    confirm_thermal: (yes) =>
      `Termokorob: ${yes ? "Ha" : "Yo'q, sotib olish kerak"}`,

    edit_btn: "↩️ O'zgartirish",

    review_hint:
      "👆 Ma'lumotlar tayyor. «✅ Yuborish»ni bosing yoki maydonni tahrirlang.",

    review_callback_stale:
      "Bu tugmalar faqat «qisqacha» ekranida ishlaydi. Ro'yxatdan o'tishni davom ettiring yoki /start",

    submit_btn: "✅ Yuborish",

    final_wait:
      "Zo'r! Menejerlar akkauntni tayyorlayapti — taxminan 20 daqiqa.\n\nJamo'a: https://t.me/+HCQG5WLhKNk3Y2My",

    final_wait_intro:
      "Ajoyib!\n\nMenejerlar akkauntingizni tayyorlayapti — taxminan 20 daqiqa 👌\nRo'yxatdan o'tish tugagach, bu yerda keyingi ko'rsatma bor xabar olasiz",

    final_wait_community:
      "Hozircha shahringiz bo'yicha Doda taxi jamoasiga qo'shiling: {link}\n\nKurator boshchiligidagi jamoa daromad bo'yicha foydali maslahatlar almashadi, bir-biriga yordam beradi — yangilar ham qatnashadi 🤝\n\nSavollardan tortinmang — tezroq natijaga chiqishga yordam beradi 💪",

    use_menu: "Iltimos, pastdagi tugmalar yoki /start.",

    err_use_buttons_category: "Kategoriyani pastdagi tugma orqali tanlang.",

    err_doc_need_photo:
      "Bu qadamda foto yoki PDF fayl yuboring (matn emas).",

    err_bank_need_text:
      "Bank uchun bitta xabarda karta raqami va telefonni matn bilan yozing.",

    err_wrong_media_type:
      "Video, ovoz yoki stiker emas — foto yoki hujjat (PDF) yuboring.",

    err_doc_mime:
      "Faqat rasm (JPEG/PNG) yoki PDF fayl.",

    ask_truck_dimensions:
      "Yuk bo'limining o'lchamlarini tanlang (uzunlik/kenglik/balandlik)",
    truck_dim_btn_S: "S - 170×100×90 sm dan.",
    truck_dim_btn_M: "M - 260×130×150 sm dan.",
    truck_dim_btn_L: "L - 380×180×180 sm dan.",
    truck_dim_btn_XL: "XL - 400×190×200 sm dan.",
    truck_dim_btn_XXL: "XXL - 500×200×200 sm dan.",
    confirm_truck_dimensions: (label) => `Tanlangan o'lcham: ${label}`,

    ask_truck_payload:
      "Yuk ko'taruvchanligini kg da yozing\n\nMasalan:\n2300",
    err_truck_payload_number:
      "Yuk ko'taruvchanligini kg da raqam bilan yozing (masalan 2300).",
    confirm_truck_payload: (kg) =>
      `Yuk ko'taruvchanligi: ${new Intl.NumberFormat("uz-UZ").format(kg)}`,

    ask_truck_loaders: "Yuk ko'taruvchilar soni?",
    truck_loader_btn_0: "🙅‍♂️ Hech qancha",
    truck_loader_btn_1: "🙋‍♂️ Bitta",
    truck_loader_btn_2: "🙋‍♂️🙋‍♂️ Ikkita",
    confirm_truck_loaders: (n) => {
      const labels = ["🙅‍♂️ Hech qancha", "🙋‍♂️ Bitta", "🙋‍♂️🙋‍♂️ Ikkita"];
      return `Yuk ko'taruvchilar: ${labels[n] ?? n}`;
    },

    ask_truck_branding: "Avtomobilda brending (yopish) bormi?",
    confirm_truck_branding: (yes) =>
      `Brending: ${yes ? "Ha" : "Yo'q"}`,

    passport_legal_block: "Pasport varag'ini (yoyma) foto yuboring",
    passport_legal_block_bike: "Pasport varag'ini (yoyma) foto yuboring",
    confirm_passport_uploaded:
      "✅ Foto qabul qilindi\n\n«Davom etish 👉»ni bosing\n\nyoki almashtirish uchun boshqa foto yuboring.",
    doc_line_passport_spread: "✅ Pasport yoymasi Media (1 dona)",

    summary_titles: {
      phone: "Telefon (avtorizatsiya)",
      category: "Yetkazib berish turi",
      city: "Shahar",
      citizenship: "RF fuqaroligi",
      thermal: "Termokorob",
      passport_foreign: "Chet el pasporti",
      passport_rf: "Pasport",
      passport: "Pasport",
      vehicle: "TS hisobi",
      truck_dims: "Yuk bo'limi o'lchamlari",
      truck_payload: "Yuk ko'tarish",
      truck_loaders: "Yuk ko'taruvchilar",
      truck_wrap: "Brending / yopish",
      self_employed: "O'z-o'zini band qilish",
      inn: "INN",
      bike_smz_phone: "«Moy nalog» telefoni",
      bike_smz_address: "Yashash manzili (SMZ)",
      bike_thermal: "Velo termokorob",
      bike_passport: "Pasport",
    },

    summary_passport_media: "Media (1 dona)",

    summary_yes: "Ha",
    summary_no: "Yo'q",
    summary_thermal_no: "Yo'q, sotib olish kerak",

    group_header_new: "🔔 Yangi ariza · Doda taxi",
    group_separator: "━━━━━━━━━━━━━━━━━━━━",
    group_anketa_heading: "📋 ANKETA",
    group_label_name: "👤 Ism:",
    group_label_telegram: "📱 Telegram:",
    group_label_phone: "📞 Telefon:",
    group_label_category: "🚗 Yetkazib berish turi:",
    group_label_vehicle: "🚙 TS hisobi:",
    group_label_city: "🏙 Shahar:",
    group_label_citizenship: "🪪 RF fuqaroligi:",
    group_label_truck_dims: "📐 O'lchamlar:",
    group_label_truck_payload: "⚖️ Yuk ko'tarish:",
    group_label_truck_loaders: "👷 Yuk ko'taruvchilar:",
    group_label_truck_branding: "🏷 Brending:",
    group_label_bike_self: "🧾 O'z-o'zini band:",
    group_label_bike_inn: "#️⃣ INN:",
    group_label_bike_smz_phone: "📱 «Moy nalog» telefoni:",
    group_label_bike_smz_address: "📍 Manzil (shahar, ko'cha, podyezd, kvartira):",
    group_label_bike_thermal: "📦 Velo termokorob:",
    group_docs_heading: "📎 HUJJATLAR",
    group_docs_empty:
      "Arizaga fayllar ulanmagan (yuklanishlarni tekshiring).",
    group_docs_intro:
      "Ilova: {count} (pastda — anketa bo'yicha tartibda).",
    group_bank_heading: "🏦 BANK (arizadan matn)",
    group_footer_done:
      "━━━━━━━━━━━━━━━━━━━━\n✅ Ariza qabul qilindi, barcha fayllar olindi\n━━━━━━━━━━━━━━━━━━━━",
    group_caption_license: "Haydovchilik guvohnomasi (VU)",
    group_caption_sts: "STS — TS ro'yxatdan o'tganligi",
    group_caption_tech_passport_front:
      "Chet el TS texpasporti — old tomoni",
    group_caption_tech_passport_back:
      "Chet el TS texpasporti — orqa tomoni",
    group_caption_passport: "Pasport (yoyma)",
    group_caption_bank: "Bank ma'lumotlari",
    group_truck_kg: "{value} kg",
    group_truck_loader_word_0: "yo'q",
    group_truck_loader_word_1: "bitta",
    group_truck_loader_word_2: "ikkita",
    group_value_dash: "—",

    ask_service:
      "Ulanish servisini pastdagi tugma orqali tanlang.",

    yx_final_thanks:
      "Ma'lumotlarni yuborganingiz uchun rahmat. Ariza qabul qilindi, tez orada siz bilan bog'lanamiz.",

    yx_review_use_buttons:
      "Bu bosqichda faqat xabar ostidagi tugmalar ishlaydi (jumladan «✅ Yuborish»).",

    yx_need_video:
      "Bu bosqichda qisqa video yuboring (video-doira mos kelmaydi).",

    group_header_yandex: "🔔 Yangi ariza · Yandex Lavka / Eda",
    group_label_yandex_service: "🛒 Servis:",
    group_label_yandex_city: "🏙 Shahar:",
    group_label_yandex_citizen: "🪪 Fuqarolik / status:",
    group_label_yandex_uzdoc: "📄 Hujjat turi (UZ/TJ):",
    group_label_yandex_kzdoc: "📄 Hujjat (KZ/KG):",
    group_label_yandex_tmvisa: "📄 TM vizasi:",
    group_yandex_text_heading: "📝 MATN MAYDONLARI",
    group_caption_yx_generic: "Ariza ilovasi (Yandex)",

    yx_btn_doda: "Ru Park Doda kuryer",
    yx_btn_lavka: "Yandex Lavka",
    yx_btn_eats: "Yandex Eda",

    yx_city_msk: "Moskva",
    yx_city_mo: "Moskva viloyati",

    yx_ask_city:
      "Moskva yoki Moskva viloyatini pastdagi tugma orqali tanlang.",
    yx_ask_citizen: "Status / fuqaroligingizni pastdagi tugma orqali tanlang.",
    yx_ask_uz_doc: "Tasdiqlovchi hujjat turini tanlang.",
    yx_ask_kz_doc_kz:
      "Qozog‘iston fuqarosi — keyingi qadamni pastdagi tugmalar bilan tanlang.",
    yx_ask_kz_doc_kg:
      "Qirg‘iziston fuqarosi — keyingi qadamni pastdagi tugmalar bilan tanlang.",
    yx_ask_kz_doc_neutral: "Keyingi qadamni pastdagi tugmalar bilan tanlang.",
    yx_ask_tm_visa:
      "Qaysi turdagi viza bilan? Pastdagi tugmalardan tanlang: turizm yoki ishchi viza.",

    yx_cit_uz: "O'zbekiston",
    yx_cit_tj: "Tojikiston",
    yx_cit_kz: "Qozog'iston",
    yx_cit_kg: "Qirg'iziston",
    yx_cit_other: "Yoki boshqa",
    yx_cit_uz_tj: "O'zbekiston / Tojikiston",
    yx_cit_kz_kg: "Qozog'iston / Qirg'iziston",
    yx_cit_rf: "RF fuqarosi",
    yx_cit_tm: "Turkmaniston",

    yx_doc_patent: "Patent",
    yx_doc_vnzh: "VNJ / RVP",
    yx_doc_student: "Talaba",

    yx_kz_pass: "Pasport",
    yx_kz_id: "ID (shaxs guvohnomasi)",

    yx_tm_work: "Ishchi viza",
    yx_tm_tourism: "Turizm viza",
    yx_tm_tourism_blocked:
      "Turizm vizasi bilan hozircha ulab bera olmaymiz. Faqat ishchi viza bilan to‘liq ro‘yxatdan o‘tish mumkin. «Ishchi viza»ni tanlang.",

    yx_ram_reg: "Registratsiya",
    yx_ram_amina: "Amina",

    yx_p_ram_choice:
      "Quyidagidan birini tanlang: yashash joyi bo'yicha registratsiya yoki «Amina» hujjati.",

    yx_review_hint:
      "Ma'lumotlarni tekshiring. Yuborish uchun «✅ Yuborish»ni bosing.",

    yx_rev_title: "Arizani tekshirish (Yandex)",
    yx_rev_service: "Servis",
    yx_rev_city: "Shahar",
    yx_rev_citizen: "Status",
    yx_rev_uzdoc: "UZ/TJ hujjati",
    yx_rev_kzdoc: "KZ/KG hujjati",
    yx_rev_tmvisa: "TM vizasi",
    yx_rev_files: "Yakunlangan bosqichlar (matnlar bilan birga)",

    yx_use_buttons: "Bu bosqichda variantni pastdagi tugma orqali tanlang.",
    yx_confirm_doc_preview:
      "✅ Fayl qabul qilindi\n\nKo‘rinishni tekshiring va «Davom etish 👉»ni bosing\n\nyoki «O'zgartirish» — boshqa fayl yuborish.",
    yx_press_continue_first:
      "Avval «Davom etish 👉»ni bosing yoki «O'zgartirish» orqali qayta yuklang.",
    yx_need_text: "Matnni bitta xabar bilan yuboring (foto yoki faylsiz).",
    yx_bad_text:
      "Formatni tekshiring: karta — 16 raqam; telefon — RF; INN — 10 yoki 12 raqam; SNILS — 11 raqam; maydon bo'sh bo'lmasin.",
    yx_file_ok: "Qabul qilindi. Keyingi bosqichga o'tamiz.",

    yx_lbl_yx_col_req_text: "Rekvizitlar (matn)",
    yx_lbl_yx_col_card16: "Karta raqami",
    yx_lbl_yx_col_contact_phone: "Kontakt telefoni",
    yx_lbl_yx_col_tm_contact: "Kontakt telefoni",
    yx_lbl_yx_col_inn: "INN",
    yx_lbl_yx_col_snils: "SNILS",

    yx_p_req_video:
      "Bank kartasi rekvizitlari bilan qisqa video yuboring (yuz va pasportsiz).",
    yx_p_req_photo:
      "Bank kartasi rekvizitlari bilan foto yuboring (yuz va pasportsiz).",
    yx_p_req_text:
      "Bank rekvizitlarini bitta xabarda yuboring (servis yo'riqnomasiga ko'ra).",
    yx_p_card16: "Bank karta raqamini kiriting — ketma-ket 16 raqam (bo'shliq bilan ham mumkin).",

    yx_p_uz_pat_pass: "Pasport fotosi (rasmli sahifa).",
    yx_p_uz_pat_front: "Patent fotosi — old tomoni.",
    yx_p_uz_pat_back: "Patent fotosi — orqa tomoni.",
    yx_p_reg_f: "Registratsiya fotosi — old tomoni.",
    yx_p_reg_b: "Registratsiya fotosi — orqa tomoni.",
    yx_p_amina: "«Amina» hujjati fotosi.",
    yx_p_mig: "Migratsion karta fotosi.",
    yx_p_pay_ph: "Patent to'lovi cheki / tasdig'i fotosi.",
    yx_p_pay_file: "Patent to'lovi kvitansiyasi (foto yoki PDF).",

    yx_p_vnzh_f: "VNJ / RVP fotosi — old tomoni.",
    yx_p_vnzh_b: "VNJ / RVP fotosi — orqa tomoni.",
    yx_p_vnzh_pass: "Pasport fotosi (rasmli sahifa).",
    yx_p_inn: "INN ni kiriting — 10 yoki 12 raqam (faqat raqamlar).",
    yx_p_snils: "SNILS ni kiriting — 11 raqam (defislar ixtiyoriy).",

    yx_p_st_bilet: "Talabalik guvohnomasi fotosi.",
    yx_p_st_spravka: "O'qish joyidan ma'lumotnoma fotosi.",
    yx_p_st_pass: "Pasport fotosi (rasmli sahifa).",

    yx_p_kz_pass_face: "Pasport fotosi (rasmli sahifa).",
    yx_p_kz_id_f: "Shaxsni tasdiqlovchi guvohnoma — old tomoni.",
    yx_p_kz_id_b: "Shaxsni tasdiqlovchi guvohnoma — orqa tomoni.",

    yx_p_rf_pass_face: "RF pasporti fotosi (rasmli sahifa).",
    yx_p_rf_pass_prop: "Propiska sahifasi fotosi.",

    yx_p_tm_pass: "Pasport fotosi (rasmli sahifa).",
    yx_p_tm_visa:
      "Viza / ruxsatnoma fotosini yuboring (turi oldingi bosqichda tanlangan).",
    yx_p_tm_amina_or_reg:
      "«Amina» skrinshoti yoki qog‘oz registratsiya — bitta foto yoki PDF (ikkala tomonda bo‘lsa, bitta fayl yoki birinchi bet).",

    yx_p_contact_phone: "Kontakt telefon raqamini kiriting (RF).",

    faq: [
      {
        id: "pay",
        q: "💰 Pulni qanday chiqaraman?",
        a: "Hamkor ilovasida (Yandex Pro / park): Profil → Balans → Chiqarish.",
      },
      {
        id: "orders",
        q: "📦 Buyurtma yo'q",
        a: "Smena, zona va limitlarni tekshiring; pik vaqtlarini kuting.",
      },
      {
        id: "docs",
        q: "📄 Hujjatlar",
        a: "Talablar servis va parkka bog'liq; ilovadagi xabarlarni kuzating.",
      },
      {
        id: "community",
        q: "👫 Jamo'a",
        a: "Rasmiy takliflardan foydalaning; noma'lum havolalarga o'tmang.",
      },
    ],
  },

  ru: {
    start_thanks_courier: "Благодарим за обращение в Дода Курьер 👑",
    start_pick_language: "Выберите язык 👇",
    pick_language: "Выберите язык:",
    err_pick_lang: "Пожалуйста, выбери язык кнопкой ниже.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Главное меню:",
    faq_freedom_hint: "Выбери вопрос кнопкой ниже или нажми /start.",

    btn_in_park: "😎 Я уже в парке DODA",
    btn_not_in_park: "🙏 Я не в парке DODA, нужно подключить",
    btn_support: "❓ Нужна помощь техподдержки",
    btn_phone_from_telegram:
      "Использовать номер телефона, привязанный к Telegram",
    btn_phone_manual: "Ввести самостоятельно",
    ask_phone_manual_hint:
      "Напиши номер одним сообщением: +7… (10 цифр после 7), или 8…, или 10 цифр без кода. Только номер РФ.",
    btn_therm_yes: "Да",
    btn_therm_no: "Нет, необходимо приобрести",
    cit_yes: "Да",
    cit_no: "Нет",
    city_other_btn: "✏️ Другой город (напиши текстом)",

    welcome_video_missing:
      "Добро пожаловать в бота Doda taxi!\n\nТут ты найдёшь всё, что нужно для работы в доставке и такси:\n\n📊 Статистика и новости парка\n👫 Сообщество водителей\n🤝 Поддержка и подключение\n\nЕсли у тебя нет своего транспорта и нужна аренда — напиши менеджеру.\n\nА если ты ещё не в парке Doda taxi — мы подключим тебя за пару минут на лучших условиях 👇",

    welcome_after_video:
      "Добро пожаловать в бота Doda taxi!\n\nТут ты найдёшь всё, что нужно для работы в доставке и такси:\n\n📊 Статистика и новости парка\n👫 Сообщество водителей\n🤝 Поддержка и подключение\n\nЕсли у тебя нет своего транспорта и нужна аренда — напиши менеджеру.\n\nА если ты ещё не в парке Doda taxi — мы подключим тебя за пару минут на лучших условиях 👇",

    faq_intro: "Раздел для тех, кто уже в парке Doda taxi — выбери вопрос:",
    faq_back: "◀️ В главное меню",

    support:
      "Техподдержка: опиши проблему одним сообщением (номер телефона в заявке, сервис, что уже пробовал). Мы передадим запрос оператору.",

    arenda:
      "Аренда транспорта: свяжитесь с менеджером в Telegram — @{manager}.\n\nКоманда для возврата: /start",

    ask_phone:
      "📱 Укажи российский номер для заявки: +7… (10 цифр после 7), или 8…, или 10 цифр без кода. Можно отправить контакт 📎 (только РФ).",

    /** HTML: buildAskPhoneHtml — asosiy qator BK uslubida */
    ask_phone_body_ru:
      "Для подключения отправьте 📱📞 номер <b>текстом в чат</b> или <b>контактом</b> (скрепка → Контакт). Подсказка — кнопки <b>под этим сообщением</b> 👇",

    /** Havolalar yo‘q bo‘lsa */
    ask_phone_legal_plain:
      "Отправляя свой номер телефона, Вы даёте согласие на обработку персональных данных для оформления заявки в парке Doda taxi.",

    /** HTML; {privacy_url} {referral_url} {tournament_url} {zaruba_url} */
    ask_phone_legal_ru_html:
      "Отправляя свой номер телефона, Вы даёте согласие на обработку персональных данных на условиях <a href=\"{privacy_url}\">Политики конфиденциальности</a>, а также соглашаетесь с <a href=\"{referral_url}\">Правилами реферальной программы</a>, <a href=\"{tournament_url}\">Правилами проведения акции «Турнир»</a>, <a href=\"{zaruba_url}\">Правилами проведения акции «Заруба»</a>.",

    err_phone_invalid:
      "Нужен номер России: +7XXXXXXXXXX, 8XXXXXXXXXX или 10 цифр без кода. Номера других стран не принимаются.",

    err_phone_no_media:
      "На этом шаге не нужны фото или файлы — напиши номер текстом или отправь контакт.",

    phone_contact_via_attachment:
      "📎 Скрепка → Контакт или напиши номер в чат (+7… / 8…).",

    phone_type_number_cb: "Напиши номер в чат: +7… или 8…",

    confirm_phone: (phone) => `Ты использовал номер телефона: ${phone}`,

    ask_category:
      "В какой категории планируешь выполнять заказы? Если нужна аренда транспорта — /ARENDA",

    cat_car: "🚗 Легковое авто",
    cat_truck: "🚚 Грузовое авто",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Велосипед",
    cat_foot: "🚶 Пешая доставка",

    confirm_category: (label) => `Ты выбрал выполнять заказы в категории ${label}`,

    ask_vehicle_rf:
      "🚗 Легковое авто: где зарегистрирован транспорт?\n\n" +
      "• Россия (🇷🇺) — СТС: обычно одно фото, все поля должны быть читаемы.\n" +
      "• Иностранное ТС (🌍) — техпаспорт: два отдельных шага — сначала лицевая сторона, затем оборот (два фото).",

    btn_vehicle_rf_sts: "🇷🇺 Учёт в РФ — СТС",
    btn_vehicle_foreign_tech: "🌍 Иностранное ТС — техпаспорт (лицо + оборот)",

    confirm_vehicle_rf: (rf) =>
      rf
        ? "Учёт в РФ — далее загрузим фото СТС."
        : "Иностранное ТС — далее два фото техпаспорта: лицевая сторона, затем оборот.",

    ask_city:
      "В каком городе будешь выполнять заказы? Можешь нажать кнопку или написать город текстом. Если городов несколько — укажи основной.",

    err_city_need_text: "Напиши название города текстом, без фото.",

    confirm_city: (city) => `Ты выбрал выполнять заказы в городе ${city}`,

    ask_citizenship: "Являешься ли ты гражданином РФ?",

    confirm_citizenship: (yes) =>
      `Ты указал наличие гражданства РФ: ${yes ? "Да" : "Нет"}`,

    ask_self_employed: "Являешься ли ты самозанятым?",

    confirm_self_employed: (yes) =>
      `Наличие самозанятости: ${yes ? "Да" : "Нет"}`,

    ask_inn: "Напиши ИНН (10–13 цифр).",

    err_inn_invalid: "ИНН должен быть числом из 10–13 цифр.",

    confirm_inn: (inn) => `Ты указал ИНН: ${inn}`,

    ask_bike_smz_phone:
      "Укажи номер телефона, привязанный к приложению «Мой налог» (РФ: +7… или 8…).",

    err_bike_smz_phone_invalid:
      "Нужен номер РФ: +7XXXXXXXXXX, 8XXXXXXXXXX или 10 цифр без кода страны.",

    confirm_bike_smz_phone: (phone) => `Телефон «Мой налог»: ${phone}`,

    ask_bike_smz_address:
      "Напиши полный адрес одним сообщением: город, улица, подъезд, квартира (всё читаемо).",

    err_bike_smz_address_short:
      "Слишком коротко. Укажи город, улицу, подъезд и квартиру.",

    err_bike_smz_address_no_media:
      "Нужен текст адреса, без фото.",

    confirm_bike_smz_address: (addr) => `Адрес: ${addr}`,

    ask_thermal: "У тебя есть термокороб?",

    confirm_thermal: (yes) =>
      `Вы указали наличие термокороба: ${yes ? "Да" : "Нет, необходимо приобрести"}`,

    edit_btn: "↩️ Изменить выбор",

    review_hint:
      "👇 Данные из твоей заявки готовы к отправке.\n\nУбедись, что все правильно и нажми «✅ Отправить».\n\nЕсли нужно изменить какое-то поле — нажми на кнопку с его названием.",

    review_callback_stale:
      "Эти кнопки работают на экране проверки заявки. Продолжи регистрацию или открой последнее сообщение бота, /start",

    submit_btn: "✅ Отправить",

    summary_vehicle_rf: "РФ — СТС",
    summary_vehicle_foreign: "Иностранное ТС — техпаспорт",

    btn_continue: "Продолжить 👉",

    ask_license_front:
      "Отправь ОДНО фото ВУ (водительского удостоверения) с передней стороны",

    confirm_license_uploaded:
      "✅ Фото ВУ загружено\n\nУбедись, что на фото хорошо видны и читабельны все поля и нажми кнопку «Продолжить 👉»\n\nлибо отправь другое фото ВУ с передней стороны для замены",

    ask_sts_front:
      "Отправь ОДНО фото СТС: все поля должны быть читаемы (обычно разворот или лицевая сторона бланка).",

    ask_tech_passport_front:
      "Техпаспорт иностранного ТС — ЛИЦЕВАЯ сторона (одно фото).",

    ask_tech_passport_back:
      "Техпаспорт иностранного ТС — ОБОРОТ (одно фото).",

    confirm_tech_passport_front:
      "✅ Лицевая сторона техпаспорта загружена\n\nПроверь читаемость и нажми «Продолжить 👉» или пришли другое фото.",

    confirm_tech_passport_back:
      "✅ Оборот техпаспорта загружен\n\nПроверь читаемость и нажми «Продолжить 👉» или пришли другое фото.",

    confirm_sts_uploaded:
      "✅ Фото СТС автомобиля загружено\n\nУбедись, что на фото хорошо видны и читабельны все поля и нажми кнопку «Продолжить 👉»\n\nлибо отправь другое фото СТС автомобиля с передней стороны для замены",

    ask_truck_dimensions:
      "Выбери габариты грузового отсека своего авто длина/ширина/высота",

    truck_dim_btn_S: "S - от 170х100х90 см.",
    truck_dim_btn_M: "M - от 260х130х150 см.",
    truck_dim_btn_L: "L - от 380х180х180 см.",
    truck_dim_btn_XL: "XL - от 400х190х200 см.",
    truck_dim_btn_XXL: "XXL - от 500х200х200 см.",

    confirm_truck_dimensions: (label) => `Вы указали габариты авто: ${label}`,

    ask_truck_payload:
      "Укажи грузоподъемность грузового отсека в кг\n\nНапример:\n2300",

    err_truck_payload_number: "Напиши грузоподъемность числом в кг (например 2300).",

    confirm_truck_payload: (kg) =>
      `Вы указали грузоподъемность: ${new Intl.NumberFormat("ru-RU").format(kg)}`,

    ask_truck_loaders: "Укажи количество грузчиков.",

    truck_loader_btn_0: "🙅‍♂️ Ни одного",
    truck_loader_btn_1: "🙋‍♂️ Один",
    truck_loader_btn_2: "🙋‍♂️🙋‍♂️ Два",

    confirm_truck_loaders: (n) => {
      const labels = ["🙅‍♂️ Ни одного", "🙋‍♂️ Один", "🙋‍♂️🙋‍♂️ Два"];
      return `Вы указали количество грузчиков: ${labels[n] ?? n}`;
    },

    ask_truck_branding: "Есть ли у авто оклейка (брендинг) кузова?",

    confirm_truck_branding: (yes) =>
      `Вы указали наличие оклейки: ${yes ? "Да" : "Нет"}`,

    passport_legal_block: "Отправь фото разворота паспорта",

    passport_legal_block_bike: "Отправь фото разворота паспорта",

    confirm_passport_uploaded:
      "✅ Фото загружено\n\nнажми кнопку «Продолжить 👉»\n\nлибо отправь другое фото, если хочешь заменить",

    doc_line_passport_spread: "✅ Фото разворота паспорта Медиа (1 шт.)",

    final_wait_intro:
      "Отлично!\n\nМенеджеры уже готовят твой аккаунт – 20 минут и все будет в лучшем виде 👌\nПо завершении регистрации ты получишь здесь сообщение с дальнейшей инструкцией",

    final_wait_community:
      "А пока вступай в сообщество Doda taxi твоего города: {link}\n\nРебята во главе с куратором регулярно делятся актуальными фишками и лайфхаками по доходу, помогают друг другу по всем вопросам. В том числе новичкам 🤝\n\nВливайся в движ и не стесняйся задавать любые вопросы – это поможет тебе быстрее выйти на классные результаты в доставке 💪",

    /** @deprecated use final_wait_intro + final_wait_community */
    final_wait:
      "Отлично! Менеджеры уже готовят твой аккаунт — около 20 минут.",

    use_menu: "Используй кнопки внизу экрана или /start.",

    err_use_buttons_category:
      "Выбери категорию кнопкой ниже.",

    err_doc_need_photo:
      "На этом шаге отправь фото или PDF-файл, не текстовое сообщение.",

    err_bank_need_text:
      "Для банка напиши в одном сообщении номер карты (16 цифр) и телефон, привязанный к банку.",

    err_wrong_media_type:
      "Не подходит: видео, голос или стикер. Нужно фото или документ (PDF).",

    err_doc_mime: "Допустимы только изображения (JPEG/PNG) или PDF.",

    summary_titles: {
      phone: "Телефон для авторизации",
      category: "Класс доставки",
      city: "Город",
      citizenship: "Гражданство РФ",
      thermal: "Термокороб",
      passport_foreign: "Иностранцы паспорт",
      passport_rf: "Паспорт",
      passport: "Паспорт",
      vehicle: "Учёт ТС / авто",
      truck_dims: "Грузовое габариты",
      truck_payload: "Грузовое грузоподъемность",
      truck_loaders: "Количество грузчиков",
      truck_wrap: "Грузовое оклейка",
      self_employed: "Самозанятость",
      inn: "ИНН",
      bike_smz_phone: "Тел. «Мой налог»",
      bike_smz_address: "Адрес (СМЗ)",
      bike_thermal: "Вело термокороб",
      bike_passport: "Вело паспорт",
    },

    summary_yes: "Да",
    summary_no: "Нет",
    summary_thermal_no: "Нет, необходимо приобрести",

    summary_passport_media: "Медиа (1 шт.)",

    group_header_new: "🔔 Новая заявка · Doda taxi",
    group_separator: "━━━━━━━━━━━━━━━━━━━━",
    group_anketa_heading: "📋 АНКЕТА",
    group_label_name: "👤 Имя:",
    group_label_telegram: "📱 Telegram:",
    group_label_phone: "📞 Телефон:",
    group_label_category: "🚗 Класс доставки:",
    group_label_vehicle: "🚙 Учёт ТС:",
    group_label_city: "🏙 Город:",
    group_label_citizenship: "🪪 Гражданство РФ:",
    group_label_truck_dims: "📐 Габариты:",
    group_label_truck_payload: "⚖️ Грузоподъемность:",
    group_label_truck_loaders: "👷 Грузчики:",
    group_label_truck_branding: "🏷 Оклейка / брендинг:",
    group_label_bike_self: "🧾 Самозанятость:",
    group_label_bike_inn: "#️⃣ ИНН:",
    group_label_bike_smz_phone: "📱 Телефон «Мой налог»:",
    group_label_bike_smz_address: "📍 Адрес (город, улица, подъезд, квартира):",
    group_label_bike_thermal: "📦 Вело термокороб:",
    group_docs_heading: "📎 ДОКУМЕНТЫ",
    group_docs_empty:
      "Файлы по заявке не прикреплены (проверьте загрузки).",
    group_docs_intro:
      "Вложений: {count} (ниже — по порядку, как в анкете).",
    group_bank_heading: "🏦 БАНК (текст из заявки)",
    group_footer_done:
      "━━━━━━━━━━━━━━━━━━━━\n✅ Заявка принята, все файлы получены\n━━━━━━━━━━━━━━━━━━━━",
    group_caption_license: "Водительское удостоверение (ВУ)",
    group_caption_sts: "СТС — свидетельство о регистрации ТС",
    group_caption_tech_passport_front:
      "Техпаспорт иностранного ТС — лицевая сторона",
    group_caption_tech_passport_back:
      "Техпаспорт иностранного ТС — оборот",
    group_caption_passport: "Паспорт (разворот)",
    group_caption_bank: "Банковские реквизиты",
    group_truck_kg: "{value} кг",
    group_truck_loader_word_0: "ни одного",
    group_truck_loader_word_1: "один",
    group_truck_loader_word_2: "два",
    group_value_dash: "—",

    ask_service:
      "Выберите сервис подключения кнопкой ниже.",

    yx_final_thanks:
      "Благодарим за предоставленные сведения. Заявка принята; мы свяжемся с вами в ближайшее время.",

    yx_review_use_buttons:
      "На этом шаге доступны только кнопки под сообщением (в т.ч. «✅ Отправить»).",

    yx_need_video:
      "На этом шаге отправьте короткое видео (кружок не подойдёт).",

    group_header_yandex: "🔔 Новая заявка · Яндекс Лавка / Еда",
    group_label_yandex_service: "🛒 Сервис:",
    group_label_yandex_city: "🏙 Город:",
    group_label_yandex_citizen: "🪪 Гражданство / статус:",
    group_label_yandex_uzdoc: "📄 Тип документа (УЗ/ТЖ):",
    group_label_yandex_kzdoc: "📄 Документ КЗ/КГ:",
    group_label_yandex_tmvisa: "📄 Виза ТМ:",
    group_yandex_text_heading: "📝 ТЕКСТОВЫЕ ПОЛЯ",
    group_caption_yx_generic: "Вложение заявки (Яндекс)",

    yx_btn_doda: "Ru Park Doda курьер",
    yx_btn_lavka: "Яндекс Лавка",
    yx_btn_eats: "Яндекс Еда",

    yx_city_msk: "Москва",
    yx_city_mo: "Московская область",

    yx_ask_city:
      "Укажите Москву или Московскую область кнопкой ниже.",
    yx_ask_citizen: "Укажите ваш статус / гражданство кнопкой ниже.",
    yx_ask_uz_doc: "Выберите тип подтверждающего документа.",
    yx_ask_kz_doc_kz:
      "Гражданину Казахстана: выберите вариант кнопкой ниже.",
    yx_ask_kz_doc_kg:
      "Гражданину Кыргызстана: выберите вариант кнопкой ниже.",
    yx_ask_kz_doc_neutral: "Выберите вариант кнопкой ниже.",
    yx_ask_tm_visa:
      "Какой тип визы? Выберите кнопкой ниже: туристическая или рабочая.",

    yx_cit_uz: "Узбекистан",
    yx_cit_tj: "Таджикистан",
    yx_cit_kz: "Казахстан",
    yx_cit_kg: "Кыргызстан",
    yx_cit_other: "Или другое",
    yx_cit_uz_tj: "Узбекистан / Таджикистан",
    yx_cit_kz_kg: "Казахстан / Кыргызстан",
    yx_cit_rf: "Гражданин РФ",
    yx_cit_tm: "Туркменистан",

    yx_doc_patent: "Патент",
    yx_doc_vnzh: "ВНЖ / РВП",
    yx_doc_student: "Студент",

    yx_kz_pass: "Паспорт",
    yx_kz_id: "Удостоверение личности (ID)",

    yx_tm_work: "Рабочая виза",
    yx_tm_tourism: "Туристическая виза",
    yx_tm_tourism_blocked:
      "С туристической визой сейчас подключить не можем — полное оформление только с рабочей визой. Выберите «Рабочая виза».",

    yx_ram_reg: "Регистрация",
    yx_ram_amina: "Амина",

    yx_p_ram_choice:
      "Укажите: регистрация по месту пребывания или документ «Амина» — кнопкой ниже.",

    yx_review_hint:
      "Проверьте данные. Для отправки нажмите «✅ Отправить».",

    yx_rev_title: "Проверка заявки (Яндекс)",
    yx_rev_service: "Сервис",
    yx_rev_city: "Город",
    yx_rev_citizen: "Статус",
    yx_rev_uzdoc: "Документ УЗ/ТЖ",
    yx_rev_kzdoc: "Документ КЗ/КГ",
    yx_rev_tmvisa: "Виза ТМ",
    yx_rev_files: "Шагов пройдено (включая текстовые)",

    yx_use_buttons: "На этом шаге выберите вариант кнопкой ниже.",
    yx_confirm_doc_preview:
      "✅ Файл принят\n\nПроверьте качество и нажмите «Продолжить 👉»\n\nили «↩️ Изменить выбор» — отправить другой файл.",
    yx_press_continue_first:
      "Сначала нажмите «Продолжить 👉» или «↩️ Изменить выбор», чтобы перезагрузить.",
    yx_need_text: "Отправьте текст одним сообщением (без фото и файлов).",
    yx_bad_text:
      "Проверьте формат: карта — 16 цифр; телефон — РФ; ИНН — 10 или 12 цифр; СНИЛС — 11 цифр; поле не пустое.",
    yx_file_ok: "Принято. Переходим к следующему шагу.",

    yx_lbl_yx_col_req_text: "Реквизиты (текст)",
    yx_lbl_yx_col_card16: "Номер карты",
    yx_lbl_yx_col_contact_phone: "Контактный телефон",
    yx_lbl_yx_col_tm_contact: "Контактный телефон",
    yx_lbl_yx_col_inn: "ИНН",
    yx_lbl_yx_col_snils: "СНИЛС",

    yx_p_req_video:
      "Отправьте короткое видео с реквизитами банковской карты (без лица и паспорта).",
    yx_p_req_photo:
      "Отправьте фото с реквизитами банковской карты (без лица и паспорта).",
    yx_p_req_text:
      "Одним сообщением укажите банковские реквизиты (как в инструкции сервиса).",
    yx_p_card16: "Введите номер банковской карты — 16 цифр подряд (можно с пробелами).",

    yx_p_uz_pat_pass: "Фото паспорта (разворот с фото).",
    yx_p_uz_pat_front: "Фото патента — лицевая сторона.",
    yx_p_uz_pat_back: "Фото патента — оборот.",
    yx_p_reg_f: "Фото регистрации — лицевая сторона.",
    yx_p_reg_b: "Фото регистрации — оборот.",
    yx_p_amina: "Фото документа «Амина».",
    yx_p_mig: "Фото миграционной карты.",
    yx_p_pay_ph: "Фото чека / подтверждения оплаты патента.",
    yx_p_pay_file: "Фото или PDF квитанции об оплате патента.",

    yx_p_vnzh_f: "Фото ВНЖ / РВП — лицевая сторона.",
    yx_p_vnzh_b: "Фото ВНЖ / РВП — оборот.",
    yx_p_vnzh_pass: "Фото паспорта (разворот с фото).",
    yx_p_inn: "Введите ИНН — 10 или 12 цифр.",
    yx_p_snils: "Введите СНИЛС — 11 цифр (можно с дефисами).",

    yx_p_st_bilet: "Фото студенческого билета.",
    yx_p_st_spravka: "Фото справки с места учёбы.",
    yx_p_st_pass: "Фото паспорта (разворот с фото).",

    yx_p_kz_pass_face: "Фото паспорта (разворот с фото).",
    yx_p_kz_id_f: "Фото удостоверения личности — лицевая сторона.",
    yx_p_kz_id_b: "Фото удостоверения личности — оборот.",

    yx_p_rf_pass_face: "Фото паспорта РФ (разворот с фото).",
    yx_p_rf_pass_prop: "Фото страницы с пропиской.",

    yx_p_tm_pass: "Фото паспорта (разворот с фото).",
    yx_p_tm_visa:
      "Отправьте фото визы / разрешения (тип выбран на предыдущем шаге).",
    yx_p_tm_amina_or_reg:
      "Скриншот «Амина» или фото/скан бумажной регистрации — одно фото или PDF.",

    yx_p_contact_phone: "Укажите контактный номер телефона (РФ).",

    faq: [
      {
        id: "pay",
        q: "💰 Как выводить деньги?",
        a: "Вывод в приложении партнёра (Яндекс Про / приложение парка): Профиль → Баланс → Вывод. Если не видишь — напиши в поддержку парка или нажми кнопку помощи внизу.",
      },
      {
        id: "orders",
        q: "📦 Нет заказов — что делать?",
        a: "Проверь смену, зону и лимиты аккаунта. Иногда помогает смена точки старта или время пиков.",
      },
      {
        id: "docs",
        q: "📄 Документы и проверки",
        a: "Требования зависят от сервиса и парка. Следи за уведомлениями в приложении.",
      },
      {
        id: "community",
        q: "👫 Сообщество и ссылки",
        a: "Используй приглашения из официальных сообщений бота — не переходи по сомнительным ссылкам.",
      },
    ],
  },

  tg: {
    pick_language: "Забонро интихоб кунед:",
    err_pick_lang: "Лутфан забонро бо тугмаи поён интихоб кунед.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Менюи асосӣ:",
    faq_freedom_hint: "Саволро бо тугма интихоб кунед ё /start",

    btn_in_park: "😎 Ман аллакай дар парки DODA ҳастам",
    btn_not_in_park: "🙏 Дар парки DODA нестам, пайваст кардан лозим",
    btn_support: "❓ Кӯмаки техникӣ",
    btn_therm_yes: "Ҳа",
    btn_therm_no: "Не, харидан лозим",
    cit_yes: "Ҳа",
    cit_no: "Не",
    city_other_btn: "✏️ Шаҳри дигар (матн)",

    welcome_video_missing:
      "Ба боти экосистемаи БОГАТЫЙ КУРЬЕР хуш омадед!\n\nИн ҷо ҳама чиз барои даромади курьерҳо: Заруба, турнир, реферал, ҷамоа, статистика.\n\nИҷора лозим? 👉 /ARENDA\n\nАгар дар парк нестед — дар як дақиқа пайваст мешавем 👇",

    welcome_after_video:
      "Ба боти экосистемаи БОГАТЫЙ КУРЬЕР хуш омадед!\n\nИн ҷо ҳама чиз барои даромади курьерҳо.\n\n/ARENDA — иҷора\n\nАгар дар парк нестед — пайваст мешавем 👇",

    faq_intro: "Аллакай дар парк ҳастед — саволро интихоб кунед:",
    faq_back: "◀️ Ба менюи асосӣ",

    support:
      "Кӯмаки техникӣ: мушкилотро дар як паём нависед (рақам, чӣ кӯшиш кардед).",

    arenda:
      "Иҷора: барои алоқа бо менеҷер дар Telegram — @{manager}.\n\nБозгашт: /start",

    ask_phone:
      "📱 Барои дархост рақами Русия: +7… ё 8…, ё контакт 📎 (танҳо РФ).",

    ask_phone_keyboard_nudge:
      "👇 Тугмаҳои зери паём ё рақамро матн фиристед.",

    err_phone_invalid:
      "Танҳо рақами Русия: +7, 8 ё 10 рақам бе коди кишвар.",

    err_phone_no_media:
      "Акс лозим нест — рақамро матн ё контакт фиристед.",

    phone_contact_via_attachment:
      "📎 Пайваст → Контакт ё рақамро матн фиристед (+7…).",

    phone_type_number_cb: "Рақамро ба чат нависед: +7…",

    confirm_phone: (phone) => `Рақам: ${phone}`,

    ask_category: "Дар кадом категория кор мекунед? Иҷора — /ARENDA",

    cat_car: "🚗 Мошини сабук",
    cat_truck: "🚚 Боркаш",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Дучарха",
    cat_foot: "🚶 Пиёда",

    confirm_category: (label) => `Категория: ${label}`,

    ask_vehicle_rf:
      "🚗 Мошини сабук: нақлиёт дар куҷо ба қайд гирифта шудааст?\n\n" +
      "• Дар Русия (🇷🇺) — СТС: одатан як акс (ҳамаи майдонҳо хонда шаванд).\n" +
      "• ТС-и хориҷӣ (🌍) — техпаспорт: аввал рӯй, баъд пушт — 2 акси алоҳида.",

    btn_vehicle_rf_sts: "🇷🇺 Дар РФ ба қайд — СТС",
    btn_vehicle_foreign_tech: "🌍 ТС хориҷӣ — техпаспорт (рӯй + пушт)",

    confirm_vehicle_rf: (rf) =>
      rf
        ? "Ба қайд дар РФ — баъд акси СТС."
        : "ТС хориҷӣ — аввал рӯи техпаспорт, баъд пушт.",

    summary_vehicle_rf: "РФ — СТС",
    summary_vehicle_foreign: "ТС хориҷӣ — техпаспорт",

    btn_continue: "Идома 👉",

    ask_license_front:
      "Гувоҳномаи ронандагӣ (ВУ) — аз тарафи пеш як акс фиристед.",

    confirm_license_uploaded:
      "✅ Акси ВУ гирифта шуд\n\nХонданашро санҷед ва «Идома 👉»-ро пахш кунед\n\nё акси дигар фиристед.",

    ask_sts_front:
      "СТС — як акс: ҳамаи сатрҳо хонда шаванд (одатан кушода ё саҳифаи асосӣ).",

    ask_tech_passport_front:
      "Техпаспорти ТС хориҷӣ — тарафи РӮЙ (як акс).",

    ask_tech_passport_back:
      "Техпаспорти ТС хориҷӣ — тарафи ПУШТ (як акс).",

    confirm_tech_passport_front:
      "✅ Рӯи техпаспорт гирифта шуд\n\n«Идома 👉» ё акси дигар.",

    confirm_tech_passport_back:
      "✅ Пушти техпаспорт гирифта шуд\n\n«Идома 👉» ё акси дигар.",

    confirm_sts_uploaded:
      "✅ Акси СТС гирифта шуд\n\nХонданашро санҷед ва «Идома 👉»-ро пахш кунед\n\nё акси дигар фиристед.",

    ask_city: "Дар кадом шаҳр кор мекунед? Тугма ё матн.",

    err_city_need_text: "Номи шаҳрро матн нависед, акс нафиристед.",

    confirm_city: (city) => `Шаҳр: ${city}`,

    ask_citizenship: "Шумо шаҳрванди РФ ҳастед?",

    confirm_citizenship: (yes) => `Шаҳрвандии РФ: ${yes ? "Ҳа" : "Не"}`,

    ask_bike_smz_phone:
      "Рақами телефонро нависед, ки ба барномаи «Мой налог» пайваст аст (РФ: +7… ё 8…).",

    err_bike_smz_phone_invalid:
      "Рақами РФ лозим: +7XXXXXXXXXX, 8XXXXXXXXXX ё 10 рақам бе коди кишвар.",

    confirm_bike_smz_phone: (phone) => `Телефони «Мой налог»: ${phone}`,

    ask_bike_smz_address:
      "Суроғаи пурраро дар як паём нависед: шаҳр, кӯча, даромадгоҳ, квартира.",

    err_bike_smz_address_short:
      "Хеле кӯтоҳ. Шаҳр, кӯча, даромадгоҳ ва квартираро нишон диҳед.",

    err_bike_smz_address_no_media:
      "Суроға матн бошад; акс нафиристед.",

    confirm_bike_smz_address: (addr) => `Суроға: ${addr}`,

    ask_thermal: "Қуттии термӣ доред?",

    confirm_thermal: (yes) =>
      `Термокороб: ${yes ? "Ҳа" : "Не, харидан лозим"}`,

    edit_btn: "↩️ Тағйир додан",

    review_hint:
      "👆 Маълумот омода аст. «✅ Фиристодан» ё тағйири майдон.",

    review_callback_stale:
      "Ин тугмаҳо дар экрани санҷиши ариза кор мекунанд. Регистрацияро идома диҳед ё охирин паёми ботро кушоед, /start",

    submit_btn: "✅ Фиристодан",

    final_wait:
      "Хуб! Менеҷерҳо омода мекунанд — тақрибан 20 дақиқа.\n\nҶамоа: https://t.me/+HCQG5WLhKNk3Y2My",

    use_menu: "Аз тугмаҳо истифода баред ё /start.",

    err_use_buttons_category: "Категорияро бо тугма интихоб кунед.",

    err_doc_need_photo: "Акс ё PDF фиристед, матн не.",

    err_bank_need_text:
      "Барои бонк дар як паём рақами корт ва телефонро нависед.",

    err_wrong_media_type:
      "Видео/овоз/стикер нест — акс ё ҳуҷҷат (PDF).",

    err_doc_mime: "Танҳо акс (JPEG/PNG) ё PDF.",

    summary_titles: {
      phone: "Телефон (авторизатсия)",
      category: "Намуди расонидан",
      city: "Шаҳр",
      citizenship: "Шаҳрвандии РФ",
      thermal: "Термокороб",
      passport_foreign: "Паспорти хориҷӣ",
      passport_rf: "Паспорт",
      passport: "Паспорт",
      vehicle: "Ҳисоби ТС",
      truck_dims: "Андозаҳои боркаш",
      truck_payload: "Борбардорӣ",
      truck_loaders: "Боркашон",
      truck_wrap: "Брендинг",
      self_employed: "Худкорӣ",
      inn: "ИНН",
      bike_smz_phone: "Тел. «Мой налог»",
      bike_smz_address: "Суроға (СМЗ)",
      bike_thermal: "Термокороби вело",
      bike_passport: "Паспорт",
    },

    summary_passport_media: "Медиа (1 адад)",

    summary_yes: "Ҳа",
    summary_no: "Не",
    summary_thermal_no: "Не, харидан лозим",

    group_header_new: "🔔 Аризаи нав · Doda taxi",
    group_separator: "━━━━━━━━━━━━━━━━━━━━",
    group_anketa_heading: "📋 АНКЕТА",
    group_label_name: "👤 Ном:",
    group_label_telegram: "📱 Telegram:",
    group_label_phone: "📞 Телефон:",
    group_label_category: "🚗 Намуди расонидан:",
    group_label_vehicle: "🚙 Ҳисоби ТС:",
    group_label_city: "🏙 Шаҳр:",
    group_label_citizenship: "🪪 Шаҳрвандии РФ:",
    group_label_truck_dims: "📐 Андоза:",
    group_label_truck_payload: "⚖️ Борбардорӣ:",
    group_label_truck_loaders: "👷 Боркашон:",
    group_label_truck_branding: "🏷 Брендинг:",
    group_label_bike_self: "🧾 Худкорӣ:",
    group_label_bike_inn: "#️⃣ ИНН:",
    group_label_bike_smz_phone: "📱 Телефони «Мой налог»:",
    group_label_bike_smz_address: "📍 Суроға (шаҳр, кӯча, даромадгоҳ, квартира):",
    group_label_bike_thermal: "📦 Термокороби вело:",
    group_docs_heading: "📎 ҲУҶҶАТҲО",
    group_docs_empty: "Ба ариза файлҳо замима нашудаанд.",
    group_docs_intro: "Замимаҳо: {count} (дар поён — мувофиқи анкета).",
    group_bank_heading: "🏦 БАНК (матн аз ариза)",
    group_footer_done:
      "━━━━━━━━━━━━━━━━━━━━\n✅ Ариза қабул шуд, ҳама файлҳо гирифта шуданд\n━━━━━━━━━━━━━━━━━━━━",
    group_caption_license: "Гувоҳиномаи ронандагӣ (ВУ)",
    group_caption_sts: "СТС — гувоҳномаи сабти ТС",
    group_caption_tech_passport_front:
      "Техпаспорти ТС хориҷӣ — рӯёна",
    group_caption_tech_passport_back:
      "Техпаспорти ТС хориҷӣ — пушта",
    group_caption_passport: "Паспорт (ворид)",
    group_caption_bank: "Маълумоти бонкӣ",
    group_truck_kg: "{value} кг",
    group_truck_loader_word_0: "ҳеҷ кадом",
    group_truck_loader_word_1: "як",
    group_truck_loader_word_2: "ду",
    group_value_dash: "—",

    ask_service:
      "Туташуу сервисин төмөнкү баскыч менен тандаңыз.",

    yx_final_thanks:
      "Ташаккур барои маълумоти пешниҳодшуда. Дархост қабул шуд; ба наздикӣ бо шумо тамос мегирем.",

    yx_review_use_buttons:
      "Бул кадамда билдирүүнүн астындагы баскычтар гана иштейт (анын ичинде «✅ Жөнөтүү»).",

    yx_need_video:
      "Бул кадамда кыска видео жөнөтүңүз (видео-доира туура келбейт).",

    group_header_yandex: "🔔 Жаңы арыз · Yandex Lavka / Eda",
    group_label_yandex_service: "🛒 Сервис:",
    group_label_yandex_city: "🏙 Шаар:",
    group_label_yandex_citizen: "🪪 Жарандык / статус:",
    group_label_yandex_uzdoc: "📄 Документ түрү (УЗ/ТЖ):",
    group_label_yandex_kzdoc: "📄 Документ (КЗ/КГ):",
    group_label_yandex_tmvisa: "📄 ТМ визасы:",
    group_yandex_text_heading: "📝 ТЕКСТ ТАЛААЛАРЫ",
    group_caption_yx_generic: "Арыз тиркемеси (Yandex)",

    yx_btn_doda: "Ru Park Doda курьер",
    yx_btn_lavka: "Yandex Lavka",
    yx_btn_eats: "Yandex Eda",

    yx_city_msk: "Москва",
    yx_city_mo: "Вилояти Москва",

    yx_ask_city:
      "Москва же Москванын областин төмөнкү баскыч менен тандаңыз.",
    yx_ask_citizen: "Статус / жарандыгыңызды төмөнкү баскыч менен тандаңыз.",
    yx_ask_uz_doc: "Тастыктоочу документтин түрүн тандаңыз.",
    yx_ask_kz_doc_kz:
      "Казакстан жараны үчүн: төмөнкү баскыч менен тандаңыз.",
    yx_ask_kz_doc_kg:
      "Кыргызстан жараны үчүн: төмөнкү баскыч менен тандаңыз.",
    yx_ask_kz_doc_neutral: "Төмөнкү баскыч менен тандаңыз.",
    yx_ask_tm_visa:
      "Кайсы түрдөгү виза? Төмөнкү баскычтардан тандаңыз: туризм же иш визасы.",

    yx_cit_uz: "Өзбекстан",
    yx_cit_tj: "Тажикстан",
    yx_cit_kz: "Казакстан",
    yx_cit_kg: "Кыргызстан",
    yx_cit_other: "Же башка",
    yx_cit_uz_tj: "Өзбекстан / Тажикстан",
    yx_cit_kz_kg: "Казакстан / Кыргызстан",
    yx_cit_rf: "РФ жараны",
    yx_cit_tm: "Түркмөнстан",

    yx_doc_patent: "Патент",
    yx_doc_vnzh: "ВНЖ / РВП",
    yx_doc_student: "Студент",

    yx_kz_pass: "Паспорт",
    yx_kz_id: "ID (жеке күбөлүк)",

    yx_tm_work: "Жумушчу виза",
    yx_tm_tourism: "Туризм визасы",
    yx_tm_tourism_blocked:
      "Туризм визасы менен азыр туташтыра албайбыз; толук каттоо үчүн гана жумуш визасы ылайыктуу. «Жумушчу виза»ны тандаңыз.",

    yx_ram_reg: "Каттоо",
    yx_ram_amina: "Амина",

    yx_p_ram_choice:
      "Төмөнкүдөн тандаңыз: жашаган жер боюнча каттоо же «Амина» документи.",

    yx_review_hint:
      "Маалыматты текшериңиз. Жөнөтүү үчүн «✅ Жөнөтүү» баскычын басыңыз.",

    yx_rev_title: "Арызды текшерүү (Yandex)",
    yx_rev_service: "Сервис",
    yx_rev_city: "Шаар",
    yx_rev_citizen: "Статус",
    yx_rev_uzdoc: "УЗ/ТЖ документи",
    yx_rev_kzdoc: "КЗ/КГ документи",
    yx_rev_tmvisa: "ТМ визасы",
    yx_rev_files: "Өтүлгөн кадамдар (текст менен кошо)",

    yx_use_buttons: "Бул кадамда вариантты төмөнкү баскыч менен тандаңыз.",
    yx_confirm_doc_preview:
      "✅ Файл кабыл алынды\n\nКөрүнүшүн текшериңиз жана «Улантуу 👉» баскычын басыңыз\n\nже «↩️ Өзгөртүү» — башка файл жөнөтүңүз.",
    yx_press_continue_first:
      "Алды менен «Улантуу 👉» баскычын басыңыз же «↩️ Өзгөртүү» менен кайра жүктөңүз.",
    yx_need_text: "Текстти бир билдирүү менен жөнөтүңүз (сүрөтсүз жана файлсыз).",
    yx_bad_text:
      "Форматты текшериңиз: карта — 16 сан; телефон — РФ; ИНН — 10 же 12 сан; СНИЛС — 11 сан; талаа бош болбосун.",
    yx_file_ok: "Кабыл алынды. Кийинки кадамга өтөбүз.",

    yx_lbl_yx_col_req_text: "Реквизиттер (текст)",
    yx_lbl_yx_col_card16: "Карта номери",
    yx_lbl_yx_col_contact_phone: "Байланыш телефону",
    yx_lbl_yx_col_tm_contact: "Байланыш телефону",
    yx_lbl_yx_col_inn: "ИНН",
    yx_lbl_yx_col_snils: "СНИЛС",

    yx_p_req_video:
      "Банк картасынын реквизиттери менен кыска видео жөнөтүңүз (бет жана паспорт жок).",
    yx_p_req_photo:
      "Банк картасынын реквизиттери менен сүрөт жөнөтүңүз (бет жана паспорт жок).",
    yx_p_req_text:
      "Банк реквизиттерин бир билдирүү менен жазыңыз (сервис нускамасына ылайык).",
    yx_p_card16: "Банк картасынын номерин киргизиңиз — 16 сан катары менен (боштук менен да болот).",

    yx_p_uz_pat_pass: "Паспорттун сүрөтү (сүрөтү бар бети).",
    yx_p_uz_pat_front: "Патенттин сүрөтү — алдыңкы бет.",
    yx_p_uz_pat_back: "Патенттин сүрөтү — арткы бет.",
    yx_p_reg_f: "Каттоонун сүрөтү — алдыңкы бет.",
    yx_p_reg_b: "Каттоонун сүрөтү — арткы бет.",
    yx_p_amina: "«Амина» документинин сүрөтү.",
    yx_p_mig: "Миграция картасынын сүрөтү.",
    yx_p_pay_ph: "Патент төлөмүнүн чеки / тастыктоосу сүрөтү.",
    yx_p_pay_file: "Патент төлөм квитанциясы (сүрөт же PDF).",

    yx_p_vnzh_f: "ВНЖ / РВП сүрөтү — алдыңкы бет.",
    yx_p_vnzh_b: "ВНЖ / РВП сүрөтү — арткы бет.",
    yx_p_vnzh_pass: "Паспорттун сүрөтү (сүрөтү бар бети).",
    yx_p_inn: "ИНН киргизиңиз — 10 же 12 сан.",
    yx_p_snils: "СНИЛС киргизиңиз — 11 сан (сызыкча менен да болот).",

    yx_p_st_bilet: "Студенттик билеттин сүрөтү.",
    yx_p_st_spravka: "Окуу жайдан маалымкаттын сүрөтү.",
    yx_p_st_pass: "Паспорттун сүрөтү (сүрөтү бар бети).",

    yx_p_kz_pass_face: "Паспорттун сүрөтү (сүрөтү бар бети).",
    yx_p_kz_id_f: "Жеке күбөлүктүн сүрөтү — алдыңкы бет.",
    yx_p_kz_id_b: "Жеке күбөлүктүн сүрөтү — арткы бет.",

    yx_p_rf_pass_face: "РФ паспортунун сүрөтү (сүрөтү бар бети).",
    yx_p_rf_pass_prop: "Каттоо барагынын сүрөтү.",

    yx_p_tm_pass: "Паспорттун сүрөтү (сүрөтү бар бети).",
    yx_p_tm_visa:
      "Виза / уруксат кагазынын сүрөтүн жөнөтүңүз (түрү мурунку кадамда тандалган).",
    yx_p_tm_amina_or_reg:
      "«Амина» скриншоту же кагаз регистрация — бир сүрөт же PDF.",

    yx_p_contact_phone: "Байланыш телефон номерин көрсөтүңүз (РФ).",

    faq: [
      {
        id: "pay",
        q: "💰 Пулро чӣ тавр баровардам?",
        a: "Дар барномаи шарик: Профиль → Баланс → Баровардан.",
      },
      {
        id: "orders",
        q: "📦 Фармоиш нест",
        a: "Нишаст, минтақа ва лимитҳоро санҷед.",
      },
      {
        id: "docs",
        q: "📄 Ҳуҷҷатҳо",
        a: "Талабот аз хизматрасонӣ вобаста аст.",
      },
      {
        id: "community",
        q: "👫 Ҷамоа",
        a: "Аз даъватҳои расмӣ истифода баред.",
      },
    ],
  },

  ky: {
    pick_language: "Тилди тандаңыз:",
    err_pick_lang: "Сураныч, тилди төмөнкү баскыч менен тандаңыз.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Негизги меню:",
    faq_freedom_hint: "Суроону төмөнкү баскыч менен тандаңыз же /start",

    btn_in_park: "😎 Мен DODA паркындамын",
    btn_not_in_park: "🙏 DODA паркында эмесмин, туташтыруу керек",
    btn_support: "❓ Техникалык жардам",
    btn_therm_yes: "Ооба",
    btn_therm_no: "Жок, сатып алуу керек",
    cit_yes: "Ооба",
    cit_no: "Жок",
    city_other_btn: "✏️ Башка шаар (текст)",

    welcome_video_missing:
      "БОГАТЫЙ КУРЬЕР экосистемасынын ботуна кош келиңиз!\n\nКурьерлер үчүн бардыгы: Заруба, турнир, реферал, коомчулук, статистика.\n\nАренда керек болсо 👉 /ARENDA\n\nПаркта эмес болсоңуз — эң жакшы шартта туташтырабыз 👇",

    welcome_after_video:
      "БОГАТЫЙ КУРЬЕР экосистемасынын ботуна кош келиңиз!\n\nКурьерлер үчүн керектүү маалыматтар.\n\n/ARENDA — аренда\n\nПаркта эмес болсоңуз — туташтырабыз 👇",

    faq_intro: "Паркта болсоңуз — суроону тандаңыз:",
    faq_back: "◀️ Негизги менюга",

    support:
      "Техникалык жардам: көйгөйдү бир билдирүү менен жазыңыз (телефон, эмне кылдыңыз).",

    arenda:
      "Аренда: менеджер менен байланыш — Telegram @{manager}.\n\nКайтуу: /start",

    ask_phone:
      "📱 Россия номери: +7… же 8…, же контакт 📎 (гана РФ).",

    ask_phone_keyboard_nudge:
      "👇 Билдирүүнүн астындагы баскычтар же номерди текст менен.",

    err_phone_invalid:
      "Гана Россия номери: +7XXXXXXXXXX, 8XXXXXXXXXX же 10 сан коду жок.",

    err_phone_no_media:
      "Бул кадамда сүрөт эмес — номерди текст же контакт менен жөнөтүңүз.",

    phone_contact_via_attachment:
      "📎 Тиркеме → Контакт же номерди текст менен жөнөтүңүз (+7…).",

    phone_type_number_cb: "Номерди чатка жазыңыз: +7…",

    confirm_phone: (phone) => `Телефон: ${phone}`,

    ask_category: "Кайсы категорияда иштейсиз? Аренда — /ARENDA",

    cat_car: "🚗 Жеңил унаа",
    cat_truck: "🚚 Жүк ташуучу",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Велосипед",
    cat_foot: "🚶 Жөө",

    confirm_category: (label) => `Тандалган категория: ${label}`,

    ask_vehicle_rf:
      "🚗 Жеңил унаа: транспорт кайда катталган?\n\n" +
      "• Россияда (🇷🇺) — СТС: адатта бир сүрөт (бардык талаалар окула турган болсун).\n" +
      "• Чет өлкө ТС (🌍) — техпаспорт: алды менен алдыңкы бет, андан кийин арткы бет — эки өзүнчө сүрөт.",

    btn_vehicle_rf_sts: "🇷🇺 Россияда каттоо — СТС",
    btn_vehicle_foreign_tech: "🌍 Чет өлкө ТС — техпаспорт (алд + арт)",

    confirm_vehicle_rf: (rf) =>
      rf
        ? "Россияда эсеп — кийинки кадамда СТС сүрөтү."
        : "Чет өлкө ТС — алды менен техпаспорттун алдыңкы бети, андан кийин арткы бет.",

    summary_vehicle_rf: "Россия — СТС",
    summary_vehicle_foreign: "Чет өлкө ТС — техпаспорт",

    btn_continue: "Улантуу 👉",

    ask_license_front:
      "Айдоочулук күбөлүгү (ВУ) — алдыңкы жагынан бир сүрөт жөнөтүңүз.",

    confirm_license_uploaded:
      "✅ ВУ сүрөтү кабыл алынды\n\nОкула тургандыгын текшерип «Улантуу 👉» басыңыз\n\nже башка сүрөт жөнөтүңүз.",

    ask_sts_front:
      "СТС — бир сүрөт: бардык жазуулар ачык көрүнсүн (адатта жайылма же негизги бет).",

    ask_tech_passport_front:
      "Чет өлкө ТС техпаспорту — АЛДЫНКЫ ЖАГЫ (бир сүрөт).",

    ask_tech_passport_back:
      "Чет өлкө ТС техпаспорту — АРТКЫ ЖАГЫ (бир сүрөт).",

    confirm_tech_passport_front:
      "✅ Техпаспорттун алдыңкы жагы кабыл алынды\n\n«Улантуу 👉» же башка сүрөт.",

    confirm_tech_passport_back:
      "✅ Техпаспорттун арткы жагы кабыл алынды\n\n«Улантуу 👉» же башка сүрөт.",

    confirm_sts_uploaded:
      "✅ СТС сүрөтү кабыл алынды\n\nОкула тургандыгын текшерип «Улантуу 👉» басыңыз\n\nже башка сүрөт жөнөтүңүз.",

    ask_city: "Кайсы шаарда иштейсиз? Баскыч же текст.",

    err_city_need_text: "Шаардын атын текст менен жазыңыз; сүрөт жөнөтпөңүз.",

    confirm_city: (city) => `Шаар: ${city}`,

    ask_citizenship: "РФ жаранысызбы?",

    confirm_citizenship: (yes) => `РФ жарандыгы: ${yes ? "Ооба" : "Жок"}`,

    ask_bike_smz_phone:
      "«Мой налог» колдонмосуна байланган телефон номерин жазыңыз (РФ: +7… же 8…).",

    err_bike_smz_phone_invalid:
      "РФ номери керек: +7XXXXXXXXXX, 8XXXXXXXXXX же 10 сан коду жок.",

    confirm_bike_smz_phone: (phone) => `«Мой налог» телефону: ${phone}`,

    ask_bike_smz_address:
      "Толук даректи бир билдирүү менен жазыңыз: шаар, көчө, подъезд, батир.",

    err_bike_smz_address_short:
      "Өтө кыска. Шаар, көчө, подъезд жана батирди көрсөтүңүз.",

    err_bike_smz_address_no_media:
      "Дарек текст менен; сүрөт жөнөтпөңүз.",

    confirm_bike_smz_address: (addr) => `Дарек: ${addr}`,

    ask_thermal: "Термокороб барбы?",

    confirm_thermal: (yes) =>
      `Термокороб: ${yes ? "Ооба" : "Жок, сатып алуу керек"}`,

    edit_btn: "↩️ Өзгөртүү",

    review_hint:
      "👆 Маалыматтар даяр. «✅ Жөнөтүү» же талааны оңдоо.",

    review_callback_stale:
      "Бул баскычтар текшерүү экранында гана иштейт. Каттоону улантыңыз же акыркы билдирүүнү ачыңыз, /start",

    submit_btn: "✅ Жөнөтүү",

    final_wait:
      "Сонун! Менеджерлер даярдашууда — болжол менен 20 мүнөт.\n\nКоомчулук: https://t.me/+HCQG5WLhKNk3Y2My",

    use_menu: "Төмөнкү баскычтарды колдонуңуз же /start.",

    err_use_buttons_category: "Категорияны баскыч менен тандаңыз.",

    err_doc_need_photo:
      "Бул кадамда сүрөт же PDF файл жөнөтүңүз (текст эмес).",

    err_bank_need_text:
      "Банк үчүн бир билдирүүдө карта номери жана телефонду жазыңыз.",

    err_wrong_media_type:
      "Видео, үн же стикер эмес — сүрөт же PDF.",

    err_doc_mime: "Гана JPEG/PNG же PDF.",

    summary_titles: {
      phone: "Телефон (авторизация)",
      category: "Жеткирүү классы",
      city: "Шаар",
      citizenship: "РФ жарандыгы",
      thermal: "Термокороб",
      passport_foreign: "Чет өлкө паспорту",
      passport_rf: "Паспорт",
      passport: "Паспорт",
      vehicle: "ТС эсеби",
      truck_dims: "Жүк бөлмөсү",
      truck_payload: "Жүк көтөрүү",
      truck_loaders: "Жүк ташуучулар",
      truck_wrap: "Брендинг",
      self_employed: "Өзүн өзү эмгекке жаратуу",
      inn: "ИНН",
      bike_smz_phone: "«Мой налог» тел.",
      bike_smz_address: "Дарек (СМЗ)",
      bike_thermal: "Вело термокороб",
      bike_passport: "Паспорт",
    },

    summary_passport_media: "Медиа (1 даана)",

    summary_yes: "Ооба",
    summary_no: "Жок",
    summary_thermal_no: "Жок, сатып алуу керек",

    group_header_new: "🔔 Жаңы арыз · Doda taxi",
    group_separator: "━━━━━━━━━━━━━━━━━━━━",
    group_anketa_heading: "📋 АНКЕТА",
    group_label_name: "👤 Аты:",
    group_label_telegram: "📱 Telegram:",
    group_label_phone: "📞 Телефон:",
    group_label_category: "🚗 Жеткирүү классы:",
    group_label_vehicle: "🚙 ТС эсеби:",
    group_label_city: "🏙 Шаар:",
    group_label_citizenship: "🪪 РФ жарандыгы:",
    group_label_truck_dims: "📐 Өлчөмдөр:",
    group_label_truck_payload: "⚖️ Жүк көтөрүү:",
    group_label_truck_loaders: "👷 Жүк ташуучулар:",
    group_label_truck_branding: "🏷 Брендинг:",
    group_label_bike_self: "🧾 Өзүн эмгекке жаратуу:",
    group_label_bike_inn: "#️⃣ ИНН:",
    group_label_bike_smz_phone: "📱 «Мой налог» телефону:",
    group_label_bike_smz_address: "📍 Дарек (шаар, көчө, подъезд, батир):",
    group_label_bike_thermal: "📦 Вело термокороб:",
    group_docs_heading: "📎 ДОКУМЕНТТЕР",
    group_docs_empty: "Арызга файлдар тиркелген эмес.",
    group_docs_intro: "Тиркемелер: {count} (төмөндө — анкета боюнча).",
    group_bank_heading: "🏦 БАНК (арыздан текст)",
    group_footer_done:
      "━━━━━━━━━━━━━━━━━━━━\n✅ Арыз кабыл алынды, бардык файлдар алынды\n━━━━━━━━━━━━━━━━━━━━",
    group_caption_license: "Айдоочулук күбөлүгү (ВУ)",
    group_caption_sts: "СТС — ТС каттоо күбөлүгү",
    group_caption_tech_passport_front:
      "Чет өлкө ТС техпаспорту — алды жагы",
    group_caption_tech_passport_back:
      "Чет өлкө ТС техпаспорту — арткы жагы",
    group_caption_passport: "Паспорт (жайылма)",
    group_caption_bank: "Банк маалыматтары",
    group_truck_kg: "{value} кг",
    group_truck_loader_word_0: "эч ким",
    group_truck_loader_word_1: "бир",
    group_truck_loader_word_2: "эки",
    group_value_dash: "—",

    ask_service:
      "Выберите сервис подключения кнопкой ниже.",

    yx_final_thanks:
      "Маалымат үчүн рахмат. Арыз кабыл алынды; жакыныраак убакытта сиз менен байланышабыз.",

    yx_review_use_buttons:
      "На этом шаге доступны только кнопки под сообщением (в т.ч. «✅ Отправить»).",

    yx_need_video:
      "На этом шаге отправьте короткое видео (кружок не подойдёт).",

    group_header_yandex: "🔔 Новая заявка · Яндекс Лавка / Еда",
    group_label_yandex_service: "🛒 Сервис:",
    group_label_yandex_city: "🏙 Город:",
    group_label_yandex_citizen: "🪪 Гражданство / статус:",
    group_label_yandex_uzdoc: "📄 Тип документа (УЗ/ТЖ):",
    group_label_yandex_kzdoc: "📄 Документ КЗ/КГ:",
    group_label_yandex_tmvisa: "📄 Виза ТМ:",
    group_yandex_text_heading: "📝 ТЕКСТОВЫЕ ПОЛЯ",
    group_caption_yx_generic: "Вложение заявки (Яндекс)",

    yx_btn_doda: "Ru Park Doda курьер",
    yx_btn_lavka: "Яндекс Лавка",
    yx_btn_eats: "Яндекс Еда",

    yx_city_msk: "Москва",
    yx_city_mo: "Москва облысы",

    yx_ask_city:
      "Укажите Москву или Московскую область кнопкой ниже.",
    yx_ask_citizen: "Укажите ваш статус / гражданство кнопкой ниже.",
    yx_ask_uz_doc: "Выберите тип подтверждающего документа.",
    yx_ask_kz_doc_kz:
      "Гражданину Казахстана: выберите вариант кнопкой ниже.",
    yx_ask_kz_doc_kg:
      "Гражданину Кыргызстана: выберите вариант кнопкой ниже.",
    yx_ask_kz_doc_neutral: "Выберите вариант кнопкой ниже.",
    yx_ask_tm_visa:
      "Какой тип визы? Выберите кнопкой ниже: туристическая или рабочая.",

    yx_cit_uz: "Узбекистан",
    yx_cit_tj: "Таджикистан",
    yx_cit_kz: "Казахстан",
    yx_cit_kg: "Кыргызстан",
    yx_cit_other: "Или другое",
    yx_cit_uz_tj: "Узбекистан / Таджикистан",
    yx_cit_kz_kg: "Казахстан / Кыргызстан",
    yx_cit_rf: "Гражданин РФ",
    yx_cit_tm: "Туркменистан",

    yx_doc_patent: "Патент",
    yx_doc_vnzh: "ВНЖ / РВП",
    yx_doc_student: "Студент",

    yx_kz_pass: "Паспорт",
    yx_kz_id: "Удостоверение личности (ID)",

    yx_tm_work: "Рабочая виза",
    yx_tm_tourism: "Туристическая виза",
    yx_tm_tourism_blocked:
      "С туристической визой сейчас подключить не можем — полное оформление только с рабочей визой. Выберите «Рабочая виза».",

    yx_ram_reg: "Регистрация",
    yx_ram_amina: "Амина",

    yx_p_ram_choice:
      "Укажите: регистрация по месту пребывания или документ «Амина» — кнопкой ниже.",

    yx_review_hint:
      "Проверьте данные. Для отправки нажмите «✅ Отправить».",

    yx_rev_title: "Проверка заявки (Яндекс)",
    yx_rev_service: "Сервис",
    yx_rev_city: "Город",
    yx_rev_citizen: "Статус",
    yx_rev_uzdoc: "Документ УЗ/ТЖ",
    yx_rev_kzdoc: "Документ КЗ/КГ",
    yx_rev_tmvisa: "Виза ТМ",
    yx_rev_files: "Шагов пройдено (включая текстовые)",

    yx_use_buttons: "На этом шаге выберите вариант кнопкой ниже.",
    yx_confirm_doc_preview:
      "✅ Файл принят\n\nПроверьте качество и нажмите «Продолжить 👉»\n\nили «↩️ Изменить выбор» — отправить другой файл.",
    yx_press_continue_first:
      "Сначала нажмите «Продолжить 👉» или «↩️ Изменить выбор», чтобы перезагрузить.",
    yx_need_text: "Отправьте текст одним сообщением (без фото и файлов).",
    yx_bad_text:
      "Проверьте формат: карта — 16 цифр; телефон — РФ; ИНН — 10 или 12 цифр; СНИЛС — 11 цифр; поле не пустое.",
    yx_file_ok: "Принято. Переходим к следующему шагу.",

    yx_lbl_yx_col_req_text: "Реквизиты (текст)",
    yx_lbl_yx_col_card16: "Номер карты",
    yx_lbl_yx_col_contact_phone: "Контактный телефон",
    yx_lbl_yx_col_tm_contact: "Контактный телефон",
    yx_lbl_yx_col_inn: "ИНН",
    yx_lbl_yx_col_snils: "СНИЛС",

    yx_p_req_video:
      "Отправьте короткое видео с реквизитами банковской карты (без лица и паспорта).",
    yx_p_req_photo:
      "Отправьте фото с реквизитами банковской карты (без лица и паспорта).",
    yx_p_req_text:
      "Одним сообщением укажите банковские реквизиты (как в инструкции сервиса).",
    yx_p_card16: "Введите номер банковской карты — 16 цифр подряд (можно с пробелами).",

    yx_p_uz_pat_pass: "Фото паспорта (разворот с фото).",
    yx_p_uz_pat_front: "Фото патента — лицевая сторона.",
    yx_p_uz_pat_back: "Фото патента — оборот.",
    yx_p_reg_f: "Фото регистрации — лицевая сторона.",
    yx_p_reg_b: "Фото регистрации — оборот.",
    yx_p_amina: "Фото документа «Амина».",
    yx_p_mig: "Фото миграционной карты.",
    yx_p_pay_ph: "Фото чека / подтверждения оплаты патента.",
    yx_p_pay_file: "Фото или PDF квитанции об оплате патента.",

    yx_p_vnzh_f: "Фото ВНЖ / РВП — лицевая сторона.",
    yx_p_vnzh_b: "Фото ВНЖ / РВП — оборот.",
    yx_p_vnzh_pass: "Фото паспорта (разворот с фото).",
    yx_p_inn: "Введите ИНН — 10 или 12 цифр.",
    yx_p_snils: "Введите СНИЛС — 11 цифр (можно с дефисами).",

    yx_p_st_bilet: "Фото студенческого билета.",
    yx_p_st_spravka: "Фото справки с места учёбы.",
    yx_p_st_pass: "Фото паспорта (разворот с фото).",

    yx_p_kz_pass_face: "Фото паспорта (разворот с фото).",
    yx_p_kz_id_f: "Фото удостоверения личности — лицевая сторона.",
    yx_p_kz_id_b: "Фото удостоверения личности — оборот.",

    yx_p_rf_pass_face: "Фото паспорта РФ (разворот с фото).",
    yx_p_rf_pass_prop: "Фото страницы с пропиской.",

    yx_p_tm_pass: "Фото паспорта (разворот с фото).",
    yx_p_tm_visa:
      "Отправьте фото визы / разрешения (тип выбран на предыдущем шаге).",
    yx_p_tm_amina_or_reg:
      "Скриншот «Амина» или фото/скан бумажной регистрации — одно фото или PDF.",

    yx_p_contact_phone: "Укажите контактный номер телефона (РФ).",

    faq: [
      {
        id: "pay",
        q: "💰 Акчаны кантип чыгарам?",
        a: "Өнөктөш тиркемеде: Профиль → Баланс → Чыгаруу.",
      },
      {
        id: "orders",
        q: "📦 Заказ жок",
        a: "Смена, аймак жана лимиттерди текшериңиз.",
      },
      {
        id: "docs",
        q: "📄 Документтер",
        a: "Талаптар сервиске көз каранды.",
      },
      {
        id: "community",
        q: "👫 Коомчулук",
        a: "Расмий чакырууларды гана колдонуңуз.",
      },
    ],
  },
};

export function tBK(lang, key, kwargs = {}) {
  const lg = normalizeBKLang(lang);
  const block = BK_STRINGS[lg];
  if (!block) return key;
  let val = block[key];
  if (val === undefined && lg !== "ru") {
    val = BK_STRINGS.ru[key];
  }
  if (val === undefined) return key;
  if (typeof val === "function") {
    return key;
  }
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return key;
  }
  return interpolate(String(val), kwargs);
}

/** KZ/KG hujjat turi qadami: faqat tanlangan davlat; pasport/ID farqi tugmalarda. */
export function yxAskKzDocPrompt(lang, citizen) {
  const lg = normalizeBKLang(lang);
  const subKey =
    citizen === "kz"
      ? "yx_ask_kz_doc_kz"
      : citizen === "kg"
        ? "yx_ask_kz_doc_kg"
        : "yx_ask_kz_doc_neutral";
  return tBK(lg, subKey);
}

/** Функция-ключлар: confirm_phone, confirm_category, confirm_city, confirm_citizenship, confirm_thermal */
export function tBKfn(lang, key, arg) {
  const lg = normalizeBKLang(lang);
  const fn = BK_STRINGS[lg]?.[key] ?? BK_STRINGS.ru[key];
  if (typeof fn === "function") return fn(arg);
  return String(fn ?? key);
}

export function categoryLabelForLang(lang, catKey) {
  const k = `cat_${catKey}`;
  return tBK(lang, k);
}

export function faqItems(lang) {
  const lg = normalizeBKLang(lang);
  return BK_STRINGS[lg]?.faq ?? BK_STRINGS.ru.faq;
}

export function summaryTitle(lang, field) {
  const lg = normalizeBKLang(lang);
  const t =
    BK_STRINGS[lg]?.summary_titles?.[field] ??
    BK_STRINGS.ru.summary_titles[field];
  return t ?? field;
}

export function buildBkSummaryI18n(lang, profile) {
  const bk = profile?.session_data?.bk || {};
  const td = profile?.session_data || {};
  const completed = td.completed_docs || [];
  const lines = [];
  let n = 1;
  const lg = normalizeBKLang(lang);
  const T =
    BK_STRINGS[lg]?.summary_titles ?? BK_STRINGS.ru.summary_titles;
  const y = tBK(lang, "summary_yes");
  const no = tBK(lang, "summary_no");

  if (profile.phone) {
    lines.push(`${n++}. ${T.phone}: ${profile.phone}`);
  }
  if (bk.categoryLabel) {
    lines.push(`${n++}. ${T.category}: ${bk.categoryLabel}`);
  }
  if (bk.categoryKey === "car" && typeof bk.vehicleRf === "boolean") {
    const vLabel = bk.vehicleRf
      ? tBK(lang, "summary_vehicle_rf")
      : tBK(lang, "summary_vehicle_foreign");
    lines.push(`${n++}. ${T.vehicle}: ${vLabel}`);
  }
  if (profile.city) {
    lines.push(`${n++}. ${T.city}: ${profile.city}`);
  }
  if (typeof bk.rfCitizen === "boolean") {
    lines.push(`${n++}. ${T.citizenship}: ${bk.rfCitizen ? y : no}`);
  }
  if (bk.categoryKey === "bike") {
    if (typeof bk.selfEmployed === "boolean") {
      lines.push(
        `${n++}. ${summaryTitle(lg, "self_employed")}: ${
          bk.selfEmployed ? y : no
        }`
      );
    }
    if (bk.selfEmployed === true && bk.rfCitizen === true) {
      if (bk.moyNalogPhone) {
        lines.push(
          `${n++}. ${summaryTitle(lg, "bike_smz_phone")}: ${bk.moyNalogPhone}`
        );
      }
      if (bk.smzAddress) {
        lines.push(
          `${n++}. ${summaryTitle(lg, "bike_smz_address")}: ${bk.smzAddress}`
        );
      }
    } else if (bk.selfEmployed === true && bk.inn) {
      lines.push(`${n++}. ${summaryTitle(lg, "inn")}: ${bk.inn}`);
    }
  }
  if (bk.categoryKey === "truck") {
    if (bk.truckDimensionLabel) {
      lines.push(
        `${n++}. ${summaryTitle(lg, "truck_dims")}: ${bk.truckDimensionLabel}`
      );
    }
    if (bk.truckPayloadKg != null && bk.truckPayloadKg !== "") {
      const formatted = new Intl.NumberFormat("ru-RU").format(
        Number(bk.truckPayloadKg)
      );
      lines.push(
        `${n++}. ${summaryTitle(lg, "truck_payload")}: ${formatted}`
      );
    }
    if (typeof bk.truckBranding === "boolean") {
      lines.push(
        `${n++}. ${summaryTitle(lg, "truck_wrap")}: ${
          bk.truckBranding ? y : no
        }`
      );
    }
  }

  if (completed.includes("passport")) {
    const passportTitle =
      bk.categoryKey === "bike"
        ? summaryTitle(lg, "bike_passport")
        : bk.rfCitizen === false
          ? summaryTitle(lg, "passport_foreign")
          : summaryTitle(lg, "passport_rf");
    lines.push(
      `${n++}. ${passportTitle}: ${tBK(lg, "summary_passport_media")}`
    );
  }
  return lines.join("\n");
}

function interpolateStr(str, kwargs = {}) {
  if (typeof str !== "string") return String(str);
  let s = str;
  for (const [k, v] of Object.entries(kwargs)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

/**
 * Telefon qadami matni (BK uslubi): HTML + disclaimer havolalari (env).
 * PRIVACY_POLICY_URL bo‘lmasa — oddiy matn, havolasiz.
 */
export function buildAskPhoneHtml(lang) {
  const lg = normalizeBKLang(lang);
  if (lg !== "ru") {
    return { text: tBK(lg, "ask_phone"), parse_mode: undefined };
  }
  const body = BK_STRINGS.ru.ask_phone_body_ru;
  const privacy = (process.env.PRIVACY_POLICY_URL || "").trim();
  const referral = (process.env.REFERRAL_RULES_URL || "").trim() || privacy;
  const tournament = (process.env.TOURNAMENT_RULES_URL || "").trim() || privacy;
  const zaruba = (process.env.ZARUBA_RULES_URL || "").trim() || privacy;

  if (privacy) {
    const legal = interpolateStr(BK_STRINGS.ru.ask_phone_legal_ru_html, {
      privacy_url: privacy,
      referral_url: referral,
      tournament_url: tournament,
      zaruba_url: zaruba,
    });
    return { text: `${body}\n\n${legal}`, parse_mode: "HTML" };
  }
  const legal = BK_STRINGS.ru.ask_phone_legal_plain;
  // body — HTML (<b>…</b>); havolasiz variantda ham parse_mode berilmasa teglar matn bo‘lib chiqadi.
  return { text: `${body}\n\n${legal}`, parse_mode: "HTML" };
}

/**
 * Doda taxi arizasi yuborilgach — Yandex bilan bir xil qisqa yakun (vaqt/communitysiz).
 * `link` eski API uchun saqlanadi, matnga kiritilmaydi.
 */
export function buildBkFinalWait(lang, _link = null) {
  const lg = normalizeBKLang(lang);
  return tBK(lg, "yx_final_thanks");
}

