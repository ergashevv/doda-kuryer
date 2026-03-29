export async function getProfile(client, telegramId) {
  const r = await client.query("SELECT * FROM user_profiles WHERE telegram_id = $1", [
    telegramId,
  ]);
  return r.rows[0] || null;
}

export async function ensureProfile(client, telegramId) {
  let p = await getProfile(client, telegramId);
  if (p) return p;
  await client.query(
    `INSERT INTO user_profiles (telegram_id, language, session_state, session_data)
     VALUES ($1, 'uz', 'language', '{}'::jsonb)`,
    [telegramId]
  );
  const r = await client.query("SELECT * FROM user_profiles WHERE telegram_id = $1", [
    telegramId,
  ]);
  return r.rows[0];
}

export async function resetRegistration(client, telegramId) {
  await ensureProfile(client, telegramId);
  const r = await client.query(
    `UPDATE user_profiles
     SET language = 'uz', service = NULL, tariff = NULL, city = NULL, phone = NULL,
         session_state = 'language', session_data = '{}'::jsonb, updated_at = NOW()
     WHERE telegram_id = $1
     RETURNING *`,
    [telegramId]
  );
  return r.rows[0];
}

/** Telegram profilidan ism / username (har safar yangilanadi). */
export async function syncTelegramInfo(client, telegramId, from) {
  if (!from) return;
  await ensureProfile(client, telegramId);
  await client.query(
    `UPDATE user_profiles
     SET first_name = $1, last_name = $2, username = $3, updated_at = NOW()
     WHERE telegram_id = $4`,
    [from.first_name || null, from.last_name || null, from.username || null, telegramId]
  );
}

export async function updateProfile(client, telegramId, fields) {
  const p = await ensureProfile(client, telegramId);
  const language = fields.language !== undefined ? fields.language : p.language;
  const service = fields.service !== undefined ? fields.service : p.service;
  const tariff = fields.tariff !== undefined ? fields.tariff : p.tariff;
  const city = fields.city !== undefined ? fields.city : p.city;
  const phone = fields.phone !== undefined ? fields.phone : p.phone;
  const firstName = fields.first_name !== undefined ? fields.first_name : p.first_name;
  const lastName = fields.last_name !== undefined ? fields.last_name : p.last_name;
  const username = fields.username !== undefined ? fields.username : p.username;
  const sessionState = fields.session_state !== undefined ? fields.session_state : p.session_state;
  let sessionData = p.session_data || {};
  if (fields.session_data_patch) {
    sessionData = { ...sessionData, ...fields.session_data_patch };
  }
  if (fields.session_data !== undefined) {
    sessionData = fields.session_data;
  }
  await client.query(
    `UPDATE user_profiles
     SET language = $1, service = $2, tariff = $3, city = $4, phone = $5,
         first_name = $6, last_name = $7, username = $8,
         session_state = $9, session_data = $10::jsonb, updated_at = NOW()
     WHERE telegram_id = $11`,
    [
      language,
      service,
      tariff,
      city,
      phone,
      firstName,
      lastName,
      username,
      sessionState,
      sessionData,
      telegramId,
    ]
  );
  return getProfile(client, telegramId);
}
