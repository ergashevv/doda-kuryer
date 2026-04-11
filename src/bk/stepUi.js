import fs from "node:fs";
import { ensureProfile, updateProfile } from "../services/users.js";
import { buildAskPhoneHtml, buildBkSummaryI18n, normalizeBKLang, tBK } from "./i18n.js";
import { phoneStepInline, phoneStepReply, replyRemoveWithInline, reviewKb } from "./keyboards.js";
import { resolvePlaceholderPath } from "./placeholders.js";

export function bkCollectMessageIds(sent) {
  if (sent == null) return [];
  if (Array.isArray(sent)) return sent.map((m) => m?.message_id).filter((id) => id != null);
  return [sent.message_id].filter((id) => id != null);
}

/** Bir nechta xabarni parallel o‘chirish — ketma-ket `deleteMessage` qadamini sekinlashtirardi. */
export async function telegramDeleteMany(ctx, chatId, messageIds) {
  if (chatId == null || !messageIds?.length) return;
  await Promise.all(
    messageIds.map((mid) => ctx.telegram.deleteMessage(chatId, mid).catch(() => {}))
  );
}

/** Doda hujjat oqimi flagi (user media tozalash qoidalari uchun kerak). */
export function isBkDocWizardSessionState(sessionState) {
  return typeof sessionState === "string" && /^bk_doc_/.test(sessionState);
}

/**
 * Shaxsiy chatda user xabarini o‘chirish (handlers faqat `bk_doc_*` qadamlarida chaqiradi).
 */
export async function tryBkDeleteUserMessage(ctx, msg) {
  const chatId = ctx.chat?.id;
  const mid = msg?.message_id;
  if (chatId == null || mid == null) return;
  try {
    await ctx.telegram.deleteMessage(chatId, mid);
  } catch (_) {}
}

/** Hujjat qabul → preview → «Продолжить» gacha user media chatda qoladi; keyingi qadamda o‘chadi. */
export async function flushBkPendingUserMessage(ctx, td, chatId) {
  const mid = td.bk_pending_user_message_id;
  if (mid == null || chatId == null) return;
  try {
    await ctx.telegram.deleteMessage(chatId, mid);
  } catch (_) {}
  delete td.bk_pending_user_message_id;
}

/**
 * Single-active-UI: har yangi qadamda avvalgi bot UI xabarlari o‘chadi.
 * Natija: chatda faqat joriy bosqich tugmalari qoladi.
 */
export async function bkSendStepMessage(ctx, client, uid, profileOrNull, send) {
  const chatId = ctx.chat?.id;
  const profile = profileOrNull || (await ensureProfile(client, uid));
  const td = { ...(profile.session_data || {}) };
  await flushBkPendingUserMessage(ctx, td, chatId);
  const prev = [...(td.bk_ui_message_ids || [])];
  if (chatId && prev.length) {
    await telegramDeleteMany(ctx, chatId, prev);
  }
  td.bk_ui_message_ids = [];
  const nextProfile = await updateProfile(client, uid, { session_data: td });
  const sent = await send();
  const ids = bkCollectMessageIds(sent);
  const finalTd = { ...(nextProfile.session_data || {}) };
  finalTd.bk_ui_message_ids = ids;
  await updateProfile(client, uid, { session_data: finalTd });
  return sent;
}

/** /start dan oldin saqlangan active UI xabarlarini tozalaydi. */
export async function bkClearStepUi(ctx, client, uid, profileOrNull) {
  const chatId = ctx.chat?.id;
  const profile = profileOrNull || (await ensureProfile(client, uid));
  const td = { ...(profile.session_data || {}) };
  await flushBkPendingUserMessage(ctx, td, chatId);
  const prev = [...(td.bk_ui_message_ids || [])];
  if (chatId && prev.length) {
    await telegramDeleteMany(ctx, chatId, prev);
  }
  td.bk_ui_message_ids = [];
  await updateProfile(client, uid, { session_data: td });
}

export async function sendBkPlaceholderStep(ctx, client, uid, profile, key, caption, extra = {}) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const p = resolvePlaceholderPath(key);
    if (p && fs.existsSync(p)) {
      return await ctx.replyWithPhoto({ source: p }, { caption, ...extra });
    }
    return await ctx.reply(caption, extra);
  });
}

export async function bkReplyStep(ctx, client, uid, profile, text, extra = {}) {
  return bkSendStepMessage(ctx, client, uid, profile, () => ctx.reply(text, extra));
}

export async function sendBkAskPhonePrompt(ctx, client, uid, profile, lg) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const { text, parse_mode } = buildAskPhoneHtml(lg);
    const kb = phoneStepReply(lg);
    const p = resolvePlaceholderPath("phone");
    const hasPhoto = p && fs.existsSync(p);
    if (hasPhoto) {
      return await ctx.replyWithPhoto(
        { source: p },
        { caption: text, parse_mode: parse_mode || undefined, ...kb }
      );
    }
    const ex = { ...kb };
    if (parse_mode) ex.parse_mode = parse_mode;
    return await ctx.reply(text, ex);
  });
}

export async function replyBkAskPhoneNoPhoto(ctx, client, uid, profile, lg) {
  return bkSendStepMessage(ctx, client, uid, profile, async () => {
    const { text, parse_mode } = buildAskPhoneHtml(lg);
    const kb = phoneStepReply(lg);
    const extra = { ...kb };
    if (parse_mode) extra.parse_mode = parse_mode;
    return await ctx.reply(text, extra);
  });
}

/**
 * Oldingi «hujjat yuboring» xabari o‘chadi, preview + «Продолжить» keladi.
 * User yuborgan asl media «Продолжить» bosilguncha chatda qoladi; keyingi qadamda o‘chadi (bkSendStepMessage).
 */
export async function replyBkDocUploadedEcho(ctx, client, uid, profile, lg, msg, caption, markup) {
  const userMid = msg?.message_id;
  const sent = await bkSendStepMessage(ctx, client, uid, profile, async () => {
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
  profile = await ensureProfile(client, uid);
  const td = { ...(profile.session_data || {}) };
  if (userMid != null) td.bk_pending_user_message_id = userMid;
  else delete td.bk_pending_user_message_id;
  await updateProfile(client, uid, { session_data: td });
  return sent;
}

export async function sendBkReviewMessage(ctx, client, uid, profile) {
  const lg = normalizeBKLang(profile?.language);
  const summary = buildBkSummaryI18n(lg, profile);
  return bkSendStepMessage(ctx, client, uid, profile, () =>
    ctx.reply(`${summary}\n\n${tBK(lg, "review_hint")}`, reviewKb(lg, profile))
  );
}
