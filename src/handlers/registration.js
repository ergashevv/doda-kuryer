import { isPhotoDoc, nextPending } from "../flow.js";
import {
  describeCallbackData,
  docLabel,
  formatUserSummary,
  normalizeLang,
  t,
} from "../i18n.js";
import {
  backOnlyKb,
  languageKb,
  serviceKb,
  tariffKb,
} from "../keyboards.js";
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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SVC_MAP = { svc_eda: "yandex_eda", svc_lavka: "yandex_lavka", svc_tax: "taximeter" };
const TRF_MAP = { trf_fb: "foot_bike", trf_car: "car", trf_truck: "truck" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Loyiha ildizidagi MTK / brend rasmi (servis tanlash ekrani). */
const DODA_JPG = path.join(__dirname, "../../doda.jpg");

/**
 * «Қайси сервисда…» — matn + doda.jpg; fayl bo‘lmasa oddiy matn tahriri.
 */
async function showPickServiceScreen(ctx, lang) {
  const lg = normalizeLang(lang);
  const msg = t(lg, "pick_service");
  const kb = serviceKb(lg);
  if (fs.existsSync(DODA_JPG)) {
    try {
      await ctx.deleteMessage();
    } catch {
      /* xabar o‘chirib bo‘lmasa ham yangi rasm yuboriladi */
    }
    await ctx.replyWithPhoto({ source: DODA_JPG }, { caption: msg, ...kb });
  } else {
    await ctx.editMessageText(msg, kb);
  }
}

/** Telegram rasm xabarini oddiy matn bilan tahrirlab bo‘lmaydi — o‘chirib yangisini yuboramiz. */
async function editOrReplacePhotoMessage(ctx, text, markup) {
  if (ctx.callbackQuery?.message?.photo) {
    try {
      await ctx.deleteMessage();
    } catch {
      /* ignore */
    }
    await ctx.reply(text, markup);
  } else {
    await ctx.editMessageText(text, markup);
  }
}

function promptForDoc(lang, docKey) {
  const lg = normalizeLang(lang);
  if (docKey === "bank") return t(lg, "send_bank");
  const label = docLabel(lg, docKey);
  return t(lg, "send_photo_or_file", { label });
}

/** Muvaffaqiyat: `{ bankText }` yoki `{ localPath, mime }`; xato: `null`. */
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

export function registerHandlers(bot) {
  bot.command("start", async (ctx) => {
    const uid = ctx.from?.id;
    if (!uid || !ctx.message) return;
    let text;
    await withTransaction(async (client) => {
      const p = await resetRegistration(client, uid);
      await syncTelegramInfo(client, uid, ctx.from);
      await logChat(client, uid, "user", "/start");
      const lang = normalizeLang(p?.language);
      text = t(lang, "greet");
      await logChat(client, uid, "assistant", text);
    });
    await ctx.reply(text, languageKb());
  });

  bot.on("callback_query", async (ctx) => {
    const q = ctx.callbackQuery;
    const data = q?.data;
    const uid = ctx.from?.id;
    if (!data || !uid) {
      await ctx.answerCbQuery();
      return;
    }
    if (!/^(lang_|svc_|trf_|act_)/.test(data)) {
      await ctx.answerCbQuery();
      return;
    }
    await ctx.answerCbQuery();

    await withTransaction(async (client) => {
      await syncTelegramInfo(client, uid, ctx.from);
      let profile = await ensureProfile(client, uid);
      let lang = normalizeLang(profile.language);

      if (data.startsWith("lang_")) {
        const raw = data.replace("lang_", "").toLowerCase();
        if (!["uz", "ru", "tg", "ky"].includes(raw)) return;
        await updateProfile(client, uid, {
          language: raw,
          session_state: "service",
        });
        await logChat(client, uid, "user", describeCallbackData(data, lang));
        const msg = t(raw, "pick_service");
        await logChat(client, uid, "assistant", msg);
        await showPickServiceScreen(ctx, raw);
        return;
      }

      if (SVC_MAP[data]) {
        await updateProfile(client, uid, {
          service: SVC_MAP[data],
          session_state: "tariff",
        });
        await logChat(client, uid, "user", describeCallbackData(data, lang));
        const msg = t(lang, "pick_tariff");
        await logChat(client, uid, "assistant", msg);
        await editOrReplacePhotoMessage(ctx, msg, tariffKb(lang));
        return;
      }

      if (TRF_MAP[data]) {
        await updateProfile(client, uid, {
          tariff: TRF_MAP[data],
          session_state: "phone",
        });
        await logChat(client, uid, "user", describeCallbackData(data, lang));
        const msg = t(lang, "ask_phone_step");
        await logChat(client, uid, "assistant", msg);
        await ctx.editMessageText(msg, backOnlyKb(lang, "act_back_tariff"));
        return;
      }

      if (data === "act_start") {
        profile = await ensureProfile(client, uid);
        lang = normalizeLang(profile.language);
        if (!profile.tariff) return;
        await updateProfile(client, uid, {
          session_state: "collect",
          session_data: { completed_docs: [] },
        });
        await logChat(client, uid, "user", describeCallbackData("act_start", lang));
        profile = await ensureProfile(client, uid);
        const doc = nextPending([], profile.tariff);
        if (!doc) return;
        const prompt = promptForDoc(lang, doc);
        await logChat(client, uid, "assistant", prompt);
        await ctx.editMessageText(prompt, backOnlyKb(lang, "act_back_collect"));
        return;
      }

      if (data === "act_back_lang") {
        await updateProfile(client, uid, { session_state: "language" });
        await logChat(client, uid, "user", describeCallbackData("act_back_lang", lang));
        const msg = t(lang, "pick_language");
        await logChat(client, uid, "assistant", msg);
        await editOrReplacePhotoMessage(ctx, msg, languageKb());
        return;
      }

      if (data === "act_back_svc") {
        await updateProfile(client, uid, { session_state: "service" });
        await logChat(client, uid, "user", describeCallbackData("act_back_svc", lang));
        const msg = t(lang, "pick_service");
        await logChat(client, uid, "assistant", msg);
        await showPickServiceScreen(ctx, lang);
        return;
      }

      if (data === "act_back_tariff") {
        await updateProfile(client, uid, { session_state: "tariff", city: null, phone: null });
        await logChat(client, uid, "user", describeCallbackData("act_back_tariff", lang));
        const msg = t(lang, "pick_tariff");
        await logChat(client, uid, "assistant", msg);
        await ctx.editMessageText(msg, tariffKb(lang));
        return;
      }

      if (data === "act_back_collect") {
        profile = await ensureProfile(client, uid);
        lang = normalizeLang(profile.language);
        const td = { ...(profile.session_data || {}) };
        let completed = [...(td.completed_docs || [])];
        if (completed.length === 0) {
          await updateProfile(client, uid, { session_state: "city" });
          await logChat(client, uid, "user", describeCallbackData("act_back_collect_city", lang));
          const msg = t(lang, "ask_city");
          await logChat(client, uid, "assistant", msg);
          await ctx.editMessageText(msg);
          return;
        }
        completed.pop();
        td.completed_docs = completed;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);
        const doc = nextPending(completed, profile.tariff || "foot_bike");
        if (!doc) {
          await updateProfile(client, uid, { session_state: "done" });
          return;
        }
        const prompt = promptForDoc(lang, doc);
        await logChat(client, uid, "assistant", prompt);
        await ctx.editMessageText(prompt, backOnlyKb(lang, "act_back_collect"));
        return;
      }
    });
  });

  bot.on("message", async (ctx) => {
    const uid = ctx.from?.id;
    const msg = ctx.message;
    if (!uid || !msg) return;
    if (!msg.text && !msg.photo && !msg.document && !msg.contact) return;

    const text = (msg.text || "").trim();

    let groupNotifyComplete = null;

    await withTransaction(async (client) => {
      await syncTelegramInfo(client, uid, ctx.from);
      let profile = await ensureProfile(client, uid);
      const lang = normalizeLang(profile.language);
      const state = profile.session_state;

      if (state === "phone") {
        if (msg.photo || msg.document) {
          await logChat(client, uid, "user", "[media instead of phone]");
          await logChat(client, uid, "assistant", t(lang, "invalid_phone_step"));
          await ctx.reply(t(lang, "invalid_phone_step"), backOnlyKb(lang, "act_back_tariff"));
          return;
        }
        let phone = null;
        if (msg.contact?.phone_number) {
          phone = msg.contact.phone_number.replace(/\s+/g, "");
        } else if (msg.text) {
          phone = msg.text.replace(/\s+/g, "");
        }
        if (!phone || phone.length < 8) {
          await logChat(client, uid, "user", text || "[no phone]");
          await logChat(client, uid, "assistant", t(lang, "invalid_phone_step"));
          await ctx.reply(t(lang, "invalid_phone_step"), backOnlyKb(lang, "act_back_tariff"));
          return;
        }
        await updateProfile(client, uid, { phone, session_state: "city" });
        await logChat(client, uid, "user", phone);
        const ask = t(lang, "ask_city");
        await logChat(client, uid, "assistant", ask);
        await ctx.reply(ask);
        return;
      }

      if (state === "city" && !text && (msg.photo || msg.document)) {
        await logChat(client, uid, "user", "[media instead of city]");
        await logChat(client, uid, "assistant", t(lang, "ask_city"));
        await ctx.reply(t(lang, "ask_city"));
        return;
      }

      if (state === "city" && text) {
        await updateProfile(client, uid, {
          city: text,
          session_state: "collect",
          session_data: { completed_docs: [] },
        });
        profile = await ensureProfile(client, uid);
        await logChat(client, uid, "user", text);
        const ack = t(lang, "city_received", { city: text });
        const first = nextPending([], profile.tariff || "foot_bike");
        if (!first) {
          await updateProfile(client, uid, { session_state: "done" });
          await logChat(client, uid, "assistant", t(lang, "completed"));
          await ctx.reply(t(lang, "completed"));
          return;
        }
        const ask = `${ack}\n\n${promptForDoc(lang, first)}`;
        await logChat(client, uid, "assistant", ask);
        await ctx.reply(ask, backOnlyKb(lang, "act_back_collect"));
        return;
      }

      if (state === "collect" && profile.tariff) {
        let td = { ...(profile.session_data || {}) };
        let completed = [...(td.completed_docs || [])];
        let doc = nextPending(completed, profile.tariff);
        if (!doc) {
          await updateProfile(client, uid, { session_state: "done" });
          await logChat(client, uid, "user", text || "[media]");
          const done = t(lang, "completed");
          await logChat(client, uid, "assistant", done);
          await ctx.reply(done);
          return;
        }

        await logChat(client, uid, "user", text || "[media]", { doc });
        profile = await ensureProfile(client, uid);
        const accepted = await tryAcceptDoc(client, ctx, profile, uid, doc, msg);
        if (!accepted) {
          await logChat(client, uid, "assistant", t(lang, "invalid_input"));
          await ctx.reply(t(lang, "invalid_input"), backOnlyKb(lang, "act_back_collect"));
          return;
        }

        profile = await ensureProfile(client, uid);
        td = { ...(profile.session_data || {}) };
        completed = [...(td.completed_docs || [])];
        completed.push(doc);
        td.completed_docs = completed;
        await updateProfile(client, uid, { session_data: td });
        profile = await ensureProfile(client, uid);

        const nxt = nextPending(completed, profile.tariff);
        const label = docLabel(lang, doc);
        const saved = t(lang, "saved", { label });
        await logChat(client, uid, "assistant", saved);

        if (!nxt) {
          await updateProfile(client, uid, { session_state: "done" });
          profile = await ensureProfile(client, uid);
          groupNotifyComplete = { profile };
          const done = t(lang, "completed");
          const summaryBlock = formatUserSummary(lang, profile);
          const tail = summaryBlock ? `${done}\n\n${summaryBlock}` : done;
          await logChat(client, uid, "assistant", tail);
          await ctx.reply(`${saved}\n\n${tail}`);
          return;
        }
        const nPrompt = promptForDoc(lang, nxt);
        await logChat(client, uid, "assistant", nPrompt);
        await ctx.reply(`${saved}\n\n${nPrompt}`, backOnlyKb(lang, "act_back_collect"));
        return;
      }

      if (text) {
        await logChat(client, uid, "user", text);
        await logChat(client, uid, "assistant", t(lang, "use_buttons"));
        await ctx.reply(t(lang, "use_buttons"));
      }
    });

    if (groupNotifyComplete?.profile) {
      await notifyGroupFullSubmission(ctx.telegram, groupNotifyComplete.profile);
    }
  });
}
