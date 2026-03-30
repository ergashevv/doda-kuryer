import { getPool } from "./db";

export type UserProfileRow = {
  telegram_id: string;
  language: string;
  service: string | null;
  tariff: string | null;
  city: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  session_state: string;
  session_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type UploadedFileRow = {
  id: string;
  telegram_user_id: string;
  doc_type: string;
  telegram_file_id: string;
  local_path: string;
  created_at: Date;
};

export type ChatMessageRow = {
  id: string;
  telegram_user_id: string;
  role: string;
  text: string | null;
  extra: Record<string, unknown> | null;
  created_at: Date;
};

function bigIntToString<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === "bigint") {
      (out as Record<string, unknown>)[k] = v.toString();
    }
  }
  return out;
}

export async function listUsers(limit = 200, offset = 0): Promise<UserProfileRow[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT telegram_id, language, service, tariff, city, phone,
            first_name, last_name, username,
            session_state, session_data, created_at, updated_at
     FROM user_profiles
     ORDER BY updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return r.rows.map((row) => bigIntToString(row) as UserProfileRow);
}

export async function getUserDetail(telegramId: string) {
  const pool = getPool();
  const id = BigInt(telegramId);
  const p = await pool.query(`SELECT * FROM user_profiles WHERE telegram_id = $1`, [id]);
  if (!p.rows[0]) return null;

  const files = await pool.query(
    `SELECT id, telegram_user_id, doc_type, telegram_file_id, local_path, created_at
     FROM uploaded_files
     WHERE telegram_user_id = $1
     ORDER BY id ASC`,
    [id]
  );

  const messages = await pool.query(
    `SELECT id, telegram_user_id, role, text, extra, created_at
     FROM chat_messages
     WHERE telegram_user_id = $1
     ORDER BY id ASC
     LIMIT 500`,
    [id]
  );

  return {
    profile: bigIntToString(p.rows[0]) as UserProfileRow & Record<string, unknown>,
    files: files.rows.map((row) => bigIntToString(row) as UploadedFileRow),
    messages: messages.rows.map((row) => bigIntToString(row) as ChatMessageRow),
  };
}

export async function getUploadedFileForUser(
  telegramId: string,
  fileId: string
): Promise<UploadedFileRow | null> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT id, telegram_user_id, doc_type, telegram_file_id, local_path, created_at
     FROM uploaded_files WHERE id = $1 AND telegram_user_id = $2`,
    [BigInt(fileId), BigInt(telegramId)]
  );
  if (!r.rows[0]) return null;
  return bigIntToString(r.rows[0]) as UploadedFileRow;
}
