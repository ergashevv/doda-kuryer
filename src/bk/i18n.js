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
    pick_language: "Тилни танланг:",
    err_pick_lang: "Илтимос, тилни пастдаги тугма орқали танланг.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Асосий меню:",
    faq_freedom_hint: "Саволни пастдаги тугма орқали танланг ёки /start",

    btn_in_park: "😎 Мен аллақачон БК паркидаман",
    btn_not_in_park: "🙏 БК паркида эмасман, улаш керак",
    btn_support: "❓ Техник ёрдам",
    btn_therm_yes: "Ҳа",
    btn_therm_no: "Йўқ, сотиб олиш керак",
    cit_yes: "Ҳа",
    cit_no: "Йўқ",
    city_other_btn: "✏️ Бошқа шаҳар (матн)",

    welcome_video_missing:
      "БОГАТЫЙ КУРЬЕР экотизим ботига хуш келибсиз!\n\nБу ерда курьерлар учун даромадни ошириш бўйича ҳамма нарса бор.\n\n⚔️ БК Заруба\n🏆 БК турнири\n🤝 БК реферал дастури\n👫 БК жамоаси\n📊 Кунлик статистика\n\nТранспорт йўқ ва ижара керак бўлса 👉 /ARENDA\n\nАгар ҳали БОГАТЫЙ КУРЬЕР паркида бўлмасангиз — энг яхши шартларда бир неча дақиқада улашамиз 👇",

    welcome_after_video:
      "БОГАТЫЙ КУРЬЕР экотизим ботига хуш келибсиз!\n\nБу ерда курьерлар учун даромадни ошириш бўйича ҳамма нарса бор.\n\n⚔️ БК Заруба\n🏆 БК турнири\n🤝 БК реферал дастури\n👫 БК жамоаси\n📊 Кунлик статистика\n\nТранспорт йўқ ва ижара керак бўлса 👉 /ARENDA\n\nАгар ҳали БОГАТЫЙ КУРЬЕР паркида бўлмасангиз — энг яхши шартларда бир неча дақиқада улашамиз 👇",

    faq_intro: "Аллақачон паркдасан — саволни танла:",
    faq_back: "◀️ Асосий менюга",

    support:
      "Техник ёрдам: муаммони битта хабарда ёзинг (аризадаги телефон, нима қилдингиз).",

    arenda:
      "Ижара: менеджер билан боғланиш — Telegramда @{manager}.\n\nҚайтиш: /start",

    ask_phone:
      "📱 Ариза учун Россия рақамини ёзинг: +7… ёки 8…, ёки контакт 📎 (фақат РФ).",

    ask_phone_keyboard_nudge:
      "👇 Рақамни пастдаги тугма орқали юборинг ёки матнда ёзинг.",

    err_phone_invalid:
      "Фақат Россия рақами: +7XXXXXXXXXX, 8XXXXXXXXXX ёки 10 рақам кодсиз. Бошқа давлат рақамлари қабул қилинмайди.",

    err_phone_no_media:
      "Бу қадамда фото ёки файл эмас — телефон рақамини матн ёки контакт сифатида юборинг.",

    confirm_phone: (phone) => `Телефон: ${phone}`,

    ask_category: "Қайси категорияда ишламоқчисиз? Ижара керак бўлса — /ARENDA",

    cat_car: "🚗 Енгил автомобиль",
    cat_truck: "🚚 Юк машинаси",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Велосипед",
    cat_foot: "🚶 Пиёда",

    confirm_category: (label) => `Танланган категория: ${label}`,

    ask_city:
      "Қайси шаҳарда ишлайсиз? Тугма ёки матн. Бир нечта бўлса — асосийини ёзинг.",

    err_city_need_text:
      "Шаҳар номини матн билан ёзинг; расм юборманг.",

    confirm_city: (city) => `Танланган шаҳар: ${city}`,

    ask_citizenship: "РФ фуқаросимисиз?",

    confirm_citizenship: (yes) => `РФ фуқаролиги: ${yes ? "Ҳа" : "Йўқ"}`,

    ask_thermal: "Термокороб борми?",

    confirm_thermal: (yes) =>
      `Термокороб: ${yes ? "Ҳа" : "Йўқ, сотиб олиш керак"}`,

    edit_btn: "↩️ Ўзгартириш",

    review_hint:
      "👆 Маълумотлар тайёр. «✅ Юбориш»ни босинг ёки майдонни таҳрирланг.",

    submit_btn: "✅ Юбориш",

    final_wait:
      "Зўр! Менежерлар акаунтни тайёрлаяпти — тахминан 20 дақиқа.\n\nЖамоа: https://t.me/+HCQG5WLhKNk3Y2My",

    use_menu: "Илтимос, пастдаги тугмалар ёки /start.",

    err_use_buttons_category: "Категорияни пастдаги тугма орқали танланг.",

    err_doc_need_photo:
      "Бу қадамда фото ёки PDF файл юборинг (матн эмас).",

    err_bank_need_text:
      "Банк учун битта хабарда карта рақами ва телефонни матн билан ёзинг.",

    err_wrong_media_type:
      "Видео, овоз ёки стикер эмас — фото ёки ҳужжат (PDF) юборинг.",

    err_doc_mime:
      "Фақат расм (JPEG/PNG) ёки PDF файл.",

    summary_titles: {
      phone: "Телефон",
      category: "Категория",
      city: "Шаҳар",
      citizenship: "РФ фуқаролиги",
      thermal: "Термокороб",
    },

    summary_yes: "Ҳа",
    summary_no: "Йўқ",
    summary_thermal_no: "Йўқ, сотиб олиш керак",

    faq: [
      {
        id: "pay",
        q: "💰 Пулни қандай чиқараман?",
        a: "Партнёр иловасида (Яндекс Про / парк): Профиль → Баланс → Чиқариш.",
      },
      {
        id: "orders",
        q: "📦 Буюртма йўқ",
        a: "Смена, зона ва лимитларни текширинг; пик вақтларини кутинг.",
      },
      {
        id: "docs",
        q: "📄 Ҳужжатлар",
        a: "Талаблар сервис ва паркка боғлиқ; иловадаги хабарларни кузатинг.",
      },
      {
        id: "community",
        q: "👫 Жамоа",
        a: "Расмий таклифлардан фойдаланинг; номаълум ҳаволаларга ўтманг.",
      },
    ],
  },

  ru: {
    pick_language: "Выберите язык:",
    err_pick_lang: "Пожалуйста, выбери язык кнопкой ниже.",

    lang_names: "🇺🇿 O‘zbek | 🇷🇺 Русский | 🇹🇯 Тоҷикӣ | 🇰🇬 Кыргызча",
    main_menu_after_faq: "Главное меню:",
    faq_freedom_hint: "Выбери вопрос кнопкой ниже или нажми /start.",

    btn_in_park: "😎 Я уже в парке Doda taxi",
    btn_not_in_park: "🙏 Я не в парке Doda taxi, нужно подключить",
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
      "Для подключения отправьте 📱📞 номер телефона <b>текстовым сообщением</b> ИЛИ <b>поделитесь им через кнопку в нижнем меню</b> 👇",

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
      "🚗 Легковое авто: где учёт транспорта?\n\n• Россия — загрузим СТС (как обычно).\n• Иностранное ТС — нужен техпаспорт: лицевая сторона и оборот (два фото).",

    btn_vehicle_rf_sts: "🇷🇺 Учёт в РФ — есть СТС",
    btn_vehicle_foreign_tech: "🌍 Иностранное ТС — техпаспорт (2 фото)",

    confirm_vehicle_rf: (rf) =>
      rf
        ? "Учёт ТС: Россия — далее загрузим СТС"
        : "Учёт ТС: иностранное — далее техпаспорт (лицевая и оборот)",

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

    ask_thermal: "У тебя есть термокороб?",

    confirm_thermal: (yes) =>
      `Вы указали наличие термокороба: ${yes ? "Да" : "Нет, необходимо приобрести"}`,

    edit_btn: "↩️ Изменить выбор",

    review_hint:
      "👇 Данные из твоей заявки готовы к отправке.\n\nУбедись, что все правильно и нажми «✅ Отправить».\n\nЕсли нужно изменить какое-то поле — нажми на кнопку с его названием.",

    submit_btn: "✅ Отправить",

    summary_vehicle_rf: "РФ — СТС",
    summary_vehicle_foreign: "Иностранное ТС — техпаспорт",

    btn_continue: "Продолжить 👉",

    ask_license_front:
      "Отправь ОДНО фото ВУ (водительского удостоверения) с передней стороны",

    confirm_license_uploaded:
      "✅ Фото ВУ загружено\n\nУбедись, что на фото хорошо видны и читабельны все поля и нажми кнопку «Продолжить 👉»\n\nлибо отправь другое фото ВУ с передней стороны для замены",

    ask_sts_front:
      "Отправь ОДНО фото СТС автомобиля с передней стороны",

    ask_tech_passport_front:
      "Отправь ОДНО фото лицевой стороны техпаспорта иностранного ТС",

    ask_tech_passport_back:
      "Отправь ОДНО фото оборота техпаспорта иностранного ТС",

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

    passport_legal_block:
      "В соответствии с новым требованием законодательства от 05.02.2025, чтобы подключить тебя в парк — мы должны убедиться, что ты отсутствуешь в реестре контролируемых лиц.\n\nОтправь фото разворота паспорта\n\nⓘ Подключение только с 16 лет",

    passport_legal_block_bike:
      "Отправь фото разворота паспорта\n\nⓘ Подключение только с 16 лет",

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
      bike_thermal: "Вело термокороб",
      bike_passport: "Вело паспорт",
    },

    summary_yes: "Да",
    summary_no: "Нет",
    summary_thermal_no: "Нет, необходимо приобрести",

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

    btn_in_park: "😎 Ман аллакай дар парки БК ҳастам",
    btn_not_in_park: "🙏 Дар парки БК нестам, пайваст кардан лозим",
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
      "👇 Рақамро бо тугмаҳо дар поён ё матн фиристед.",

    err_phone_invalid:
      "Танҳо рақами Русия: +7, 8 ё 10 рақам бе коди кишвар.",

    err_phone_no_media:
      "Акс лозим нест — рақамро матн ё контакт фиристед.",

    confirm_phone: (phone) => `Рақам: ${phone}`,

    ask_category: "Дар кадом категория кор мекунед? Иҷора — /ARENDA",

    cat_car: "🚗 Мошини сабук",
    cat_truck: "🚚 Боркаш",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Дучарха",
    cat_foot: "🚶 Пиёда",

    confirm_category: (label) => `Категория: ${label}`,

    ask_city: "Дар кадом шаҳр кор мекунед? Тугма ё матн.",

    err_city_need_text: "Номи шаҳрро матн нависед, акс нафиристед.",

    confirm_city: (city) => `Шаҳр: ${city}`,

    ask_citizenship: "Шумо шаҳрванди РФ ҳастед?",

    confirm_citizenship: (yes) => `Шаҳрвандии РФ: ${yes ? "Ҳа" : "Не"}`,

    ask_thermal: "Қуттии термӣ доред?",

    confirm_thermal: (yes) =>
      `Термокороб: ${yes ? "Ҳа" : "Не, харидан лозим"}`,

    edit_btn: "↩️ Тағйир додан",

    review_hint:
      "👆 Маълумот омода аст. «✅ Фиристодан» ё тағйири майдон.",

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
      phone: "Телефон",
      category: "Категория",
      city: "Шаҳр",
      citizenship: "Шаҳрвандии РФ",
      thermal: "Термокороб",
    },

    summary_yes: "Ҳа",
    summary_no: "Не",
    summary_thermal_no: "Не, харидан лозим",

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

    btn_in_park: "😎 Мен БК паркындамын",
    btn_not_in_park: "🙏 БК паркында эмесмин, туташтыруу керек",
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
      "👇 Телефонду төмөнкү баскычтар менен жөнөтүңүз же текст менен.",

    err_phone_invalid:
      "Гана Россия номери: +7XXXXXXXXXX, 8XXXXXXXXXX же 10 сан коду жок.",

    err_phone_no_media:
      "Бул кадамда сүрөт эмес — номерди текст же контакт менен жөнөтүңүз.",

    confirm_phone: (phone) => `Телефон: ${phone}`,

    ask_category: "Кайсы категорияда иштейсиз? Аренда — /ARENDA",

    cat_car: "🚗 Жеңил унаа",
    cat_truck: "🚚 Жүк ташуучу",
    cat_moto: "🏍️ Мототранспорт",
    cat_bike: "🚲 Велосипед",
    cat_foot: "🚶 Жөө",

    confirm_category: (label) => `Тандалган категория: ${label}`,

    ask_city: "Кайсы шаарда иштейсиз? Баскыч же текст.",

    err_city_need_text: "Шаардын атын текст менен жазыңыз; сүрөт жөнөтпөңүз.",

    confirm_city: (city) => `Шаар: ${city}`,

    ask_citizenship: "РФ жаранысызбы?",

    confirm_citizenship: (yes) => `РФ жарандыгы: ${yes ? "Ооба" : "Жок"}`,

    ask_thermal: "Термокороб барбы?",

    confirm_thermal: (yes) =>
      `Термокороб: ${yes ? "Ооба" : "Жок, сатып алуу керек"}`,

    edit_btn: "↩️ Өзгөртүү",

    review_hint:
      "👆 Маалыматтар даяр. «✅ Жөнөтүү» же талааны оңдоо.",

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
      phone: "Телефон",
      category: "Категория",
      city: "Шаар",
      citizenship: "РФ жарандыгы",
      thermal: "Термокороб",
    },

    summary_yes: "Ооба",
    summary_no: "Жок",
    summary_thermal_no: "Жок, сатып алуу керек",

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
    if (bk.selfEmployed === true && bk.inn) {
      lines.push(`${n++}. ${summaryTitle(lg, "inn")}: ${bk.inn}`);
    }
    if (typeof bk.hasThermal === "boolean") {
      const thLabel = bk.hasThermal ? y : tBK(lang, "summary_thermal_no");
      lines.push(
        `${n++}. ${summaryTitle(lg, "bike_thermal")}: ${thLabel}`
      );
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
    if (bk.truckLoaders != null) {
      const loaderLabels = [
        tBK(lang, "truck_loader_btn_0"),
        tBK(lang, "truck_loader_btn_1"),
        tBK(lang, "truck_loader_btn_2"),
      ];
      const lbl = loaderLabels[bk.truckLoaders] ?? String(bk.truckLoaders);
      lines.push(`${n++}. ${summaryTitle(lg, "truck_loaders")}: ${lbl}`);
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
    lines.push(`${n++}. ${passportTitle}: Медиа (1 шт.)`);
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

/** Финальное сообщение после отправки заявки (ссылка на community из env). */
export function buildBkFinalWait(lang, link) {
  const lg = normalizeBKLang(lang);
  const intro = tBK(lg, "final_wait_intro");
  if (!link) return intro;
  const block = BK_STRINGS[lg]?.final_wait_community ?? BK_STRINGS.ru.final_wait_community;
  return `${intro}\n\n${interpolateStr(block, { link })}`;
}

