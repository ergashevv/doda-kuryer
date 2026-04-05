import { getPool } from "../db.js";

export async function logChat(client, telegramUserId, role, text = null, extra = null) {
  await client.query(
    `INSERT INTO chat_messages (telegram_user_id, role, text, extra)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [telegramUserId, role, text, extra ?? null]
  );
}

/** Transaksiya tashqarisida (masalan /start dan keyin tez javobdan so‘ng) jurnalga yozish. */
export function logChatDeferred(telegramUserId, role, text = null, extra = null) {
  const pool = getPool();
  return pool
    .query(
      `INSERT INTO chat_messages (telegram_user_id, role, text, extra)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [telegramUserId, role, text, extra ?? null]
    )
    .catch((e) =>
      console.warn("[chatLog] deferred insert failed:", e?.message || e)
    );
}
