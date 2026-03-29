export async function logChat(client, telegramUserId, role, text = null, extra = null) {
  await client.query(
    `INSERT INTO chat_messages (telegram_user_id, role, text, extra)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [telegramUserId, role, text, extra ?? null]
  );
}
