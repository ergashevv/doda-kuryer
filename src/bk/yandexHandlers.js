import { Markup } from "telegraf";
import { logChat } from "../services/chatLog.js";
import { notifyGroupYandexSubmission } from "../services/groupInbox.js";
import { downloadTelegramFile } from "../services/storage.js";
import { ensureProfile, updateProfile } from "../services/users.js";
import { isAllowedDocumentMime } from "./media.js";
import { normalizeRussianPhone } from "./phone.js";
import { categoryInline, editOnly, mainMenuReply } from "./keyboards.js";
import { normalizeBKLang, tBK } from "./i18n.js";
import {
  YX_EATS,
  YX_LAVKA,
  getYandexUiState,
  initYandexSession,
  clearYandexCollected,
  yxExtractFile,
  yxForbiddenMedia,
  validateYxText,
} from "./yandexFlow.js";

function lgOf(profile) {
  return normalizeBKLang(profile?.language);
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
    [Markup.button.callback(tBK(lg, "yx_cit_uz_tj"), "bk_YX:cit:uz_tj")],
    [Markup.button.callback(tBK(lg, "yx_cit_kz_kg"), "bk_YX:cit:kz_kg")],
    [
      Markup.button.callback(tBK(lg, "yx_cit_rf"), "bk_YX:cit:rf"),
      Markup.button.callback(tBK(lg, "yx_cit_tm"), "bk_YX:cit:tm"),
    ],
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

export function yxTmVisaInline(lang) {
  const lg = normalizeBKLang(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(tBK(lg, "yx_tm_work"), "bk_YX:tm:work")],
    [Markup.button.callback(tBK(lg, "yx_tm_study"), "bk_YX:tm:study")],
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

export async function promptYandexStep(ctx, client, uid, profile) {
  const lg = lgOf(profile);
  const td = { ...(profile.session_data || {}) };
  const yx = td.yx || {};
  const done = (td.completed_yx || []).length;
  const st = getYandexUiState(yx, done);

  if (st.ui === "city") {
    await ctx.reply(tBK(lg, "yx_ask_city"), yxCityInline(lg));
    return;
  }
  if (st.ui === "citizen") {
    await ctx.reply(tBK(lg, "yx_ask_citizen"), yxCitizenInline(lg));
    return;
  }
  if (st.ui === "uz_doc") {
    await ctx.reply(tBK(lg, "yx_ask_uz_doc"), yxUzDocInline(lg));
    return;
  }
  if (st.ui === "kz_doc") {
    await ctx.reply(tBK(lg, "yx_ask_kz_doc"), yxKzDocInline(lg));
    return;
  }
  if (st.ui === "tm_visa") {
    await ctx.reply(tBK(lg, "yx_ask_tm_visa"), yxTmVisaInline(lg));
    return;
  }
  if (st.ui === "done") {
    const summary = buildYxReviewSummary(lg, profile);
    await updateProfile(client, uid, { session_state: "bk_yx_review" });
    await ctx.reply(
      `${summary}\n\n${tBK(lg, "yx_review_hint")}`,
      Markup.inlineKeyboard([
        [Markup.button.callback(tBK(lg, "submit_btn"), "bk_YR:send")],
      ])
    );
    return;
  }
  if (st.ui === "step" && st.step.t === "choice") {
    await ctx.reply(tBK(lg, st.step.promptKey), yxRamInline(lg));
    return;
  }
  if (st.ui === "step") {
    const step = st.step;
    const cap = tBK(lg, step.promptKey);
    if (step.t === "text") {
      await ctx.reply(cap, editOnly(lg, "bk_E:yx"));
      return;
    }
    await ctx.reply(cap, editOnly(lg, "bk_E:yx"));
  }
}

function yxCitizenLabel(lg, code) {
  const m = {
    uz_tj: "yx_cit_uz_tj",
    kz_kg: "yx_cit_kz_kg",
    rf: "yx_cit_rf",
    tm: "yx_cit_tm",
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
    lines.push(
      `${tBK(lg, "yx_rev_tmvisa")}: ${tBK(lg, yx.tmVisaKind === "work" ? "yx_tm_work" : "yx_tm_study")}`
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
  const st = getYandexUiState(yx, completed.length);

  if (st.ui !== "step" || st.step.t === "choice") {
    await ctx.reply(tBK(lg, "yx_use_buttons"));
    return true;
  }

  const step = st.step;

  if (step.t === "text") {
    const text = (msg.text || "").trim();
    if (msg.photo || msg.document) {
      await ctx.reply(tBK(lg, "yx_need_text"));
      return true;
    }
    const v = validateYxText(step, text);
    if (!v) {
      await ctx.reply(tBK(lg, "yx_bad_text"));
      return true;
    }
    let phoneNorm = v;
    if (step.mode === "phone") {
      const p = normalizeRussianPhone(msg);
      if (!p) {
        await ctx.reply(tBK(lg, "err_phone_invalid"));
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
    await ctx.reply(tBK(lg, "err_wrong_media_type"));
    return true;
  }

  const ex = yxExtractFile(msg, step);
  if (!ex) {
    await ctx.reply(
      step.t === "video" ? tBK(lg, "yx_need_video") : tBK(lg, "err_doc_need_photo")
    );
    return true;
  }
  if (msg.document && !isAllowedDocumentMime(msg.document.mime_type)) {
    await ctx.reply(tBK(lg, "err_doc_mime"));
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
  completed.push(step.docType);
  await updateProfile(client, uid, {
    session_data: { ...td, yx, completed_yx: completed },
  });
  await logChat(client, uid, "user", `yx:file:${step.docType}`);
  const p2 = await ensureProfile(client, uid);
  await ctx.reply(tBK(lg, "yx_file_ok"));
  await promptYandexStep(ctx, client, uid, p2);
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
      const td = { ...(profile.session_data || {}) };
      delete td.yx;
      td.completed_yx = [];
      td.collected = clearYandexCollected(td);
      await updateProfile(client, uid, {
        session_data: { ...td, bk: td.bk || {} },
        session_state: "bk_category",
        service: null,
        tariff: null,
      });
      await ctx.reply(tBK(lg, "ask_category"), categoryInline(lg));
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

  if (data === "bk_YR:send") {
    let profile = await ensureProfile(client, uid);
    if (profile.session_state !== "bk_yx_review") return true;
    const lg = lgOf(profile);
    await updateProfile(client, uid, { session_state: "done" });
    profile = await ensureProfile(client, uid);
    await notifyGroupYandexSubmission(ctx.telegram, profile);
    const tail = tBK(lg, "yx_final_thanks");
    await ctx.reply(tail, mainMenuReply(lg));
    await logChat(client, uid, "assistant", tail);
    return true;
  }

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

  if (payload.startsWith("city:")) {
    yx.cityKey = payload.endsWith("msk") ? "msk" : "spb";
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: [] },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("cit:")) {
    const c = payload.slice(4);
    yx.citizen = c;
    yx.uzDocKind = null;
    yx.kzDocKind = null;
    yx.tmVisaKind = null;
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: [] },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("uz:")) {
    yx.uzDocKind = payload.slice(3);
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: [] },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("kz:")) {
    yx.kzDocKind = payload.slice(3) === "pass" ? "pass" : "id";
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: [] },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("tm:")) {
    yx.tmVisaKind = payload.slice(3) === "work" ? "work" : "study";
    yx.regAmina = null;
    await updateProfile(client, uid, {
      session_data: { ...td, yx, completed_yx: [] },
    });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }
  if (payload.startsWith("ram:")) {
    yx.regAmina = payload.endsWith("reg") ? "reg" : "amina";
    await updateProfile(client, uid, { session_data: { ...td, yx, completed_yx } });
    profile = await ensureProfile(client, uid);
    await promptYandexStep(ctx, client, uid, profile);
    return true;
  }

  return false;
}
