import "dotenv/config";
import { Telegraf } from "telegraf";
import { initDb, getPool } from "./db.js";
import { ensureStorage } from "./services/storage.js";
import { registerHandlers } from "./handlers/registration.js";

const log = (...a) => console.log(new Date().toISOString(), ...a);

function requireEnv(name) {
  const v = (process.env[name] || "").trim();
  if (!v) {
    console.error(`${name} is not set`);
    process.exit(1);
  }
  return v;
}

async function main() {
  requireEnv("BOT_TOKEN");
  requireEnv("DATABASE_URL");

  await initDb();
  await ensureStorage();
  log("Database initialized; storage ready");

  const token = process.env.BOT_TOKEN.trim();
  const bot = new Telegraf(token);
  const pool = getPool();

  registerHandlers(bot);

  async function shutdown(signal) {
    await bot.stop(signal);
    await pool.end();
    process.exit(0);
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  log("Starting polling…");
  await bot.launch();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
