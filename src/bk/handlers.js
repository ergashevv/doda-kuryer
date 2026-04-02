import { dodaDocSequence, isPhotoDoc } from "../flow.js";
import {
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
  reviewKb,
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

async function sendPlaceholder(ctx, key, caption, extra = {}) {
  const p = resolvePlaceholderPath(key);
  if (p && fs.existsSync(p)) {
    await ctx.replyWithPhoto({ source: p }, { caption, ...extra });
  } else {
    await ctx.reply(caption, extra);
  }
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
  if (docKey === "passport") {
    await updateProfile(client, uid, { session_state: "bk_doc_passport" });
    const legal = tBK(lg, "passport_legal_block");
    const p = resolvePlaceholderPath("passport");
    if (p && fs.existsSync(p)) {
      await ctx.replyWithPhoto({ source: p }, { caption: legal });
    } else {
      await ctx.reply(legal);
    }
  }
}

async function enterDodaDocumentFlow(ctx, client, uid, profile) {
  const td = { ...(profile.session_data || {}) };
  const bk = { ...(td.bk || {}) };
  bk.categoryKey = bk.categoryKey || "foot";
  const tariff = mapCategoryToTariff(bk.categoryKey);
  td.bk = bk;
  td.completed_docs = [];
  await client.query(`DELETE FROM uploaded_files WHERE telegram_user_id = $1`, [uid]);
  await updateProfile(client, uid, {
    session_data: td,
    tariff,
    service: "doda_taxi",
  });
  const p2 = await ensureProfile(client, uid);
  const seq = dodaDocSequence(bk.categoryKey);
  const first = seq[0];
  await promptDodaDocStep(ctx, client, uid, p2, first);
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
  bk_doc_passport: "passport",
};

const DOC_OK_STATE = {
  bk_doc_license_ok: "license",
  bk_doc_sts_ok: "sts",
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
        session_state: "bk_main",
        session_data: { bk: {} },
        service: null,
        tariff: null,
        city: null,
        phone: null,
      });
    });
    await sendWelcomeAfterLanguage(ctx, uid, "ru");
  });

  bot.command("ARENDA", async (ctx) => {
    const uid = ctx.from?.id;
    if (!uid) return;
    let lg = "ru";
    await withTransaction(async (client) => {
      const p = await ensureProfile(client, uid);
      lg = langOf(p);
    });
    await sendPlaceholder(ctx, "arenda", tBK(lg, "arenda"), mainMenuReply(lg));
    await withTransaction(async (client) => {
      await logChat(client, uid, "user", "/ARENDA");
      await logChat(client, uid, "assistant", tBK(lg, "arenda"));
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
        td.bk = bk;
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
        await enterDodaDocumentFlow(ctx, client, uid, profile);
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
        const seq = dodaDocSequence(bk.categoryKey || "foot");
        const idx = seq.indexOf(step);
        if (step === "passport") {
          const td = { ...(profile.session_data || {}) };
          td.completed_docs = [...seq];
          await updateProfile(client, uid, {
            session_data: td,
            session_state: "bk_review",
          });
          profile = await ensureProfile(client, uid);
          const summary = buildBkSummaryI18n(lg, profile);
          await logChat(client, uid, "user", "doc:cont:passport");
          await ctx.reply(`${summary}\n\n${tBK(lg, "review_hint")}`, reviewKb(lg));
          return;
        }
        if (idx < 0 || idx >= seq.length - 1) return;
        const next = seq[idx + 1];
        await logChat(client, uid, "user", `doc:cont:${step}`);
        await promptDodaDocStep(ctx, client, uid, profile, next);
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
          await ctx.reply(tBK(lg, "ask_phone"), mainMenuReply(lg));
          return;
        }
        if (field === "cat") {
          await updateProfile(client, uid, { session_state: "bk_category" });
          await logChat(client, uid, "user", "edit:cat");
          await sendPlaceholder(ctx, "category", tBK(lg, "ask_category"), categoryInline(lg));
          return;
        }
        if (field === "city") {
          await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
          await logChat(client, uid, "user", "edit:city");
          await sendPlaceholder(ctx, "city", tBK(lg, "ask_city"), cityInline(lg));
          return;
        }
        if (field === "cit") {
          await updateProfile(client, uid, { session_state: "bk_citizenship" });
          await logChat(client, uid, "user", "edit:cit");
          await sendPlaceholder(ctx, "passport", tBK(lg, "ask_citizenship"), citizenshipInline(lg));
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
            await ctx.reply(tBK(lg, "ask_phone"), mainMenuReply(lg));
          } else if (f === "cat") {
            await client.query(`DELETE FROM uploaded_files WHERE telegram_user_id = $1`, [uid]);
            const td = { ...(profile.session_data || {}) };
            td.completed_docs = [];
            const bk = { ...(td.bk || {}) };
            delete bk.categoryKey;
            delete bk.categoryLabel;
            td.bk = bk;
            await updateProfile(client, uid, {
              session_state: "bk_category",
              city: null,
              session_data: td,
            });
            await sendPlaceholder(ctx, "category", tBK(lg, "ask_category"), categoryInline(lg));
          } else if (f === "city") {
            await updateProfile(client, uid, { session_state: "bk_city_pick", city: null });
            await sendPlaceholder(ctx, "city", tBK(lg, "ask_city"), cityInline(lg));
          } else if (f === "cit") {
            await updateProfile(client, uid, { session_state: "bk_citizenship" });
            await sendPlaceholder(ctx, "passport", tBK(lg, "ask_citizenship"), citizenshipInline(lg));
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
        await logChat(client, uid, "assistant", tBK(lg, "ask_phone"));
        await sendPlaceholder(ctx, "phone", tBK(lg, "ask_phone"), mainMenuReply(lg));
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
        await ctx.reply(tBK(lg, "err_use_buttons_category"), mainMenuReply(lg));
        return;
      }

      if (state === "bk_phone") {
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media at phone step]");
          await ctx.reply(tBK(lg, "err_phone_no_media"), mainMenuReply(lg));
          return;
        }
        const phone = normalizeRussianPhone(msg);
        if (!phone) {
          await logChat(client, uid, "user", text || "[bad phone]");
          await logChat(client, uid, "assistant", tBK(lg, "err_phone_invalid"));
          await ctx.reply(tBK(lg, "err_phone_invalid"), mainMenuReply(lg));
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
        if (text) {
          await logChat(client, uid, "user", text);
          await logChat(client, uid, "assistant", tBK(lg, "use_menu"));
        }
        await ctx.reply(tBK(lg, "use_menu"), reviewKb(lg));
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
