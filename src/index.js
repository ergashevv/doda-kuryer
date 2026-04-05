import "dotenv/config";
import { Telegraf } from "telegraf";
import { initDb, getPool } from "./db.js";
import { ensureStorage } from "./services/storage.js";
import { registerHandlers } from "./handlers/registration.js";
import { syncBotProfile } from "./botProfile.js";

const log = (...a) => console.log(new Date().toISOString(), ...a);

/** Ikki+ getUpdates bir vaqtda — Telegram 409 qaytaradi, bot to‘xtaydi. */
function isTelegram409Conflict(e) {
  const code = e?.response?.error_code ?? e?.code;
  if (code === 409) return true;
  const msg = String(e?.message || e?.description || "");
  return msg.includes("409") && msg.toLowerCase().includes("conflict");
}

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
  const gid = (process.env.DOCS_GROUP_ID || "").trim();
  if (gid) {
    log("DOCS_GROUP_ID set — submissions will be mirrored to group", gid);
  }

  const token = process.env.BOT_TOKEN.trim();
  const bot = new Telegraf(token);
  const pool = getPool();

  await syncBotProfile(bot.telegram, log);

  registerHandlers(bot);

  async function shutdown(signal) {
    await bot.stop(signal);
    await pool.end();
    process.exit(0);
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  log("Starting polling…");
  log(
    "Bitta bot jarayoni ishlatilsin: ikki+ getUpdates (409 Conflict) callbacklarni yo‘qotadi / bot «qotib» qolgan ko‘rinadi."
  );
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });
  } catch (e) {
    log("deleteWebhook (polling oldidan):", e?.message || e);
  }

  const max409 = Math.max(0, Number(process.env.POLLING_409_RETRIES || "12"));
  const delayMs = Math.max(3000, Number(process.env.POLLING_409_DELAY_MS || "15000"));
  let attempt = 0;
  for (;;) {
    try {
      await bot.launch();
      break;
    } catch (e) {
      if (!isTelegram409Conflict(e) || attempt >= max409) throw e;
      attempt++;
      try {
        await bot.stop();
      } catch (_) {}
      log(
        `Telegram 409 Conflict — boshqa joyda ham shu token bilan getUpdates ishlayapti. ${attempt}/${max409}, ${delayMs}ms keyin qayta…`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

main().catch((e) => {
  if (isTelegram409Conflict(e)) {
    console.error(`
======== TELEGRAM 409 CONFLICT ========
Bir xil BOT_TOKEN bilan ikki+ long polling (getUpdates) bir vaqtda ishlamoqda — Telegram bittasiga ruxsat beradi.

Nima qilish kerak:
  • Mahalliy kompyuterda botni to‘xtating (npm start / Cursor terminal / boshqa IDE).
  • Hostingda faqat 1 instansiya: masalan Railway → Replicas = 1 (yoki bitta worker).
  • @BotFather yoki boshqa serverda shu bot uchun webhook/polling qolmaganini tekshiring.

Barcha ortiqcha jarayonlar to‘xtagach, deploy qayta ishga tushadi yoki POLLING_409_RETRIES kutish tugaydi.
=======================================
`);
  }
  console.error(e);
  process.exit(1);
});
