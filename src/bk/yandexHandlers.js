import { Markup } from "telegraf";
import { logChat } from "../services/chatLog.js";
import { downloadTelegramFile } from "../services/storage.js";
import { ensureProfile, updateProfile } from "../services/users.js";
import { isAllowedDocumentMime } from "./media.js";
import { normalizeRussianPhone } from "./phone.js";
import { categoryInline, editOnly, mainMenuReply } from "./keyboards.js";
import { normalizeBKLang, tBK, tBkTmVisaLine } from "./i18n.js";
import {
  YX_EATS,
  YX_LAVKA,
  buildYxLine,
  getYandexUiState,
  initYandexSession,
  clearYandexCollected,
  clearYandexStagingSessionFields,
  yxExtractFile,
  yxForbiddenMedia,
  validateYxText,
} from "./yandexFlow.js";
import {
  bkCollectMessageIds,
  bkSendStepMessage,
  flushBkPendingUserMessage,
  sendBkPlaceholderStep,
} from "./stepUi.js";

function lgOf(profile) {
  return normalizeBKLang(profile?.language);
}

/**
 * Pastki reply-klaviaturani yashiradi (asosiy menyu Yandex qadamlarida inline bilan chalkashmasin).
 * Logda ko‘rinadigan 409 Conflict ko‘pincha ikki+ polling instance; UI ham yordam beradi.
 */
export function yxReplyOptions(markupFromTelegraf) {
  const ik = markupFromTelegraf?.reply_markup?.inline_keyboard;
  return {
    reply_markup: {
      remove_keyboard: true,
      ...(ik ? { inline_keyboard: ik } : {}),
    },
  };
}

export function yxReplyOptionsTextOnly() {
  return { reply_markup: { remove_keyboard: true } };
}

export function servicePickInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "yx_btn_doda"), "bk_S:doda")],
    [
      Markup.button.callback(tBK(lg, "yx_btn_lavka"), "bk_S:lavka"),
      Markup.button.callback(tBK(lg, "yx_btn_eats"), "bk_S:eats"),
    ],
  ]);
}

export function yxCityInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "yx_city_msk"), "bk_YX:city:msk"),
      Markup.button.callback(tBK(lg, "yx_city_spb"), "bk_YX:city:spb"),
    ],
  ]);
}

export function yxCitizenInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "yx_cit_uz"), "bk_YX:cit:uz"),
      Markup.button.callback(tBK(lg, "yx_cit_tj"), "bk_YX:cit:tj"),
    ],
    [
      Markup.button.callback(tBK(lg, "yx_cit_kz"), "bk_YX:cit:kz"),
      Markup.button.callback(tBK(lg, "yx_cit_kg"), "bk_YX:cit:kg"),
    ],
    [
      Markup.button.callback(tBK(lg, "yx_cit_rf"), "bk_YX:cit:rf"),
      Markup.button.callback(tBK(lg, "yx_cit_tm"), "bk_YX:cit:tm"),
    ],
    [Markup.button.callback(tBK(lg, "yx_cit_other"), "bk_YX:cit:other")],
  ]);
}

export function yxUzDocInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "yx_doc_patent"), "bk_YX:uz:patent")],
    [Markup.button.callback(tBK(lg, "yx_doc_vnzh"), "bk_YX:uz:vnzh")],
    [Markup.button.callback(tBK(lg, "yx_doc_student"), "bk_YX:uz:student")],
  ]);
}

export function yxKzDocInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "yx_kz_pass"), "bk_YX:kz:pass")],
    [Markup.button.callback(tBK(lg, "yx_kz_id"), "bk_YX:kz:id")],
  ]);
}

/** Viza turi — TZ: pasportdan keyin (callback `tmkind`, `completed_yx` saqlanadi). TM uchun matnlar turkmen tilida. */
export function yxTmVisaKindInline(lang, isTmCitizen) {
  const lg = normalizeBKLang(lang);
  const tm = !!isTmCitizen;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        tBkTmVisaLine(tm, lg, "yx_tm_work"),
        "bk_YX:tmkind:work"
      ),
    ],
    [
      Markup.button.callback(
        tBkTmVisaLine(tm, lg, "yx_tm_tourism"),
        "bk_YX:tmkind:tourism"
      ),
    ],
  ]);
}

export function yxRamInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tBK(lg, "yx_ram_reg"), "bk_YX:ram:reg"),
      Markup.button.callback(tBK(lg, "yx_ram_amina"), "bk_YX:ram:amina"),
    ],
  ]);
}

export async function deleteYxUploads(client, uid) {
  await client.query(
    `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type LIKE 'yx_%'`,
    [uid]
  );
}

function yxStagedMarkup(lg) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "btn_continue"), "bk_YX:cont")],
    [Markup.button.callback(tBK(lg, "edit_btn"), "bk_E:yx")],
  ]);
}

/** Faqat foto / video / PDF qadamlari: eski so‘rov va preview xabarlarini o‘chirib, yangi so‘rov yuboradi. */
async function yxSendFileStepPrompt(ctx, client, uid, profile, caption, lg) {
  const chatId = ctx.chat?.id;
  let td = { ...(profile.session_data || {}) };
  const toDel = [...(td.yx_prompt_msg_ids || []), ...(td.yx_preview_msg_ids || [])];
  if (chatId && toDel.length) {
    for (const mid of toDel) {
      try {
        await ctx.telegram.deleteMessage(chatId, mid);
      } catch (_) {}
    }
  }
  td.yx_prompt_msg_ids = [];
  td.yx_preview_msg_ids = [];
  await updateProfile(client, uid, { session_data: td });
  profile = await ensureProfile(client, uid);
  const sent = await ctx.reply(caption, yxReplyOptions(editOnly(lg, "bk_E:yx")));
  const ids = bkCollectMessageIds(sent);
  await updateProfile(client, uid, { session_data_patch: { yx_prompt_msg_ids: ids } });
}

async function replyYxStagedPreview(ctx, client, uid, profile, msg, step, lg) {
  const caption = tBK(lg, "yx_confirm_doc_preview");
  const extra = yxReplyOptions(yxStagedMarkup(lg));
  let sent;
  if (step.t === "video" && msg.video) {
    sent = await ctx.replyWithVideo(msg.video.file_id, { caption, ...extra });
  } else if (msg.photo?.length) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    sent = await ctx.replyWithPhoto(fileId, { caption, ...extra });
  } else if (msg.document) {
    sent = await ctx.replyWithDocument(msg.document.file_id, { caption, ...extra });
  } else {
    sent = await ctx.reply(caption, extra);
  }
  const ids = bkCollectMessageIds(sent);
  const td = { ...(profile.session_data || {}) };
  td.yx_preview_msg_ids = ids;
  if (msg?.message_id != null) td.bk_pending_user_message_id = msg.message_id;
  await updateProfile(client, uid, { session_data: td });
}

export async function promptYandexStep(ctx, client, uid, profile) {
  const lg = lgOf(profile);
  const td = { ...(profile.session_data || {}) };
  const yx = td.yx || {};
  const done = (td.completed_yx || []).length;
  const st = getYandexUiState(yx, done, td);
  if (st.ui === "staged") return;

  if (st.ui === "city") {
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(tBK(lg, "yx_ask_city"), yxReplyOptions(yxCityInline(lg)))
    );
    return;
  }
  if (st.ui === "citizen") {
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(tBK(lg, "yx_ask_citizen"), yxReplyOptions(yxCitizenInline(lg)))
    );
    return;
  }
  if (st.ui === "uz_doc") {
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(tBK(lg, "yx_ask_uz_doc"), yxReplyOptions(yxUzDocInline(lg)))
    );
    return;
  }
  if (st.ui === "kz_doc") {
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(tBK(lg, "yx_ask_kz_doc"), yxReplyOptions(yxKzDocInline(lg)))
    );
    return;
  }
  if (st.ui === "done") {
    const summary = buildYxReviewSummary(lg, profile);
    await updateProfile(client, uid, { session_state: "bk_yx_review" });
    profile = await ensureProfile(client, uid);
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(
        `${summary}\n\n${tBK(lg, "yx_review_hint")}`,
        yxReplyOptions(
          Markup.inlineKeyboard([
            [Markup.button.callback(tBK(lg, "submit_btn"), "bk_YR:send")],
          ])
        )
      )
    );
    return;
  }
  if (st.ui === "step" && st.step.t === "choice") {
    const tmCit = yx.citizen === "tm";
    const cap = tBkTmVisaLine(tmCit, lg, st.step.promptKey);
    const kb =
      st.step.choiceId === "visa_kind"
        ? yxTmVisaKindInline(lg, tmCit)
        : yxRamInline(lg);
    await bkSendStepMessage(ctx, client, uid, profile, () =>
      ctx.reply(cap, yxReplyOptions(kb))
    );
    return;
  }
  if (st.ui === "step") {
    const step = st.step;
    const tmCit = yx.citizen === "tm";
    const cap =
      step.t === "photo" || step.t === "video" || step.t === "doc"
        ? tBkTmVisaLine(tmCit, lg, step.promptKey)
        : tBK(lg, step.promptKey);
    if (step.t === "photo" || step.t === "video" || step.t === "doc") {
      await yxSendFileStepPrompt(ctx, client, uid, profile, cap, lg);
    } else {
      await bkSendStepMessage(ctx, client, uid, profile, () =>
        ctx.reply(cap, yxReplyOptions(editOnly(lg, "bk_E:yx")))
      );
    }
  }
}

function yxCitizenLabel(lg, code) {
  const m = {
    uz: "yx_cit_uz",
    tj: "yx_cit_tj",
    kz: "yx_cit_kz",
    kg: "yx_cit_kg",
    uz_tj: "yx_cit_uz_tj",
    kz_kg: "yx_cit_kz_kg",
    rf: "yx_cit_rf",
    tm: "yx_cit_tm",
    other: "yx_cit_other",
  };
  const k = m[code];
  return k ? tBK(lg, k) : code || "—";
}

function buildYxReviewSummary(lg, profile) {
  const yx = profile.session_data?.yx || {};
  const coll = profile.session_data?.collected || {};
  const lines = [
    tBK(lg, "yx_rev_title"),
    `${tBK(lg, "yx_rev_service")}: ${yx.service === YX_LAVKA ? tBK(lg, "yx_btn_lavka") : tBK(lg, "yx_btn_eats")}`,
    `${tBK(lg, "yx_rev_city")}: ${tBK(lg, yx.cityKey === "msk" ? "yx_city_msk" : "yx_city_spb")}`,
    `${tBK(lg, "yx_rev_citizen")}: ${yxCitizenLabel(lg, yx.citizen)}`,
  ];
  if (yx.uzDocKind) {
    lines.push(
      `${tBK(lg, "yx_rev_uzdoc")}: ${tBK(lg, `yx_doc_${yx.uzDocKind}`)}`
    );
  }
  if (yx.kzDocKind) {
    lines.push(
      `${tBK(lg, "yx_rev_kzdoc")}: ${tBK(lg, yx.kzDocKind === "pass" ? "yx_kz_pass" : "yx_kz_id")}`
    );
  }
  if (yx.tmVisaKind) {
    const workish = yx.tmVisaKind === "work" || yx.tmVisaKind === "study";
    lines.push(
      `${tBK(lg, "yx_rev_tmvisa")}: ${tBK(lg, workish ? "yx_tm_work" : "yx_tm_tourism")}`
    );
  }
  for (const [k, v] of Object.entries(coll)) {
    if (k.startsWith("yx_col_") && v) {
      const lk = `yx_lbl_${k}`;
      const lbl = tBK(lg, lk);
      const label = lbl === lk ? k : lbl;
      lines.push(`${label}: ${v}`);
    }
  }
  const comp = profile.session_data?.completed_yx || [];
  lines.push(`${tBK(lg, "yx_rev_files")}: ${comp.length}`);
  return lines.join("\n");
}

export async function handleYandexMessage(ctx, client, uid, profile, msg) {
  if (profile.session_state !== "bk_yx") return false;
  const lg = lgOf(profile);
  const td = { ...(profile.session_data || {}) };
  const yx = { ...(td.yx || {}) };
  let completed = [...(td.completed_yx || [])];
  const st = getYandexUiState(yx, completed.length, td);

  if (st.ui === "staged") {
    await ctx.reply(tBK(lg, "yx_press_continue_first"), yxReplyOptionsTextOnly());
    return true;
  }

  if (st.ui !== "step" || st.step.t === "choice") {
    await ctx.reply(tBK(lg, "yx_use_buttons"), yxReplyOptionsTextOnly());
    return true;
  }

  const step = st.step;

  if (
    step.t !== "text" &&
    (msg.text != null && String(msg.text).trim() !== "") &&
    !msg.photo &&
    !msg.document &&
    !msg.video
  ) {
    await ctx.reply(tBK(lg, "err_doc_need_photo"), yxReplyOptionsTextOnly());
    return true;
  }

  if (step.t === "text") {
    const text = (msg.text || "").trim();
    if (msg.photo || msg.document) {
      await ctx.reply(tBK(lg, "yx_need_text"), yxReplyOptionsTextOnly());
      return true;
    }
    const v = validateYxText(step, text);
    if (!v) {
      await ctx.reply(tBK(lg, "yx_bad_text"), yxReplyOptionsTextOnly());
      return true;
    }
    let phoneNorm = v;
    if (step.mode === "phone") {
      const p = normalizeRussianPhone(msg);
      if (!p) {
        await ctx.reply(tBK(lg, "err_phone_invalid"), yxReplyOptionsTextOnly());
        return true;
      }
      phoneNorm = p;
    }
    const coll = { ...(td.collected || {}) };
    coll[step.colKey] = phoneNorm;
    const marker = `__text__:${step.colKey}`;
    completed = completed.filter((x) => x !== marker);
    completed.push(marker);
    await updateProfile(client, uid, {
      session_data: { ...td, yx, collected: coll, completed_yx: completed },
    });
    await logChat(client, uid, "user", `yx:text:${step.colKey}`);
    const p2 = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, p2);
    return true;
  }

  if (yxForbiddenMedia(msg, step)) {
    await ctx.reply(tBK(lg, "err_wrong_media_type"), yxReplyOptionsTextOnly());
    return true;
  }

  const ex = yxExtractFile(msg, step);
  if (!ex) {
    await ctx.reply(
      step.t === "video" ? tBK(lg, "yx_need_video") : tBK(lg, "err_doc_need_photo"),
      yxReplyOptionsTextOnly()
    );
    return true;
  }
  if (msg.document && !isAllowedDocumentMime(msg.document.mime_type)) {
    await ctx.reply(tBK(lg, "err_doc_mime"), yxReplyOptionsTextOnly());
    return true;
  }

  await client.query(
    `DELETE FROM uploaded_files WHERE telegram_user_id = $1 AND doc_type = $2`,
    [uid, step.docType]
  );
  completed = completed.filter((d) => d !== step.docType);

  const path = await downloadTelegramFile(
    ctx.telegram,
    ex.fileId,
    uid,
    step.docType,
    ex.mime
  );
  await client.query(
    `INSERT INTO uploaded_files (telegram_user_id, doc_type, telegram_file_id, local_path)
     VALUES ($1, $2, $3, $4)`,
    [uid, step.docType, ex.fileId, path]
  );

  const chatId = ctx.chat?.id;
  const promptIds = [...(td.yx_prompt_msg_ids || [])];
  if (chatId && promptIds.length) {
    for (const mid of promptIds) {
      try {
        await ctx.telegram.deleteMessage(chatId, mid);
      } catch (_) {}
    }
  }

  const nextTd = { ...td, yx, completed_yx: completed };
  nextTd.yx_prompt_msg_ids = [];
  nextTd.yx_staged_doc = step.docType;
  if (msg?.message_id != null) nextTd.bk_pending_user_message_id = msg.message_id;
  else delete nextTd.bk_pending_user_message_id;
  await updateProfile(client, uid, { session_data: nextTd });
  await logChat(client, uid, "user", `yx:file:${step.docType}`);
  const p2 = await ensureProfile(client, uid);
  await replyYxStagedPreview(ctx, client, uid, p2, msg, step, lg);
  return true;
}

export async function handleYandexCallback(ctx, client, uid, data) {
  if (data.startsWith("bk_S:")) {
    const svc = data.slice(5);
    let profile = await ensureProfile(client, uid);
    const lg = lgOf(profile);
    if (profile.session_state !== "bk_service") {
      await ctx.reply(tBK(lg, "review_callback_stale"));
      return true;
    }
    if (svc === "doda") {
      await deleteYxUploads(client, uid);
      let td = { ...(profile.session_data || {}) };
      delete td.yx;
      td.completed_yx = [];
      td.collected = clearYandexCollected(td);
      td = clearYandexStagingSessionFields(td);
      await updateProfile(client, uid, {
        session_data: { ...td, bk: td.bk || {} },
        session_state: "bk_category",
        service: null,
        tariff: null,
      });
      profile = await ensureProfile(client, uid);
      await sendBkPlaceholderStep(
        ctx,
        client,
        uid,
        profile,
        "category",
        tBK(lg, "ask_category"),
        yxReplyOptions(categoryInline(lg))
      );
      return true;
    }
    if (svc === "lavka" || svc === "eats") {
      await deleteYxUploads(client, uid);
      const sk = svc === "lavka" ? YX_LAVKA : YX_EATS;
      const base = {
        ...(profile.session_data || {}),
        bk: profile.session_data?.bk || {},
      };
      const td = initYandexSession(base, sk);
      await updateProfile(client, uid, {
        session_data: td,
        session_state: "bk_yx",
        service: sk,
        tariff: "foot_bike",
      });
      profile = await ensureProfile(client, uid);
      await promptYandexStep(ctx, client, uid, profile);
      return true;
    }
    return false;
  }

  if (!data.startsWith("bk_YX:") && !data.startsWith("bk_YR:")) return false;

  // bk_YR:send — DB commit va Telegram alohida (handlers.js); bu yerda emas.

  if (!data.startsWith("bk_YX:")) return false;

  const payload = data.slice("bk_YX:".length);
  let profile = await ensureProfile(client, uid);
  const lg = lgOf(profile);
  if (profile.session_state !== "bk_yx") {
    await ctx.reply(tBK(lg, "review_callback_stale"));
    return true;
  }
  const td = { ...(profile.session_data || {}) };
  const yx = { ...(td.yx || {}) };
  const completed = [...(td.completed_yx || [])];

  if (payload === "cont") {
    const staged = td.yx_staged_doc;
    if (!staged) {
      await ctx.reply(tBK(lg, "review_callback_stale"));
      return true;
    }
    const line = buildYxLine(yx);
    const expected = line[completed.length];
    if (
      !expected ||
      expected.docType !== staged ||
      (expected.t !== "photo" && expected.t !== "video" && expected.t !== "doc")
    ) {
      await ctx.reply(tBK(lg, "review_callback_stale"));
      return true;
    }
    const chatId = ctx.chat?.id;
    await flushBkPendingUserMessage(ctx, td, chatId);
    const prev = [...(td.yx_preview_msg_ids || [])];
    if (chatId && prev.length) {
      for (const mid of prev) {
        try {
          await ctx.telegram.deleteMessage(chatId, mid);
        } catch (_) {}
      }
    }
    const nextCompleted = [...completed, staged];
    const nextTd = clearYandexStagingSessionFields({ ...td, yx, completed_yx: nextCompleted });
    await updateProfile(client, uid, { session_data: nextTd });
    await logChat(client, uid, "user", `yx:cont:${staged}`);
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }

  if (payload.startsWith("city:")) {
    yx.cityKey = payload.endsWith("msk") ? "msk" : "spb";
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: clearYandexStagingSessionFields({ ...td, yx, completed_yx: [] }),
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("cit:")) {
    const c = payload.slice(4);
    const allowed = new Set([
      "uz",
      "tj",
      "kz",
      "kg",
      "rf",
      "tm",
      "other",
      "uz_tj",
      "kz_kg",
    ]);
    if (!allowed.has(c)) return false;
    yx.citizen = c;
    yx.uzDocKind = null;
    yx.kzDocKind = null;
    yx.tmVisaKind = null;
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: clearYandexStagingSessionFields({ ...td, yx, completed_yx: [] }),
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("uz:")) {
    yx.uzDocKind = payload.slice(3);
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: clearYandexStagingSessionFields({ ...td, yx, completed_yx: [] }),
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("kz:")) {
    yx.kzDocKind = payload.slice(3) === "pass" ? "pass" : "id";
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: clearYandexStagingSessionFields({ ...td, yx, completed_yx: [] }),
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("tmkind:")) {
    const raw = payload.slice(7);
    if (raw === "tourism") {
      const tmCit = yx.citizen === "tm";
      const blocked = tBkTmVisaLine(tmCit, lg, "yx_tm_tourism_blocked");
      await bkSendStepMessage(ctx, client, uid, profile, () =>
        ctx.reply(blocked, yxReplyOptions(yxTmVisaKindInline(lg, tmCit)))
      );
      return true;
    }
    if (raw === "work" || raw === "study") {
      yx.tmVisaKind = "work";
      yx.regAmina = null;
      await updateProfile(client, uid, {
        session_data: { ...td, yx, completed_yx: completed },
      });
      profile = await ensureProfile(client, uid);
      await promptYandexStep(ctx, client, uid, profile);
      return true;
    }
    return false;
  }
  if (payload === "ram:reg" || payload === "ram:amina") {
    yx.regAmina = payload === "ram:reg" ? "reg" : "amina";
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: completed },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }

  return false;
}
