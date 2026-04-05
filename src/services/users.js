import { normalizeBKLang } from "../bk/i18n.js";

export async function getProfile(client, telegramId) {
  const r = await client.query("SELECT * FROM user_profiles WHERE telegram_id = $1", [
    telegramId,
  ]);
  return r.rows[0] || null;
}

export async function ensureProfile(client, telegramId) {
  const r = await client.query(
    `INSERT INTO user_profiles (telegram_id, language, session_state, session_data)
     VALUES ($1, 'ru', 'bk_main', '{}'::jsonb)
     ON CONFLICT (telegram_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [telegramId]
  );
  return r.rows[0];
}

/** /start: profilni noldan til tanlash qadamiga (`bk_lang`) qaytaradi. */
export async function resetRegistration(client, telegramId) {
  await ensureProfile(client, telegramId);
  const r = await client.query(
    `UPDATE user_profiles
     SET language = 'ru', service = NULL, tariff = NULL, city = NULL, phone = NULL,
         session_state = 'bk_lang', session_data = '{"bk":{}}'::jsonb, updated_at = NOW()
     WHERE telegram_id = $1
     RETURNING *`,
    [telegramId]
  );
  return r.rows[0];
}

export async function syncTelegramInfo(client, telegramId, from) {
  if (!from) return null;
  const r = await client.query(
    `INSERT INTO user_profiles (telegram_id, language, session_state, session_data, first_name, last_name, username)
     VALUES ($1, 'ru', 'bk_main', '{}'::jsonb, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       username = EXCLUDED.username,
       updated_at = NOW()
     RETURNING *`,
    [telegramId, from.first_name || null, from.last_name || null, from.username || null]
  );
  return r.rows[0];
}

export async function updateProfile(client, telegramId, fields) {
  const p = await ensureProfile(client, telegramId);
  const language =
    fields.language !== undefined
      ? normalizeBKLang(fields.language)
      : normalizeBKLang(p.language);
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
  const r = await client.query(
    `UPDATE user_profiles
     SET language = $1, service = $2, tariff = $3, city = $4, phone = $5,
         first_name = $6, last_name = $7, username = $8,
         session_state = $9, session_data = $10::jsonb, updated_at = NOW()
     WHERE telegram_id = $11
     RETURNING *`,
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
  return r.rows[0];
}
