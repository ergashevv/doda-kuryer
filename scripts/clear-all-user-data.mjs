#!/usr/bin/env node
/**
 * Barcha foydalanuvchi profillari, chat log va yuklangan fayllar yozuvlarini o‘chiradi.
 * Ishlatish: DATABASE_URL bilan `node scripts/clear-all-user-data.mjs`
 */
import "dotenv/config";
import pg from "pg";

const url = (process.env.DATABASE_URL || "").trim();
if (!url) {
  console.error("DATABASE_URL is required");
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
