import {
  dodaDocSequence,
  getFirstMissingDodaStepSync,
  isDodaUploadDocKey,
  isPhotoDoc,
  parseBkTrCallbackData,
} from "../flow.js";
import {
  buildAskPhoneHtml,
  buildBkFinalWait,
  buildBkSummaryI18n,
  categoryLabelForLang,
  faqItems,
  normalizeBKLang,
  tBK,
  tBKfn,
} from "./i18n.js";
import { normalizeLang, t } from "../i18n.js";
import { communityLinkForCategory } from "./community.js";
import { logChat } from "../services/chatLog.js";
import { notifyGroupFullSubmission } from "../services/groupInbox.js";
import { downloadTelegramFile } from "../services/storage.js";
import {
  ensureProfile,
  resetRegistration,
  syncTelegramInfo,
  updateProfile,
} from "../services/users.js";
import { withTransaction } from "../db.js";
import { hasForbiddenMediaTypes, isAllowedDocumentMime } from "./media.js";
import { normalizeRussianPhone } from "./phone.js";
import { resolvePlaceholderPath, resolveWelcomeVideoNotePath } from "./placeholders.js";
import {
  categoryInline,
  citizenshipInline,
  cityByIndex,
  cityInline,
  continueInline,
  editOnly,
  faqMenu,
  languagePickKb,
  mainMenuReply,
  passportConfirmKb,
  phoneStepReply,
  reviewKb,
  selfEmployedInline,
  thermalBikeInline,
  truckBrandingInline,
  truckDimensionsInline,
  truckLoadersInline,
  vehicleRfInline,
} from "./keyboards.js";
import fs from "node:fs";

function mapCategoryToTariff(cat) {
  if (cat === "truck") return "truck";
  if (cat === "car" || cat === "moto") return "car";
  return "foot_bike";
}

function bkPayload(profile) {
  const raw = profile?.session_data?.bk;
  return raw && typeof raw === "object" ? raw : {};
}

function langOf(profile) {
  return normalizeBKLang(profile?.language);
}

function clearTruckBkFields(bk) {
  if (!bk || typeof bk !== "object") return;
  delete bk.truckDimensionCode;
  delete bk.truckDimensionLabel;
  delete bk.truckPayloadKg;
  delete bk.truckLoaders;
  delete bk.truckBranding;
}

function clearBikeFields(bk) {
  if (!bk || typeof bk !== "object") return;
  delete bk.selfEmployed;
  delete bk.inn;
  delete bk.hasThermal;
}

/** /ARENDA — менеджер логини (env, @сиз). Default: Yandex_77 */
function arendaManagerUsername() {
  const raw = (process.env.ARENDA_MANAGER_USERNAME || "Yandex_77").trim();
  return raw.replace(/^@/, "") || "Yandex_77";
}

/** Doda hujjatlar oqimi: tariff + service (barcha fayllarni o‘chirmasdan). */
async function ensureDodaTariffService(client, uid, profile) {
  const td = { ...(profile.session_data || {}) };
  const bk = { ...(td.bk || {}) };
  bk.categoryKey = bk.categoryKey || "foot";
  const tariff = mapCategoryToTariff(bk.categoryKey);
  td.bk = bk;
  await updateProfile(client, uid, {
    session_data: td,
    tariff,
    service: "doda_taxi",
  });
  return ensureProfile(client, uid);
}

async function sendPlaceholder(ctx, key, caption, extra = {}) {
  const p = resolvePlaceholderPath(key);
  if (p && fs.existsSync(p)) {
    await ctx.replyWithPhoto({ source: p }, { caption, ...extra });
  } else {
    await ctx.reply(caption, extra);
  }
}

async function sendAskPhonePrompt(ctx, lg) {
  const { text, parse_mode } = buildAskPhoneHtml(lg);
  const kb = phoneStepReply(lg);
  const p = resolvePlaceholderPath("phone");
  const hasPhoto = p && fs.existsSync(p);
  if (hasPhoto) {
    // Pastki klaviatura ba’zi Telegram mijozlarida sendPhoto + reply_markup bilan yangilanmay qoladi;
    // kontakt / «қўлда» tugmalari keyingi qisqa xabarda — oxirgi reply_markup qo‘llaniladi.
    await ctx.replyWithPhoto(
      { source: p },
      { caption: text, parse_mode: parse_mode || undefined }
    );
    await ctx.reply(tBK(lg, "ask_phone_keyboard_nudge"), kb);
  } else {
    const extra = { ...kb };
    if (parse_mode) extra.parse_mode = parse_mode;
    await ctx.reply(text, extra);
  }
}

async function replyAskPhone(ctx, lg) {
  const { text, parse_mode } = buildAskPhoneHtml(lg);
  const extra = { ...phoneStepReply(lg) };
  if (parse_mode) extra.parse_mode = parse_mode;
  await ctx.reply(text, extra);
}

async function tryAcceptDoc(client, ctx, profile, uid, doc, msg) {
  if (doc === "bank") {
    if (!msg.text) return null;
    const raw = msg.text.trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 16) return null;
    const td = { ...(profile.session_data || {}) };
    const coll = { ...(td.collected || {}) };
    coll.bank = raw;
    td.collected = coll;
    await updateProfile(client, uid, { session_data: td });
    return { bankText: raw };
  }

  if (!isPhotoDoc(doc)) return null;

  let fileId = null;
  let mime = null;
  if (msg.photo?.length) {
    fileId = msg.photo[msg.photo.length - 1].file_id;
    mime = "image/jpeg";
  } else if (msg.document) {
    if (!isAllowedDocumentMime(msg.document.mime_type)) return null;
    fileId = msg.document.file_id;
    mime = msg.document.mime_type;
  }
  if (!fileId) return null;

  const path = await downloadTelegramFile(ctx.telegram, fileId, uid, doc, mime);
  await client.query(
    `INSERT INTO uploaded_files (telegram_user_id, doc_type, telegram_file_id, local_path)
     VALUES ($1, $2, $3, $4)`,
    [uid, doc, fileId, path]
  );
  return { localPath: path, mime };
}

function formatCityForProfile(raw) {
  const t = (raw || "").trim();
  if (!t) return t;
  if (t.toLowerCase() === "москва") return "г Москва (Москва)";
  return t;
}

async function replaceAcceptDoc(client, ctx, profile, uid, docKey, msg) {
  await client.query(
    `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = $2`,
    [uid, docKey]
  );
  return tryAcceptDoc(client, ctx, profile, uid, docKey, msg);
}

async function getUploadedDocTypes(client, uid) {
  const r = await client.query(
    `SELECT doc_type FROM uploaded_files WHERE telegram_user_id = $1`,
    [uid]
  );
  return new Set(r.rows.map((row) => row.doc_type));
}

async function getFirstMissingDodaStep(client, uid, profile) {
  const bk = profile.session_data?.bk || {};
  const uploaded = await getUploadedDocTypes(client, uid);
  return getFirstMissingDodaStepSync(bk, uploaded);
}

async function promptNextAfterTruckStep(ctx, client, uid, profile) {
  let p2 = await ensureProfile(client, uid);
  const bk0 = p2.session_data?.bk || {};
  const next = await getFirstMissingDodaStep(client, uid, p2);
  if (next === "passport" && bk0.categoryKey === "bike") {
    await client.query(`DELETE FROM uploaded_files WHERE telegram_user_id = $1`, [uid]);
    const td = { ...(p2.session_data || {}) };
    td.completed_docs = [];
    await updateProfile(client, uid, { session_data: td });
    p2 = await ensureProfile(client, uid);
  }
  if (next) {
    await promptDodaDocStep(ctx, client, uid, p2, next);
  }
}

/** Shahar tanlanganidan keyin transport turini o‘zgartirish: ketma-kilik bo‘yicha birinchi yetishmayotgan hujjat */
async function promptFirstMissingDodaDoc(ctx, client, uid, profile) {
  const lg = langOf(profile);
  const missing = await getFirstMissingDodaStep(client, uid, profile);
  if (missing) {
    await promptDodaDocStep(ctx, client, uid, profile, missing);
    return;
  }
  const td = { ...(profile.session_data || {}) };
  const bk = profile.session_data?.bk || {};
  const seq = dodaDocSequence(bk.categoryKey || "foot", bk);
  td.completed_docs = seq.filter((k) => isDodaUploadDocKey(k));
  await updateProfile(client, uid, {
    session_data: td,
    session_state: "bk_review",
  });
  const p2 = await ensureProfile(client, uid);
  const bk2 = p2.session_data?.bk || {};
  const summary = buildBkSummaryI18n(lg, p2);
  await ctx.reply(`${summary}\n\n${tBK(lg, "review_hint")}`, reviewKb(lg, bk2));
}

async function promptDodaDocStep(ctx, client, uid, profile, docKey) {
  const lg = langOf(profile);
  if (docKey === "license") {
    await updateProfile(client, uid, { session_state: "bk_doc_license" });
    await sendPlaceholder(ctx, "license", tBK(lg, "ask_license_front"));
    return;
  }
  if (docKey === "sts") {
    await updateProfile(client, uid, { session_state: "bk_doc_sts" });
    await sendPlaceholder(ctx, "sts", tBK(lg, "ask_sts_front"));
    return;
  }
  if (docKey === "tech_passport_front") {
    await updateProfile(client, uid, { session_state: "bk_doc_tech_passport_front" });
    await sendPlaceholder(ctx, "tech_passport_front", tBK(lg, "ask_tech_passport_front"));
    return;
  }
  if (docKey === "tech_passport_back") {
    await updateProfile(client, uid, { session_state: "bk_doc_tech_passport_back" });
    await sendPlaceholder(ctx, "tech_passport_back", tBK(lg, "ask_tech_passport_back"));
    return;
  }
  if (docKey === "truck_dimensions") {
    await updateProfile(client, uid, { session_state: "bk_truck_dimensions" });
    await ctx.reply(tBK(lg, "ask_truck_dimensions"), truckDimensionsInline(lg));
    return;
  }
  if (docKey === "truck_payload") {
    await updateProfile(client, uid, { session_state: "bk_truck_payload" });
    await ctx.reply(tBK(lg, "ask_truck_payload"));
    return;
  }
  if (docKey === "truck_loaders") {
    await updateProfile(client, uid, { session_state: "bk_truck_loaders" });
    await ctx.reply(tBK(lg, "ask_truck_loaders"), truckLoadersInline(lg));
    return;
  }
  if (docKey === "truck_branding") {
    await updateProfile(client, uid, { session_state: "bk_truck_branding" });
    await ctx.reply(tBK(lg, "ask_truck_branding"), truckBrandingInline(lg));
    return;
  }
  if (docKey === "self_employed") {
    await updateProfile(client, uid, { session_state: "bk_self_employed" });
    await ctx.reply(tBK(lg, "ask_self_employed"), selfEmployedInline(lg));
    return;
  }
  if (docKey === "inn") {
    await updateProfile(client, uid, { session_state: "bk_inn" });
    await ctx.reply(tBK(lg, "ask_inn"));
    return;
  }
  if (docKey === "thermal") {
    await updateProfile(client, uid, { session_state: "bk_bike_thermal" });
    await sendPlaceholder(ctx, "thermal", tBK(lg, "ask_thermal"), thermalBikeInline(lg));
    return;
  }
  if (docKey === "passport") {
    await updateProfile(client, uid, { session_state: "bk_doc_passport" });
    const bk = profile.session_data?.bk || {};
    const legal =
      bk.categoryKey === "bike"
        ? tBK(lg, "passport_legal_block_bike")
        : tBK(lg, "passport_legal_block");
    const p = resolvePlaceholderPath("passport");
    if (p && fs.existsSync(p)) {
      await ctx.replyWithPhoto({ source: p }, { caption: legal });
    } else {
      await ctx.reply(legal);
    }
  }
}

async function replyDocUploadedEcho(ctx, lg, msg, caption, markup) {
  let fileId = null;
  if (msg.photo?.length) {
    fileId = msg.photo[msg.photo.length - 1].file_id;
  } else if (msg.document) {
    fileId = msg.document.file_id;
  }
  if (!fileId) {
    await ctx.reply(caption, markup);
    return;
  }
  await ctx.replyWithPhoto(fileId, {
    caption,
    ...markup,
  });
}

const DOC_PENDING_STATE = {
  bk_doc_license: "license",
  bk_doc_sts: "sts",
  bk_doc_tech_passport_front: "tech_passport_front",
  bk_doc_tech_passport_back: "tech_passport_back",
  bk_doc_passport: "passport",
};

const DOC_OK_STATE = {
  bk_doc_license_ok: "license",
  bk_doc_sts_ok: "sts",
  bk_doc_tech_passport_front_ok: "tech_passport_front",
  bk_doc_tech_passport_back_ok: "tech_passport_back",
  bk_doc_passport_ok: "passport",
};

/** Ketma-ketlik: til → asosiy menyu → (FAQ | ro‘yxatdan o‘tish) → telefon → kategoriya → shahar → fuqarolik → termokorob → hujjatlar → ko‘rib chiqish → yuborish */
async function sendWelcomeAfterLanguage(ctx, uid, lang) {
  const lg = normalizeBKLang(lang);
  const vid = resolveWelcomeVideoNotePath();
  if (vid) {
    try {
      await ctx.replyWithVideoNote({ source: vid });
    } catch (e) {
      console.error("[bk] video note:", e?.message || e);
    }
  }
  const cap = vid
    ? tBK(lg, "welcome_after_video")
    : tBK(lg, "welcome_video_missing");
  await sendPlaceholder(ctx, "welcome", cap, mainMenuReply(lg));
  await withTransaction(async (client) => {
    await logChat(client, uid, "assistant", cap);
  });
}

export function registerBkHandlers(bot) {
  bot.command("start", async (ctx) => {
    const uid = ctx.from?.id;
    if (!uid || !ctx.message) return;
    await withTransaction(async (client) => {
      await resetRegistration(client, uid);
      await syncTelegramInfo(client, uid, ctx.from);
      await logChat(client, uid, "user", "/start");
      await updateProfile(client, uid, {
        language: "ru",
        session_state: "bk_lang",
        session_data: { bk: {} },
        service: null,
        tariff: null,
        city: null,
        phone: null,
      });
    });
    const pick = tBK("ru", "pick_language");
    const kb = languagePickKb();
    // remove_keyboard va inline bitta xabarda bo‘lmaydi; avval yopamiz, keyin bitta xabar — matn + tugmalar (takrorlanmasin)
    await ctx.reply("\u2060", {
      reply_markup: { remove_keyboard: true },
    });
    await ctx.reply(pick, kb);
    await withTransaction(async (client) => {
      await logChat(client, uid, "assistant", pick);
    });
  });

  bot.command("ARENDA", async (ctx) => {
    const uid = ctx.from?.id;
    if (!uid) return;
    let lg = "ru";
    await withTransaction(async (client) => {
      const p = await ensureProfile(client, uid);
      lg = langOf(p);
    });
    const arendaText = tBK(lg, "arenda", {
      manager: arendaManagerUsername(),
    });
    await sendPlaceholder(ctx, "arenda", arendaText, mainMenuReply(lg));
    await withTransaction(async (client) => {
      await logChat(client, uid, "user", "/ARENDA");
      await logChat(client, uid, "assistant", arendaText);
    });
  });

  // Telegraf 4: callback query uchun `action`, `callbackQuery` metodi yo‘q
  bot.action(/^bk_/, async (ctx) => {
    const data = ctx.callbackQuery?.data;
    const uid = ctx.from?.id;
    if (!data || !uid) return;
    await ctx.answerCbQuery();

    if (data.startsWith("bk_L:")) {
      const code = data.slice(5);
      if (!["uz", "ru", "tg", "ky"].includes(code)) return;
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        await updateProfile(client, uid, {
          language: code,
          session_state: "bk_main",
        });
        await logChat(client, uid, "user", `lang:${code}`);
      });
      await sendWelcomeAfterLanguage(ctx, uid, code);
      return;
    }

    if (data.startsWith("bk_F:")) {
      const id = data.slice(5);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        const profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        if (id === "back") {
          await updateProfile(client, uid, { session_state: "bk_main" });
          await logChat(client, uid, "user", "faq:back");
          await ctx.reply(tBK(lg, "main_menu_after_faq"), mainMenuReply(lg));
          return;
        }
        const item = faqItems(lg).find((x) => x.id === id);
        if (item) {
          await logChat(client, uid, "user", `faq:${id}`);
          await logChat(client, uid, "assistant", item.a);
          await ctx.reply(item.a, faqMenu(lg));
        }
      });
      return;
    }

    if (data.startsWith("bk_C:")) {
      const cat = data.slice(5);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const label = categoryLabelForLang(lg, cat);
        if (!label) return;
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.categoryKey = cat;
        bk.categoryLabel = label;
        if (cat !== "car") {
          delete bk.vehicleRf;
        }
        if (cat !== "truck") {
          clearTruckBkFields(bk);
        }
        if (cat !== "bike") {
          clearBikeFields(bk);
        }
        td.bk = bk;
        if (cat === "car") {
          await updateProfile(client, uid, {
            session_data: td,
            session_state: "bk_vehicle_rf",
          });
          profile = await ensureProfile(client, uid);
          const msg = tBKfn(lg, "confirm_category", label);
          await logChat(client, uid, "assistant", msg);
          try {
            await ctx.editMessageText(msg, editOnly(lg, "bk_E:cat"));
          } catch {
            await ctx.reply(msg, editOnly(lg, "bk_E:cat"));
          }
          const ask = tBK(lg, "ask_vehicle_rf");
          await logChat(client, uid, "assistant", ask);
          await sendPlaceholder(ctx, "vehicle_rf", ask, vehicleRfInline(lg));
          return;
        }
        await updateProfile(client, uid, {
          session_data: td,
          session_state: "bk_city_pick",
        });
        profile = await ensureProfile(client, uid);
        const msg = tBKfn(lg, "confirm_category", label);
        await logChat(client, uid, "assistant", msg);
        try {
          await ctx.editMessageText(msg, editOnly(lg, "bk_E:cat"));
        } catch {
          await ctx.reply(msg, editOnly(lg, "bk_E:cat"));
        }
        const ask = tBK(lg, "ask_city");
        await logChat(client, uid, "assistant", ask);
        await sendPlaceholder(ctx, "city", ask, cityInline(lg));
      });
      return;
    }

    if (data.startsWith("bk_V:")) {
      const rf = data.endsWith(":1");
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        if (bk.categoryKey !== "car") return;
        bk.vehicleRf = rf;
        td.bk = bk;
        if (rf) {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = ANY($2::text[])`,
            [uid, ["tech_passport_front", "tech_passport_back"]]
          );
        } else {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = $2`,
            [uid, "sts"]
          );
        }
        const stripVehicle = (arr) =>
          [...(arr || [])].filter(
            (d) =>
              !["sts", "tech_passport_front", "tech_passport_back"].includes(d)
          );
        td.completed_docs = stripVehicle(td.completed_docs);
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_vehicle_rf", rf);
        await logChat(client, uid, "assistant", cmsg);
        try {
          await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:veh"));
        } catch {
          await ctx.reply(cmsg, editOnly(lg, "bk_E:veh"));
        }
        if (!profile.city) {
          await updateProfile(client, uid, { session_state: "bk_city_pick" });
          profile = await ensureProfile(client, uid);
          const ask = tBK(lg, "ask_city");
          await logChat(client, uid, "assistant", ask);
          await sendPlaceholder(ctx, "city", ask, cityInline(lg));
          return;
        }
        await promptFirstMissingDodaDoc(ctx, client, uid, profile);
      });
      return;
    }

    if (data.startsWith("bk_G:")) {
      const payload = data.slice(5);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        if (payload === "t") {
          await updateProfile(client, uid, { session_state: "bk_city_text" });
          await logChat(client, uid, "user", "city:free_text_mode");
          await ctx.reply(tBK(lg, "ask_city"), cityInline(lg));
          return;
        }
        const cityRaw = cityByIndex(payload);
        if (!cityRaw) return;
        const city = formatCityForProfile(cityRaw);
        await updateProfile(client, uid, { city, session_state: "bk_citizenship" });
        await logChat(client, uid, "user", city);
        const cmsg = tBKfn(lg, "confirm_city", city);
        await logChat(client, uid, "assistant", cmsg);
        try {
          await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:city"));
        } catch {
          await ctx.reply(cmsg, editOnly(lg, "bk_E:city"));
        }
        const ask = tBK(lg, "ask_citizenship");
        await logChat(client, uid, "assistant", ask);
        await sendPlaceholder(ctx, "passport", ask, citizenshipInline(lg));
      });
      return;
    }

    if (data.startsWith("bk_Z:")) {
      const yes = data.endsWith(":1");
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.rfCitizen = yes;
        td.bk = bk;
        await updateProfile(client, uid, {
          session_data: td,
        });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_citizenship", yes);
        await logChat(client, uid, "assistant", cmsg);
        try {
          await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:cit"));
        } catch {
          await ctx.reply(cmsg, editOnly(lg, "bk_E:cit"));
        }
        profile = await ensureDodaTariffService(client, uid, profile);
        await promptFirstMissingDodaDoc(ctx, client, uid, profile);
      });
      return;
    }

    if (data.startsWith("bk_SE:")) {
      const yes = data.endsWith(":1");
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        if (bk.categoryKey !== "bike") return;
        bk.selfEmployed = yes;
        if (!yes) delete bk.inn;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_self_employed", yes);
        await logChat(client, uid, "assistant", cmsg);
        try {
          await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:bself"));
        } catch {
          await ctx.reply(cmsg, editOnly(lg, "bk_E:bself"));
        }
        await promptNextAfterTruckStep(ctx, client, uid, profile);
      });
      return;
    }

    if (data.startsWith("bk_TH:")) {
      const yes = data.endsWith(":1");
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        if (bk.categoryKey !== "bike") return;
        bk.hasThermal = yes;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_thermal", yes);
        await logChat(client, uid, "assistant", cmsg);
        try {
          await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:bth"));
        } catch {
          await ctx.reply(cmsg, editOnly(lg, "bk_E:bth"));
        }
        await promptNextAfterTruckStep(ctx, client, uid, profile);
      });
      return;
    }

    if (data.startsWith("bk_D:cont:")) {
      const step = data.slice(10);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const bk = profile.session_data?.bk || {};
        const seq = dodaDocSequence(bk.categoryKey || "foot", bk);
        const idx = seq.indexOf(step);
        if (step === "passport") {
          const td = { ...(profile.session_data || {}) };
          td.completed_docs = seq.filter((k) => isDodaUploadDocKey(k));
          await updateProfile(client, uid, {
            session_data: td,
            session_state: "bk_review",
          });
          profile = await ensureProfile(client, uid);
          const summary = buildBkSummaryI18n(lg, profile);
          await logChat(client, uid, "user", "doc:cont:passport");
          await ctx.reply(`${summary}\n\n${tBK(lg, "review_hint")}`, reviewKb(lg, bk));
          return;
        }
        if (idx < 0 || idx >= seq.length - 1) return;
        const next = seq[idx + 1];
        await logChat(client, uid, "user", `doc:cont:${step}`);
        await promptDodaDocStep(ctx, client, uid, profile, next);
      });
      return;
    }

    if (data.startsWith("bk_TR:")) {
      const parsed = parseBkTrCallbackData(data);
      if (!parsed) return;
      const { kind, val } = parsed;
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        if (bk.categoryKey !== "truck") return;

        if (kind === "d") {
          const labelKey = `truck_dim_btn_${val}`;
          const label = tBK(lg, labelKey);
          if (!label || label === labelKey) return;
          bk.truckDimensionCode = val;
          bk.truckDimensionLabel = label;
          td.bk = bk;
          await updateProfile(client, uid, { session_data: td });
          profile = await ensureProfile(client, uid);
          const cmsg = tBKfn(lg, "confirm_truck_dimensions", label);
          await logChat(client, uid, "assistant", cmsg);
          try {
            await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:truck_dim"));
          } catch {
            await ctx.reply(cmsg, editOnly(lg, "bk_E:truck_dim"));
          }
          await promptNextAfterTruckStep(ctx, client, uid, profile);
          return;
        }
        if (kind === "l") {
          const n = Number(val);
          if (![0, 1, 2].includes(n)) return;
          bk.truckLoaders = n;
          td.bk = bk;
          await updateProfile(client, uid, { session_data: td });
          profile = await ensureProfile(client, uid);
          const cmsg = tBKfn(lg, "confirm_truck_loaders", n);
          await logChat(client, uid, "assistant", cmsg);
          try {
            await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:truck_load"));
          } catch {
            await ctx.reply(cmsg, editOnly(lg, "bk_E:truck_load"));
          }
          await promptNextAfterTruckStep(ctx, client, uid, profile);
          return;
        }
        if (kind === "b") {
          if (val !== "0" && val !== "1") return;
          const yes = val === "1";
          bk.truckBranding = yes;
          td.bk = bk;
          await updateProfile(client, uid, { session_data: td });
          profile = await ensureProfile(client, uid);
          const cmsg = tBKfn(lg, "confirm_truck_branding", yes);
          await logChat(client, uid, "assistant", cmsg);
          try {
            await ctx.editMessageText(cmsg, editOnly(lg, "bk_E:truck_wrap"));
          } catch {
            await ctx.reply(cmsg, editOnly(lg, "bk_E:truck_wrap"));
          }
          await promptNextAfterTruckStep(ctx, client, uid, profile);
        }
      });
      return;
    }

    if (data.startsWith("bk_E:")) {
      const field = data.slice(5);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        if (field === "phone") {
          await updateProfile(client, uid, { session_state: "bk_phone", phone: null });
          await logChat(client, uid, "user", "edit:phone");
          await replyAskPhone(ctx, lg);
          return;
        }
        if (field === "cat") {
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.vehicleRf;
          clearTruckBkFields(bk);
          clearBikeFields(bk);
          td.bk = bk;
          await updateProfile(client, uid, {
            session_state: "bk_category",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:cat");
          await sendPlaceholder(ctx, "category", tBK(lg, "ask_category"), categoryInline(lg));
          return;
        }
        if (field === "truck_dim") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.truckDimensionCode;
          delete bk.truckDimensionLabel;
          delete bk.truckPayloadKg;
          delete bk.truckLoaders;
          delete bk.truckBranding;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_truck_dimensions",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:truck_dim");
          await ctx.reply(tBK(lg, "ask_truck_dimensions"), truckDimensionsInline(lg));
          return;
        }
        if (field === "truck_pay") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.truckPayloadKg;
          delete bk.truckLoaders;
          delete bk.truckBranding;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_truck_payload",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:truck_pay");
          await ctx.reply(tBK(lg, "ask_truck_payload"));
          return;
        }
        if (field === "truck_load") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.truckLoaders;
          delete bk.truckBranding;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_truck_loaders",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:truck_load");
          await ctx.reply(tBK(lg, "ask_truck_loaders"), truckLoadersInline(lg));
          return;
        }
        if (field === "truck_wrap") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.truckBranding;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_truck_branding",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:truck_wrap");
          await ctx.reply(tBK(lg, "ask_truck_branding"), truckBrandingInline(lg));
          return;
        }
        if (field === "veh") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = ANY($2::text[])`,
            [uid, ["sts", "tech_passport_front", "tech_passport_back"]]
          );
          const td = { ...(profile.session_data || {}) };
          const done = [...(td.completed_docs || [])].filter(
            (d) =>
              !["sts", "tech_passport_front", "tech_passport_back"].includes(d)
          );
          td.completed_docs = done;
          await updateProfile(client, uid, {
            session_state: "bk_vehicle_rf",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:veh");
          await sendPlaceholder(ctx, "vehicle_rf", tBK(lg, "ask_vehicle_rf"), vehicleRfInline(lg));
          return;
        }
        if (field === "city") {
          await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
          await logChat(client, uid, "user", "edit:city");
          await sendPlaceholder(ctx, "city", tBK(lg, "ask_city"), cityInline(lg));
          return;
        }
        if (field === "cit") {
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          clearBikeFields(bk);
          td.bk = bk;
          await updateProfile(client, uid, {
            session_state: "bk_citizenship",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:cit");
          await sendPlaceholder(ctx, "passport", tBK(lg, "ask_citizenship"), citizenshipInline(lg));
          return;
        }
        if (field === "bself") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          clearBikeFields(bk);
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_self_employed",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:bself");
          await ctx.reply(tBK(lg, "ask_self_employed"), selfEmployedInline(lg));
          return;
        }
        if (field === "binn") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.inn;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_inn",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:binn");
          await ctx.reply(tBK(lg, "ask_inn"));
          return;
        }
        if (field === "bth") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.hasThermal;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_bike_thermal",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:bth");
          await sendPlaceholder(ctx, "thermal", tBK(lg, "ask_thermal"), thermalBikeInline(lg));
          return;
        }
        if (field === "passport") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const done = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          td.completed_docs = done;
          await updateProfile(client, uid, {
            session_state: "bk_doc_passport",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:passport");
          profile = await ensureProfile(client, uid);
          const legal = tBK(lg, "passport_legal_block");
          const p = resolvePlaceholderPath("passport");
          if (p && fs.existsSync(p)) {
            await ctx.replyWithPhoto({ source: p }, { caption: legal });
          } else {
            await ctx.reply(legal);
          }
        }
      });
      return;
    }

    if (data.startsWith("bk_R:")) {
      const rest = data.slice(5);
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        let profile = await ensureProfile(client, uid);
        const lg = langOf(profile);
        if (profile.session_state !== "bk_review") {
          await ctx.reply(tBK(lg, "review_callback_stale"));
          return;
        }
        if (rest === "send") {
          await updateProfile(client, uid, { session_state: "done" });
          profile = await ensureProfile(client, uid);
          await logChat(client, uid, "user", "review:send");
          await notifyGroupFullSubmission(ctx.telegram, profile);
          const bk = profile.session_data?.bk || {};
          const link = communityLinkForCategory(bk.categoryKey);
          const tail = buildBkFinalWait(lg, link);
          await logChat(client, uid, "assistant", tail);
          await ctx.reply(tail, mainMenuReply(lg));
          return;
        }
        if (rest.startsWith("e:")) {
          const f = rest.slice(2);
          if (f === "phone") {
            await updateProfile(client, uid, { session_state: "bk_phone", phone: null });
            await replyAskPhone(ctx, lg);
          } else if (f === "cat") {
            await client.query(`DELETE FROM uploaded_files WHERE telegram_user_id = $1`, [uid]);
            const td = { ...(profile.session_data || {}) };
            td.completed_docs = [];
            const bk = { ...(td.bk || {}) };
            delete bk.categoryKey;
            delete bk.categoryLabel;
            delete bk.vehicleRf;
            clearTruckBkFields(bk);
            clearBikeFields(bk);
            td.bk = bk;
            await updateProfile(client, uid, {
              session_state: "bk_category",
              city: null,
              session_data: td,
            });
            await sendPlaceholder(ctx, "category", tBK(lg, "ask_category"), categoryInline(lg));
          } else if (f === "tdim") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.truckDimensionCode;
            delete bk.truckDimensionLabel;
            delete bk.truckPayloadKg;
            delete bk.truckLoaders;
            delete bk.truckBranding;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_truck_dimensions",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_truck_dimensions"), truckDimensionsInline(lg));
          } else if (f === "tpay") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.truckPayloadKg;
            delete bk.truckLoaders;
            delete bk.truckBranding;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_truck_payload",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_truck_payload"));
          } else if (f === "tload") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.truckLoaders;
            delete bk.truckBranding;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_truck_loaders",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_truck_loaders"), truckLoadersInline(lg));
          } else if (f === "twrap") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.truckBranding;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_truck_branding",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_truck_branding"), truckBrandingInline(lg));
          } else if (f === "city") {
            await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
            await sendPlaceholder(ctx, "city", tBK(lg, "ask_city"), cityInline(lg));
          } else if (f === "cit") {
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            clearBikeFields(bk);
            td.bk = bk;
            await updateProfile(client, uid, {
              session_state: "bk_citizenship",
              session_data: td,
            });
            await sendPlaceholder(ctx, "passport", tBK(lg, "ask_citizenship"), citizenshipInline(lg));
          } else if (f === "bself") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            clearBikeFields(bk);
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_self_employed",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_self_employed"), selfEmployedInline(lg));
          } else if (f === "binn") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.inn;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_inn",
              session_data: td,
            });
            await ctx.reply(tBK(lg, "ask_inn"));
          } else if (f === "bth") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.hasThermal;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_bike_thermal",
              session_data: td,
            });
            await sendPlaceholder(ctx, "thermal", tBK(lg, "ask_thermal"), thermalBikeInline(lg));
          } else if (f === "veh") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = ANY($2::text[])`,
              [uid, ["sts", "tech_passport_front", "tech_passport_back"]]
            );
            const td = { ...(profile.session_data || {}) };
            const done = [...(td.completed_docs || [])].filter(
              (d) =>
                !["sts", "tech_passport_front", "tech_passport_back"].includes(d)
            );
            td.completed_docs = done;
            await updateProfile(client, uid, {
              session_state: "bk_vehicle_rf",
              session_data: td,
            });
            await sendPlaceholder(ctx, "vehicle_rf", tBK(lg, "ask_vehicle_rf"), vehicleRfInline(lg));
          } else if (f === "passport") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_doc_passport",
              session_data: td,
            });
            profile = await ensureProfile(client, uid);
            const legal = tBK(lg, "passport_legal_block");
            const p = resolvePlaceholderPath("passport");
            if (p && fs.existsSync(p)) {
              await ctx.replyWithPhoto({ source: p }, { caption: legal });
            } else {
              await ctx.reply(legal);
            }
          }
        }
      });
      return;
    }
  });

  bot.on("message", async (ctx) => {
    const uid = ctx.from?.id;
    const msg = ctx.message;
    if (!uid || !msg) return;
    if (!msg.text && !msg.photo && !msg.document && !msg.contact) return;
    const text = (msg.text || "").trim();

    await withTransaction(async (client) => {
      await syncTelegramInfo(client, uid, ctx.from);
      let profile = await ensureProfile(client, uid);
      const state = profile.session_state;
      const lg = langOf(profile);

      const menuIn = tBK(lg, "btn_in_park");
      const menuOut = tBK(lg, "btn_not_in_park");
      const menuSupport = tBK(lg, "btn_support");

      if (text === menuSupport) {
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", tBK(lg, "support"));
        await ctx.reply(tBK(lg, "support"), mainMenuReply(lg));
        return;
      }

      if (state === "bk_lang") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK("ru", "err_pick_lang"), languagePickKb());
        return;
      }

      if (state === "bk_main" && text === menuIn) {
        await updateProfile(client, uid, { session_state: "bk_faq" });
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", tBK(lg, "faq_intro"));
        await sendPlaceholder(ctx, "faq", tBK(lg, "faq_intro"), faqMenu(lg));
        return;
      }

      if (state === "bk_main" && text === menuOut) {
        await updateProfile(client, uid, { session_state: "bk_phone" });
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", "[ask_phone]");
        await sendAskPhonePrompt(ctx, lg);
        return;
      }

      if (state === "bk_vehicle_rf") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), vehicleRfInline(lg));
        return;
      }

      if (state === "bk_self_employed") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), selfEmployedInline(lg));
        return;
      }
      if (state === "bk_bike_thermal") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), thermalBikeInline(lg));
        return;
      }
      if (state === "bk_inn") {
        if (msg.photo || msg.document) {
          await ctx.reply(tBK(lg, "err_inn_invalid"));
          return;
        }
        if (!text) {
          await ctx.reply(tBK(lg, "err_inn_invalid"));
          return;
        }
        const raw = text.replace(/\s/g, "").replace(/\u00a0/g, "");
        if (!/^\d{10,13}$/.test(raw)) {
          await ctx.reply(tBK(lg, "err_inn_invalid"));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.inn = raw;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_inn", raw);
        await logChat(client, uid, "user", raw);
        await logChat(client, uid, "assistant", cmsg);
        await ctx.reply(cmsg, editOnly(lg, "bk_E:binn"));
        await promptNextAfterTruckStep(ctx, client, uid, profile);
        return;
      }

      if (state === "bk_truck_dimensions") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), truckDimensionsInline(lg));
        return;
      }
      if (state === "bk_truck_loaders") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), truckLoadersInline(lg));
        return;
      }
      if (state === "bk_truck_branding") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), truckBrandingInline(lg));
        return;
      }

      if (state === "bk_truck_payload") {
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media at truck payload]");
          await ctx.reply(tBK(lg, "err_truck_payload_number"));
          return;
        }
        if (!text) {
          await ctx.reply(tBK(lg, "err_truck_payload_number"));
          return;
        }
        const raw = text.replace(/\s/g, "").replace(/\u00a0/g, "");
        if (!/^\d+$/.test(raw)) {
          await ctx.reply(tBK(lg, "err_truck_payload_number"));
          return;
        }
        const kg = parseInt(raw, 10);
        if (kg < 1 || kg > 100000) {
          await ctx.reply(tBK(lg, "err_truck_payload_number"));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.truckPayloadKg = kg;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_truck_payload", kg);
        await logChat(client, uid, "user", String(kg));
        await logChat(client, uid, "assistant", cmsg);
        await ctx.reply(cmsg, editOnly(lg, "bk_E:truck_pay"));
        await promptNextAfterTruckStep(ctx, client, uid, profile);
        return;
      }

      const docKeyFromState = DOC_PENDING_STATE[state] || DOC_OK_STATE[state];
      if (docKeyFromState) {
        if (!msg.photo && !msg.document) {
          await logChat(client, uid, "user", text || "[no media at doc step]");
          await ctx.reply(tBK(lg, "err_doc_need_photo"));
          return;
        }
        if (hasForbiddenMediaTypes(msg)) {
          await ctx.reply(tBK(lg, "err_wrong_media_type"));
          return;
        }
        if (msg.document && !isAllowedDocumentMime(msg.document.mime_type)) {
          await ctx.reply(tBK(lg, "err_doc_mime"));
          return;
        }
        profile = await ensureProfile(client, uid);
        const accepted = await replaceAcceptDoc(client, ctx, profile, uid, docKeyFromState, msg);
        if (!accepted) {
          await ctx.reply(t(normalizeLang(lg), "invalid_input"));
          return;
        }
        const okState = `bk_doc_${docKeyFromState}_ok`;
        await updateProfile(client, uid, { session_state: okState });
        let cap;
        let markup = continueInline(lg, docKeyFromState);
        if (docKeyFromState === "license") {
          cap = tBK(lg, "confirm_license_uploaded");
        } else if (docKeyFromState === "sts") {
          cap = tBK(lg, "confirm_sts_uploaded");
        } else if (docKeyFromState === "tech_passport_front") {
          cap = tBK(lg, "confirm_tech_passport_front");
        } else if (docKeyFromState === "tech_passport_back") {
          cap = tBK(lg, "confirm_tech_passport_back");
        } else {
          cap = `${tBK(lg, "confirm_passport_uploaded")}\n\n${tBK(lg, "doc_line_passport_spread")}`;
          markup = passportConfirmKb(lg);
        }
        await replyDocUploadedEcho(ctx, lg, msg, cap, markup);
        await logChat(client, uid, "user", `[media] ${docKeyFromState}`);
        return;
      }

      if (state === "bk_category" && text) {
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", tBK(lg, "err_use_buttons_category"));
        await ctx.reply(tBK(lg, "err_use_buttons_category"), categoryInline(lg));
        return;
      }

      if (state === "bk_phone") {
        const manualBtn = tBK(lg, "btn_phone_manual");
        if (text === manualBtn) {
          await logChat(client, uid, "user", text);
          await logChat(client, uid, "assistant", tBK(lg, "ask_phone_manual_hint"));
          await ctx.reply(tBK(lg, "ask_phone_manual_hint"), phoneStepReply(lg));
          return;
        }
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media at phone step]");
          await ctx.reply(tBK(lg, "err_phone_no_media"), phoneStepReply(lg));
          return;
        }
        const phone = normalizeRussianPhone(msg);
        if (!phone) {
          await logChat(client, uid, "user", text || "[bad phone]");
          await logChat(client, uid, "assistant", tBK(lg, "err_phone_invalid"));
          await ctx.reply(tBK(lg, "err_phone_invalid"), phoneStepReply(lg));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        await updateProfile(client, uid, {
          phone,
          session_state: "bk_category",
          session_data: { ...td, bk },
        });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_phone", phone);
        await logChat(client, uid, "user", phone);
        await logChat(client, uid, "assistant", cmsg);
        await ctx.reply(cmsg, editOnly(lg, "bk_E:phone"));
        await sendPlaceholder(ctx, "category", tBK(lg, "ask_category"), categoryInline(lg));
        return;
      }

      if (state === "bk_city_text" || state === "bk_city_pick") {
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media at city step]");
          await ctx.reply(tBK(lg, "err_city_need_text"), cityInline(lg));
          return;
        }
        if (!text) {
          await ctx.reply(tBK(lg, "ask_city"), cityInline(lg));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const city = formatCityForProfile(text);
        await updateProfile(client, uid, {
          city,
          session_state: "bk_citizenship",
          session_data: td,
        });
        profile = await ensureProfile(client, uid);
        await logChat(client, uid, "user", city);
        const cmsg = tBKfn(lg, "confirm_city", city);
        await logChat(client, uid, "assistant", cmsg);
        await ctx.reply(cmsg, editOnly(lg, "bk_E:city"));
        await sendPlaceholder(ctx, "passport", tBK(lg, "ask_citizenship"), citizenshipInline(lg));
        return;
      }

      if (state === "bk_review") {
        const bkRv = profile.session_data?.bk || {};
        if (text) {
          await logChat(client, uid, "user", text);
          await logChat(client, uid, "assistant", tBK(lg, "use_menu"));
        }
        await ctx.reply(tBK(lg, "use_menu"), reviewKb(lg, bkRv));
        return;
      }

      if (state === "bk_faq") {
        if (text) await logChat(client, uid, "user", text);
        await ctx.reply(tBK(lg, "faq_freedom_hint"), faqMenu(lg));
        return;
      }

      if (text && state !== "bk_faq") {
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", tBK(lg, "use_menu"));
        await ctx.reply(tBK(lg, "use_menu"), mainMenuReply(lg));
      }
    });
  });
}
