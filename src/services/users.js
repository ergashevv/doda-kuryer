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
     SET language = 'uz', service = NULL, tariff = NULL, city = NULL,
         session_state = 'language', session_data = '{}'::jsonb, updated_at = NOW()
     WHERE telegram_id = $1
     RETURNING *`,
    [telegramId]
  );
  return r.rows[0];
}

export async function updateProfile(client, telegramId, fields) {
  const p = await ensureProfile(client, telegramId);
  const language = fields.language !== undefined ? fields.language : p.language;
  const service = fields.service !== undefined ? fields.service : p.service;
  const tariff = fields.tariff !== undefined ? fields.tariff : p.tariff;
  const city = fields.city !== undefined ? fields.city : p.city;
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
     SET language = $1, service = $2, tariff = $3, city = $4,
         session_state = $5, session_data = $6::jsonb, updated_at = NOW()
     WHERE telegram_id = $7`,
    [language, service, tariff, city, sessionState, sessionData, telegramId]
  );
  return getProfile(client, telegramId);
}
