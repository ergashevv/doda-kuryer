/**
 * BK «bitta qadam xabari» mantiqining simulyatsiyasi.
 * Telegram/DBsiz — qo‘lda tekshiriladigan ssenariylarning avtomatlashtirilgani.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bkCollectMessageIds,
  isBkDocWizardSessionState,
  telegramDeleteMany,
} from "../src/bk/stepUi.js";

/** `bkSendStepMessage` mantiqining mocki (`bk_doc_*` da eski bot UI o‘chadi). */
async function simulateBkSendStepMessage(profile, send) {
  let sessionData = { ...(profile.session_data || {}) };
  const docWizard = isBkDocWizardSessionState(profile.session_state);
  const prev = [...(sessionData.bk_ui_message_ids || [])];
  const wouldDelete = docWizard ? [...prev] : [];
  sessionData.bk_ui_message_ids = [];
  const sent = await send();
  const ids = docWizard ? bkCollectMessageIds(sent) : [];
  sessionData.bk_ui_message_ids = ids;
  return { wouldDelete, sessionData };
}

describe("BK step UI (Telegramsiz simulyatsiya — qo‘lda ssenariylar)", () => {
  test("ro‘yxatdan o‘tish: bot ID lar saqlanmaydi, eski xabarlar o‘chirilmaydi", async () => {
    const p0 = { session_state: "bk_city", session_data: { bk: {}, bk_ui_message_ids: [99] } };
    const r = await simulateBkSendStepMessage(p0, async () => ({ message_id: 100 }));
    assert.deepEqual(r.wouldDelete, []);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, []);
  });

  test("hujjat oqimi: eski ID yo‘q, yangi bitta xabar saqlanadi", async () => {
    const p0 = { session_state: "bk_doc_license", session_data: { bk: {} } };
    const r = await simulateBkSendStepMessage(p0, async () => ({ message_id: 100 }));
    assert.deepEqual(r.wouldDelete, []);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [100]);
  });

  test("hujjat: avvalgi xabar ID delete ro‘yxatida, yangi ID yoziladi", async () => {
    const p1 = {
      session_state: "bk_doc_license",
      session_data: { bk: {}, bk_ui_message_ids: [100] },
    };
    const r = await simulateBkSendStepMessage(p1, async () => ({ message_id: 200 }));
    assert.deepEqual(r.wouldDelete, [100]);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [200]);
  });

  test("hujjat: ikki eski ID — ikkalasi ham keyingi qadamda o‘chiriladi", async () => {
    const p = {
      session_state: "bk_doc_passport",
      session_data: { bk: {}, bk_ui_message_ids: [1, 2] },
    };
    const r = await simulateBkSendStepMessage(p, async () => ({ message_id: 50 }));
    assert.deepEqual(r.wouldDelete, [1, 2]);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [50]);
  });

  test("bkCollectMessageIds: massiv va null", () => {
    assert.deepEqual(bkCollectMessageIds([{ message_id: 1 }, { message_id: 2 }]), [1, 2]);
    assert.deepEqual(bkCollectMessageIds({ message_id: 7 }), [7]);
    assert.deepEqual(bkCollectMessageIds(null), []);
  });

  test("telegramDeleteMany: barcha ID lar chaqiriladi", async () => {
    const calls = [];
    const ctx = {
      telegram: {
        deleteMessage: (_cid, mid) => {
          calls.push(mid);
          return Promise.resolve();
        },
      },
    };
    await telegramDeleteMany(ctx, 1, [10, 20, 30]);
    assert.deepEqual(calls.sort((a, b) => a - b), [10, 20, 30]);
  });
});
