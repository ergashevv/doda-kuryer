#!/usr/bin/env node
/**
 * Barcha foydalanuvchi profillari, chat log va yuklangan fayllar yozuvlarini o‘chiradi.
 * DATABASE_URL: muhit o‘zgaruvchisi yoki loyiha ildizidagi `.env`, keyin `web/.env`.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const p of [resolve(root, ".env"), resolve(root, "web/.env")]) {
  if (!existsSync(p)) continue;
  dotenv.config({ path: p });
  if ((process.env.DATABASE_URL || "").trim()) break;
}

const url = (process.env.DATABASE_URL || "").trim();
if (!url) {
  console.error("DATABASE_URL topilmadi (.env yoki web/.env da qo‘ying).");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM uploaded_files");
    await client.query("DELETE FROM chat_messages");
    await client.query("DELETE FROM user_profiles");
    await client.query("COMMIT");
    console.log("OK: uploaded_files, chat_messages, user_profiles cleared.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
