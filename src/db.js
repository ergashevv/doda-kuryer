import { URL } from "node:url";
import pg from "pg";

const { Pool } = pg;

let pool = null;

function requireDatabaseHost(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }
  const host = (parsed.hostname || "").trim();
  if (!host) {
    throw new Error(
      "DATABASE_URL must include a host (e.g. postgresql://user:pass@hostname:5432/dbname). " +
        "On Railway, copy the URL from the Postgres service (Variables or Connect), " +
        "or reference it from the bot service as ${{ Postgres.DATABASE_URL }}."
    );
  }
}

function poolOptions(connectionString) {
  const opts = { connectionString };
  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    connectionString.includes("neon.tech") ||
    process.env.DATABASE_SSL === "1" ||
    process.env.DATABASE_SSL === "true";
  if (needsSsl) {
    opts.ssl = { rejectUnauthorized: true };
  }
  return opts;
}

export function getPool() {
  if (pool) return pool;
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  requireDatabaseHost(url);
  pool = new Pool(poolOptions(url));
  return pool;
}

function findEnotfound(err) {
  let e = err;
  const seen = new Set();
  while (e && !seen.has(e)) {
    seen.add(e);
    if (e.code === "ENOTFOUND") return e;
    e = e.cause;
  }
  return null;
}

export async function withTransaction(fn) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS user_profiles (
  telegram_id BIGINT PRIMARY KEY,
  language VARCHAR(8) NOT NULL DEFAULT 'uz',
  service VARCHAR(32),
  tariff VARCHAR(32),
  city TEXT,
  session_state VARCHAR(64) NOT NULL DEFAULT 'language',
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL REFERENCES user_profiles (telegram_id),
  role VARCHAR(16) NOT NULL,
  text TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_chat_messages_telegram_user_id ON chat_messages (telegram_user_id);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL REFERENCES user_profiles (telegram_id),
  doc_type VARCHAR(64) NOT NULL,
  telegram_file_id VARCHAR(255) NOT NULL,
  local_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_uploaded_files_telegram_user_id ON uploaded_files (telegram_user_id);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
`;

export async function initDb() {
  const p = getPool();
  try {
    await p.query(INIT_SQL);
  } catch (e) {
    const dns = findEnotfound(e);
    if (dns) {
      const wrapped = new Error(
        "Cannot resolve the database host from DATABASE_URL (DNS error). " +
          "On Railway: add the Postgres plugin, then in your bot service set DATABASE_URL " +
          "to the Postgres connection string (Connect tab), or use a reference variable " +
          "so the hostname is the real Railway Postgres host — not 'postgres', 'localhost', " +
          "or a placeholder from docker-compose."
      );
      wrapped.cause = dns;
      throw wrapped;
    }
    throw e;
  }
}
