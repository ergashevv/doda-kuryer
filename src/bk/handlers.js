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
import {
  notifyGroupFullSubmission,
  notifyGroupYandexSubmission,
} from "../services/groupInbox.js";
import { downloadTelegramFile } from "../services/storage.js";
import {
  ensureProfile,
  getProfile,
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
  truckBrandingInline,
  truckDimensionsInline,
  vehicleRfInline,
} from "./keyboards.js";
import {
  handleYandexCallback,
  handleYandexMessage,
  promptYandexStep,
  servicePickInline,
  yxReplyOptions,
} from "./yandexHandlers.js";
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
  delete bk.moyNalogPhone;
  delete bk.smzAddress;
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

function bkCollectMessageIds(sent) {
  if (sent == null) return [];
  if (Array.isArray(sent)) return sent.map((m) => m?.message_id).filter((id) => id != null);
  return [sent.message_id].filter((id) => id != null);
}

/** Ro‘yxatdan o‘tishda chatda faqat oxirgi bot savoli qolishi uchun eski qadam xabarlarini o‘chiradi. */
async function bkSendStepMessage(ctx, client, uid, profile, send) {
  const chatId = ctx.chat?.id;
  let td = { ...(profile.session_data || {}) };
  const prev = [...(td.bk_ui_message_ids || [])];
  if (chatId && prev.length) {
    for (const mid of prev) {
      try {
        await ctx.telegram.deleteMessage(chatId, mid);
      } catch (_) {}
    }
  }
  td.bk_ui_message_ids = [];
  await updateProfile(client, uid, { session_data: td });
  profile = await ensureProfile(client, uid);
  const sent = await send();
  const ids = bkCollectMessageIds(sent);
  td = { ...(profile.session_data || {}) };
  td.bk_ui_message_ids = ids;
  await updateProfile(client, uid, { session_data: td });
  return sent;
}

async function bkClearStepUi(ctx, client, uid, profile) {
  const chatId = ctx.chat?.id;
  const td = { ...(profile.session_data || {}) };
  const prev = [...(td.bk_ui_message_ids || [])];
  if (chatId && prev.length) {
    for (const mid of prev) {
      try {
        await ctx.telegram.deleteMessage(chatId, mid);
      } catch (_) {}
    }
  }
  td.bk_ui_message_ids = [];
  await updateProfile(client, uid, { session_data: td });
}

async function sendBkPlaceholderStep(ctx, client, uid, profile, key, caption, extra = {}) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const p = resolvePlaceholderPath(key);
    if (p && fs.existsSync(p)) {
      return await ctx.replyWithPhoto({ source: p }, { caption, ...extra });
    }
    return await ctx.reply(caption, extra);
  });
}

async function bkReplyStep(ctx, client, uid, profile, text, extra = {}) {
  return bkSendStepMessage(ctx, client, uid, profile, () => ctx.reply(text, extra));
}

async function sendBkAskPhonePrompt(ctx, client, uid, profile, lg) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const { text, parse_mode } = buildAskPhoneHtml(lg);
    const kb = phoneStepReply(lg);
    const p = resolvePlaceholderPath("phone");
    const hasPhoto = p && fs.existsSync(p);
    if (hasPhoto) {
      const m1 = await ctx.replyWithPhoto(
        { source: p },
        { caption: text, parse_mode: parse_mode || undefined }
      );
      const m2 = await ctx.reply(tBK(lg, "ask_phone_keyboard_nudge"), kb);
      return [m1, m2];
    }
    const ex = { ...kb };
    if (parse_mode) ex.parse_mode = parse_mode;
    return await ctx.reply(text, ex);
  });
}

async function replyBkAskPhoneNoPhoto(ctx, client, uid, profile, lg) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const { text, parse_mode } = buildAskPhoneHtml(lg);
    const extra = { ...phoneStepReply(lg) };
    if (parse_mode) extra.parse_mode = parse_mode;
    return await ctx.reply(text, extra);
  });
}

async function replyBkDocUploadedEcho(ctx, client, uid, profile, lg, msg, caption, markup) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    let fileId = null;
    if (msg.photo?.length) {
      fileId = msg.photo[msg.photo.length - 1].file_id;
    } else if (msg.document) {
      fileId = msg.document.file_id;
    }
    if (!fileId) {
      return await ctx.reply(caption, markup);
    }
    return await ctx.replyWithPhoto(fileId, {
      caption,
      ...markup,
    });
  });
}

async function sendBkReviewMessage(ctx, client, uid, profile) {
  const lg = langOf(profile);
  const bk2 = profile.session_data?.bk || {};
  const summary = buildBkSummaryI18n(lg, profile);
  return bkSendStepMessage(ctx, client, uid, profile, () =>
    ctx.reply(`${summary}\n\n${tBK(lg, "review_hint")}`, reviewKb(lg, bk2))
  );
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
  await sendBkReviewMessage(ctx, client, uid, p2);
}

async function promptDodaDocStep(ctx, client, uid, profile, docKey) {
  const lg = langOf(profile);
  if (docKey === "license") {
    await updateProfile(client, uid, { session_state: "bk_doc_license" });
    profile = await ensureProfile(client, uid);
    await sendBkPlaceholderStep(ctx, client, uid, profile, "license", tBK(lg, "ask_license_front"));
    return;
  }
  if (docKey === "sts") {
    await updateProfile(client, uid, { session_state: "bk_doc_sts" });
    profile = await ensureProfile(client, uid);
    await sendBkPlaceholderStep(ctx, client, uid, profile, "sts", tBK(lg, "ask_sts_front"));
    return;
  }
  if (docKey === "tech_passport_front") {
    await updateProfile(client, uid, { session_state: "bk_doc_tech_passport_front" });
    profile = await ensureProfile(client, uid);
    await sendBkPlaceholderStep(
      ctx,
      client,
      uid,
      profile,
      "tech_passport_front",
      tBK(lg, "ask_tech_passport_front")
    );
    return;
  }
  if (docKey === "tech_passport_back") {
    await updateProfile(client, uid, { session_state: "bk_doc_tech_passport_back" });
    profile = await ensureProfile(client, uid);
    await sendBkPlaceholderStep(
      ctx,
      client,
      uid,
      profile,
      "tech_passport_back",
      tBK(lg, "ask_tech_passport_back")
    );
    return;
  }
  if (docKey === "truck_dimensions") {
    await updateProfile(client, uid, { session_state: "bk_truck_dimensions" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_truck_dimensions"), truckDimensionsInline(lg));
    return;
  }
  if (docKey === "truck_payload") {
    await updateProfile(client, uid, { session_state: "bk_truck_payload" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_truck_payload"));
    return;
  }
  if (docKey === "truck_branding") {
    await updateProfile(client, uid, { session_state: "bk_truck_branding" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_truck_branding"), truckBrandingInline(lg));
    return;
  }
  if (docKey === "self_employed") {
    await updateProfile(client, uid, { session_state: "bk_self_employed" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_self_employed"), selfEmployedInline(lg));
    return;
  }
  if (docKey === "inn") {
    await updateProfile(client, uid, { session_state: "bk_inn" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_inn"));
    return;
  }
  if (docKey === "bike_smz_phone") {
    await updateProfile(client, uid, { session_state: "bk_bike_smz_phone" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_phone"));
    return;
  }
  if (docKey === "bike_smz_address") {
    await updateProfile(client, uid, { session_state: "bk_bike_smz_address" });
    profile = await ensureProfile(client, uid);
    await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_address"));
    return;
  }
  if (docKey === "passport") {
    await updateProfile(client, uid, { session_state: "bk_doc_passport" });
    profile = await ensureProfile(client, uid);
    const bk = profile.session_data?.bk || {};
    const legal =
      bk.categoryKey === "bike"
        ? tBK(lg, "passport_legal_block_bike")
        : tBK(lg, "passport_legal_block");
    const p = resolvePlaceholderPath("passport");
    await bkSendStepMessage(ctx, client, uid, profile, async () => {
      if (p && fs.existsSync(p)) {
        return await ctx.replyWithPhoto({ source: p }, { caption: legal });
      }
      return await ctx.reply(legal);
    });
  }
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
      await client.query(
        `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type LIKE 'yx_%'`,
        [uid]
      );
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
    try {
      await ctx.answerCbQuery();
    } catch (e) {
      console.warn("[bk] answerCbQuery:", e?.description || e?.message || e);
    }

    /** Yandex «Отправить»: faqat DB — commit bo‘lgach Telegram (xato rollback qilmaydi). */
    if (data === "bk_YR:send") {
      let profileAfter = null;
      try {
        profileAfter = await withTransaction(async (client) => {
          const profile = await ensureProfile(client, uid);
          if (profile.session_state !== "bk_yx_review") return null;
          await updateProfile(client, uid, { session_state: "done" });
          return getProfile(client, uid);
        });
      } catch (e) {
        console.error("[bk] bk_YR:send DB:", e?.stack || e?.message || e);
        try {
          await ctx.reply(
            "Временная ошибка сервера. Попробуйте ещё раз или отправьте /start"
          );
        } catch (replyErr) {
          console.warn("[bk] bk_YR:send fallback reply:", replyErr?.message || replyErr);
        }
        return;
      }
      if (!profileAfter) {
        let p;
        try {
          p = await withTransaction(async (client) => ensureProfile(client, uid));
        } catch (e) {
          console.error("[bk] bk_YR:send stale read:", e?.message || e);
          return;
        }
        const lg = langOf(p);
        try {
          await ctx.reply(tBK(lg, "review_callback_stale"));
        } catch (replyErr) {
          console.warn("[bk] stale reply:", replyErr?.message || replyErr);
        }
        return;
      }
      const lg = langOf(profileAfter);
      try {
        await notifyGroupYandexSubmission(ctx.telegram, profileAfter);
      } catch (e) {
        console.error("[bk] notifyGroupYandexSubmission:", e?.stack || e?.message || e);
      }
      const tail = tBK(lg, "yx_final_thanks");
      try {
        await ctx.reply(tail, mainMenuReply(lg));
      } catch (e) {
        console.error("[bk] yx_final reply:", e?.stack || e?.message || e);
      }
      try {
        await withTransaction(async (client) => {
          await logChat(client, uid, "assistant", tail);
        });
      } catch (e) {
        console.error("[bk] yx_final logChat:", e?.stack || e?.message || e);
      }
      return;
    }

    let yandexHandled = false;
    try {
      await withTransaction(async (client) => {
        yandexHandled = await handleYandexCallback(ctx, client, uid, data);
      });
    } catch (e) {
      console.error("[bk] Yandex callback transaction:", e?.stack || e?.message || e);
      try {
        await ctx.reply(
          "Временная ошибка сервера. Попробуйте ещё раз или отправьте /start"
        );
      } catch (replyErr) {
        console.warn("[bk] yandex error reply:", replyErr?.message || replyErr);
      }
      return;
    }
    if (yandexHandled) return;

    if (data.startsWith("bk_L:")) {
      const code = data.slice(5);
      if (!["uz", "ru", "tg", "ky"].includes(code)) return;
      await withTransaction(async (client) => {
        await syncTelegramInfo(client, uid, ctx.from);
        await updateProfile(client, uid, {
          language: code,
          session_state: "bk_phone",
        });
        await logChat(client, uid, "user", `lang:${code}`);
        const cbMsg = ctx.callbackQuery?.message;
        if (cbMsg && "message_id" in cbMsg && ctx.chat?.id) {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, cbMsg.message_id);
          } catch (_) {}
        }
        const profile = await ensureProfile(client, uid);
        await sendBkAskPhonePrompt(ctx, client, uid, profile, code);
      });
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
          await sendBkPlaceholderStep(ctx, client, uid, profile, "vehicle_rf", ask, vehicleRfInline(lg));
          return;
        }
        if (cat === "moto") {
          await updateProfile(client, uid, { session_data: td });
          profile = await ensureProfile(client, uid);
          const msg = tBKfn(lg, "confirm_category", label);
          await logChat(client, uid, "assistant", msg);
          try {
            await ctx.editMessageText(msg, editOnly(lg, "bk_E:cat"));
          } catch {
            await ctx.reply(msg, editOnly(lg, "bk_E:cat"));
          }
          profile = await ensureDodaTariffService(client, uid, profile);
          await promptFirstMissingDodaDoc(ctx, client, uid, profile);
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
        await sendBkPlaceholderStep(ctx, client, uid, profile, "city", ask, cityInline(lg));
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
          await sendBkPlaceholderStep(ctx, client, uid, profile, "city", ask, cityInline(lg));
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_city"), cityInline(lg));
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
        await sendBkPlaceholderStep(ctx, client, uid, profile, "passport", ask, citizenshipInline(lg));
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
        if (!yes) {
          delete bk.inn;
          delete bk.moyNalogPhone;
          delete bk.smzAddress;
        }
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
          await logChat(client, uid, "user", "doc:cont:passport");
          await sendBkReviewMessage(ctx, client, uid, profile);
          return;
        }
        // Ketma-kilikda yo'q qadam (masalan eski moto oqimida СТС) — qayta hisoblash
        if (idx < 0) {
          await promptFirstMissingDodaDoc(ctx, client, uid, profile);
          return;
        }
        if (idx >= seq.length - 1) return;
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
          profile = await ensureProfile(client, uid);
          await replyBkAskPhoneNoPhoto(ctx, client, uid, profile, lg);
          return;
        }
        if (field === "yx") {
          if (profile.session_state !== "bk_yx") {
            await ctx.reply(tBK(lg, "review_callback_stale"));
            return;
          }
          await logChat(client, uid, "user", "edit:yx_reprompt");
          await promptYandexStep(ctx, client, uid, profile);
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
          profile = await ensureProfile(client, uid);
          await sendBkPlaceholderStep(
            ctx,
            client,
            uid,
            profile,
            "category",
            tBK(lg, "ask_category"),
            categoryInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(
            ctx,
            client,
            uid,
            profile,
            tBK(lg, "ask_truck_dimensions"),
            truckDimensionsInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_truck_payload"));
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(
            ctx,
            client,
            uid,
            profile,
            tBK(lg, "ask_truck_branding"),
            truckBrandingInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await sendBkPlaceholderStep(
            ctx,
            client,
            uid,
            profile,
            "vehicle_rf",
            tBK(lg, "ask_vehicle_rf"),
            vehicleRfInline(lg)
          );
          return;
        }
        if (field === "city") {
          await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
          await logChat(client, uid, "user", "edit:city");
          profile = await ensureProfile(client, uid);
          await sendBkPlaceholderStep(
            ctx,
            client,
            uid,
            profile,
            "city",
            tBK(lg, "ask_city"),
            cityInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await sendBkPlaceholderStep(
            ctx,
            client,
            uid,
            profile,
            "passport",
            tBK(lg, "ask_citizenship"),
            citizenshipInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(
            ctx,
            client,
            uid,
            profile,
            tBK(lg, "ask_self_employed"),
            selfEmployedInline(lg)
          );
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
          profile = await ensureProfile(client, uid);
          await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_inn"));
          return;
        }
        if (field === "bsmzphone") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.moyNalogPhone;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_bike_smz_phone",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:bsmzphone");
          profile = await ensureProfile(client, uid);
          await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_phone"));
          return;
        }
        if (field === "bsmzaddr") {
          await client.query(
            `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
            [uid]
          );
          const td = { ...(profile.session_data || {}) };
          const bk = { ...(td.bk || {}) };
          delete bk.smzAddress;
          td.bk = bk;
          td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
          await updateProfile(client, uid, {
            session_state: "bk_bike_smz_address",
            session_data: td,
          });
          await logChat(client, uid, "user", "edit:bsmzaddr");
          profile = await ensureProfile(client, uid);
          await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_address"));
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
          await bkSendStepMessage(ctx, client, uid, profile, async () => {
            if (p && fs.existsSync(p)) {
              return await ctx.replyWithPhoto({ source: p }, { caption: legal });
            }
            return await ctx.reply(legal);
          });
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
          await bkClearStepUi(ctx, client, uid, profile);
          profile = await ensureProfile(client, uid);
          await ctx.reply(tail, mainMenuReply(lg));
          return;
        }
        if (rest.startsWith("e:")) {
          const f = rest.slice(2);
          if (f === "phone") {
            const tdPh = { ...(profile.session_data || {}) };
            const bkPh = { ...(tdPh.bk || {}) };
            bkPh.returnToReview = true;
            tdPh.bk = bkPh;
            await updateProfile(client, uid, {
              session_state: "bk_phone",
              phone: null,
              session_data: tdPh,
            });
            profile = await ensureProfile(client, uid);
            await replyBkAskPhoneNoPhoto(ctx, client, uid, profile, lg);
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
            profile = await ensureProfile(client, uid);
            await sendBkPlaceholderStep(
              ctx,
              client,
              uid,
              profile,
              "category",
              tBK(lg, "ask_category"),
              categoryInline(lg)
            );
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
            profile = await ensureProfile(client, uid);
            await bkReplyStep(
              ctx,
              client,
              uid,
              profile,
              tBK(lg, "ask_truck_dimensions"),
              truckDimensionsInline(lg)
            );
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
            profile = await ensureProfile(client, uid);
            await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_truck_payload"));
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
            profile = await ensureProfile(client, uid);
            await bkReplyStep(
              ctx,
              client,
              uid,
              profile,
              tBK(lg, "ask_truck_branding"),
              truckBrandingInline(lg)
            );
          } else if (f === "city") {
            await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
            profile = await ensureProfile(client, uid);
            await sendBkPlaceholderStep(
              ctx,
              client,
              uid,
              profile,
              "city",
              tBK(lg, "ask_city"),
              cityInline(lg)
            );
          } else if (f === "cit") {
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            clearBikeFields(bk);
            td.bk = bk;
            await updateProfile(client, uid, {
              session_state: "bk_citizenship",
              session_data: td,
            });
            profile = await ensureProfile(client, uid);
            await sendBkPlaceholderStep(
              ctx,
              client,
              uid,
              profile,
              "passport",
              tBK(lg, "ask_citizenship"),
              citizenshipInline(lg)
            );
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
            profile = await ensureProfile(client, uid);
            await bkReplyStep(
              ctx,
              client,
              uid,
              profile,
              tBK(lg, "ask_self_employed"),
              selfEmployedInline(lg)
            );
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
            profile = await ensureProfile(client, uid);
            await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_inn"));
          } else if (f === "bsmzphone") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.moyNalogPhone;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_bike_smz_phone",
              session_data: td,
            });
            profile = await ensureProfile(client, uid);
            await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_phone"));
          } else if (f === "bsmzaddr") {
            await client.query(
              `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = 'passport'`,
              [uid]
            );
            const td = { ...(profile.session_data || {}) };
            const bk = { ...(td.bk || {}) };
            delete bk.smzAddress;
            td.bk = bk;
            td.completed_docs = [...(td.completed_docs || [])].filter((d) => d !== "passport");
            await updateProfile(client, uid, {
              session_state: "bk_bike_smz_address",
              session_data: td,
            });
            profile = await ensureProfile(client, uid);
            await bkReplyStep(ctx, client, uid, profile, tBK(lg, "ask_bike_smz_address"));
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
            profile = await ensureProfile(client, uid);
            await sendBkPlaceholderStep(
              ctx,
              client,
              uid,
              profile,
              "vehicle_rf",
              tBK(lg, "ask_vehicle_rf"),
              vehicleRfInline(lg)
            );
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
            await bkSendStepMessage(ctx, client, uid, profile, async () => {
              if (p && fs.existsSync(p)) {
                return await ctx.replyWithPhoto({ source: p }, { caption: legal });
              }
              return await ctx.reply(legal);
            });
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
    if (!msg.text && !msg.photo && !msg.document && !msg.contact && !msg.video) return;
    const text = (msg.text || "").trim();

    await withTransaction(async (client) => {
      await syncTelegramInfo(client, uid, ctx.from);
      let profile = await ensureProfile(client, uid);
      const state = profile.session_state;
      const lg = langOf(profile);
      const bkMsg = profile.session_data?.bk || {};
      if (
        bkMsg.categoryKey === "moto" &&
        (state === "bk_doc_sts" || state === "bk_doc_sts_ok")
      ) {
        await promptFirstMissingDodaDoc(ctx, client, uid, profile);
        return;
      }

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

      if (state === "bk_yx_review") {
        await logChat(client, uid, "user", text || "[non-text at yx review]");
        await ctx.reply(tBK(lg, "yx_review_use_buttons"));
        return;
      }

      if (state === "bk_yx") {
        const yxDone = await handleYandexMessage(ctx, client, uid, profile, msg);
        if (yxDone) return;
      }

      if (state === "bk_service") {
        await logChat(client, uid, "user", text || "[non-text at service]");
        await ctx.reply(tBK(lg, "ask_service"), yxReplyOptions(servicePickInline(lg)));
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
        await logChat(client, uid, "user", text);
        if (!profile.phone) {
          const td0 = { ...(profile.session_data || {}) };
          const bk0 = { ...(td0.bk || {}) };
          bk0.afterPhone = "service";
          td0.bk = bk0;
          await updateProfile(client, uid, {
            session_state: "bk_phone",
            session_data: td0,
          });
          await logChat(client, uid, "assistant", "[ask_phone service]");
          profile = await ensureProfile(client, uid);
          await sendBkAskPhonePrompt(ctx, client, uid, profile, lg);
        } else {
          await updateProfile(client, uid, { session_state: "bk_service" });
          await logChat(client, uid, "assistant", "[ask_service]");
          await ctx.reply(tBK(lg, "ask_service"), yxReplyOptions(servicePickInline(lg)));
        }
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
        await promptFirstMissingDodaDoc(ctx, client, uid, profile);
        return;
      }
      if (state === "bk_bike_smz_phone") {
        if (msg.photo || msg.document) {
          await ctx.reply(tBK(lg, "err_bike_smz_phone_invalid"));
          return;
        }
        const phone = normalizeRussianPhone(msg);
        if (!phone) {
          await logChat(client, uid, "user", text || "[bad smz phone]");
          await ctx.reply(tBK(lg, "err_bike_smz_phone_invalid"));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.moyNalogPhone = phone;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_bike_smz_phone", phone);
        await logChat(client, uid, "user", phone);
        await logChat(client, uid, "assistant", cmsg);
        await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:bsmzphone"));
        profile = await ensureProfile(client, uid);
        await promptNextAfterTruckStep(ctx, client, uid, profile);
        return;
      }
      if (state === "bk_bike_smz_address") {
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media at smz address]");
          await ctx.reply(tBK(lg, "err_bike_smz_address_no_media"));
          return;
        }
        if (!text) {
          await ctx.reply(tBK(lg, "err_bike_smz_address_short"));
          return;
        }
        const addr = text.trim();
        if (addr.length < 12) {
          await logChat(client, uid, "user", addr);
          await ctx.reply(tBK(lg, "err_bike_smz_address_short"));
          return;
        }
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        bk.smzAddress = addr;
        td.bk = bk;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_bike_smz_address", addr);
        await logChat(client, uid, "user", addr);
        await logChat(client, uid, "assistant", cmsg);
        await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:bsmzaddr"));
        profile = await ensureProfile(client, uid);
        await promptNextAfterTruckStep(ctx, client, uid, profile);
        return;
      }
      if (state === "bk_inn") {
        const bkInn = profile.session_data?.bk || {};
        if (
          bkInn.categoryKey === "bike" &&
          bkInn.rfCitizen === true
        ) {
          await promptFirstMissingDodaDoc(ctx, client, uid, profile);
          return;
        }
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
        await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:binn"));
        profile = await ensureProfile(client, uid);
        await promptNextAfterTruckStep(ctx, client, uid, profile);
        return;
      }

      if (state === "bk_truck_dimensions") {
        await logChat(client, uid, "user", text || "[non-text]");
        await ctx.reply(tBK(lg, "err_use_buttons_category"), truckDimensionsInline(lg));
        return;
      }
      /** Eski versiya: грузчики qadami olib tashlangan — qolganlar brandingga yo‘naltiriladi */
      if (state === "bk_truck_loaders") {
        const td = { ...(profile.session_data || {}) };
        const bk = { ...(td.bk || {}) };
        delete bk.truckLoaders;
        td.bk = bk;
        await updateProfile(client, uid, {
          session_state: "bk_truck_branding",
          session_data: td,
        });
        profile = await ensureProfile(client, uid);
        await bkReplyStep(
          ctx,
          client,
          uid,
          profile,
          tBK(lg, "ask_truck_branding"),
          truckBrandingInline(lg)
        );
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
        await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:truck_pay"));
        profile = await ensureProfile(client, uid);
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
        profile = await ensureProfile(client, uid);
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
        await replyBkDocUploadedEcho(ctx, client, uid, profile, lg, msg, cap, markup);
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
        const afterPhone = bk.afterPhone;
        const returnToReview = bk.returnToReview;
        delete bk.afterPhone;
        delete bk.returnToReview;

        if (returnToReview) {
          await updateProfile(client, uid, {
            phone,
            session_state: "bk_review",
            session_data: { ...td, bk },
          });
          profile = await ensureProfile(client, uid);
          const cmsg = tBKfn(lg, "confirm_phone", phone);
          await logChat(client, uid, "user", phone);
          await logChat(client, uid, "assistant", cmsg);
          const bkRv = profile.session_data?.bk || {};
          await bkSendStepMessage(ctx, client, uid, profile, async () => {
            const m1 = await ctx.reply(cmsg, editOnly(lg, "bk_E:phone"));
            const m2 = await ctx.reply(tBK(lg, "review_hint"), reviewKb(lg, bkRv));
            return [m1, m2];
          });
          return;
        }

        const nextState = afterPhone === "service" ? "bk_service" : "bk_main";
        await updateProfile(client, uid, {
          phone,
          session_state: nextState,
          session_data: { ...td, bk },
        });
        profile = await ensureProfile(client, uid);
        const cmsg = tBKfn(lg, "confirm_phone", phone);
        await logChat(client, uid, "user", phone);
        await logChat(client, uid, "assistant", cmsg);
        if (afterPhone === "service") {
          await bkSendStepMessage(ctx, client, uid, profile, async () => {
            const m1 = await ctx.reply(cmsg, editOnly(lg, "bk_E:phone"));
            const m2 = await ctx.reply(tBK(lg, "ask_service"), yxReplyOptions(servicePickInline(lg)));
            return [m1, m2];
          });
        } else {
          await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:phone"));
          await sendWelcomeAfterLanguage(ctx, uid, lg);
        }
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
        await bkReplyStep(ctx, client, uid, profile, cmsg, editOnly(lg, "bk_E:city"));
        profile = await ensureProfile(client, uid);
        await sendBkPlaceholderStep(
          ctx,
          client,
          uid,
          profile,
          "passport",
          tBK(lg, "ask_citizenship"),
          citizenshipInline(lg)
        );
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
