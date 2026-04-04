/**
 * BK «bitta qadam xabari» mantiqining simulyatsiyasi.
 * Telegram/DBsiz — qo‘lda tekshiriladigan ssenariylarning avtomatlashtirilgani.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

function bkCollectMessageIds(sent) {
  if (sent == null) return [];
  if (Array.isArray(sent)) return sent.map((m) => m?.message_id).filter((id) => id != null);
  return [sent.message_id].filter((id) => id != null);
}

/** handlers.js dagi bkSendStepMessage bilan bir xil ketma-ketlik (mock). */
async function simulateBkSendStepMessage(profile, send) {
  let sessionData = { ...(profile.session_data || {}) };
  const prev = [...(sessionData.bk_ui_message_ids || [])];
  const wouldDelete = [...prev];
  sessionData.bk_ui_message_ids = [];
  const sent = await send();
  const ids = bkCollectMessageIds(sent);
  sessionData.bk_ui_message_ids = ids;
  return { wouldDelete, sessionData };
}

describe("BK step UI (Telegramsiz simulyatsiya — qo‘lda ssenariylar)", () => {
  test("1-qadam: eski ID yo‘q, yangi bitta xabar saqlanadi", async () => {
    const p0 = { session_data: { bk: {} } };
    const r = await simulateBkSendStepMessage(p0, async () => ({ message_id: 100 }));
    assert.deepEqual(r.wouldDelete, []);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [100]);
  });

  test("2-qadam: avvalgi xabar ID delete ro‘yxatida, yangi ID yoziladi", async () => {
    const p1 = { session_data: { bk: {}, bk_ui_message_ids: [100] } };
    const r = await simulateBkSendStepMessage(p1, async () => ({ message_id: 200 }));
    assert.deepEqual(r.wouldDelete, [100]);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [200]);
  });

  test("telefon: ikki xabar (foto + nudge) — ikkalasi ham keyingi qadamda o‘chiriladi", async () => {
    const p = { session_data: { bk: {}, bk_ui_message_ids: [1, 2] } };
    const r = await simulateBkSendStepMessage(p, async () => ({ message_id: 50 }));
    assert.deepEqual(r.wouldDelete, [1, 2]);
    assert.deepEqual(r.sessionData.bk_ui_message_ids, [50]);
  });

  test("bkCollectMessageIds: massiv va null", () => {
    assert.deepEqual(bkCollectMessageIds([{ message_id: 1 }, { message_id: 2 }]), [1, 2]);
    assert.deepEqual(bkCollectMessageIds({ message_id: 7 }), [7]);
    assert.deepEqual(bkCollectMessageIds(null), []);
  });
});
