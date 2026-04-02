/**
 * Telegram: bot profilidagi matn (Start bosilishidan oldin foydalanuvchi ko‘radigan).
 * @see https://core.telegram.org/bots/api#setmydescription
 */

const DEFAULT_SHORT =
  "Парк Doda taxi: заявка, документы, поддержка. Нажмите Start ↓";

const DEFAULT_LONG = `Бот парка Doda taxi — подключение курьеров и водителей, сбор заявок и документов (ВУ, СТС, паспорт).

Нажмите «Start», чтобы начать регистрацию. Вопросы — менеджерам через бота.`;

export async function syncBotProfile(telegram, log = console.log) {
  const short = (process.env.BOT_SHORT_DESCRIPTION || "").trim() || DEFAULT_SHORT;
  const long = (process.env.BOT_DESCRIPTION || "").trim() || DEFAULT_LONG;

  if (short.length > 120) {
    console.warn("[botProfile] BOT_SHORT_DESCRIPTION > 120 chars, truncated");
  }
  if (long.length > 512) {
    console.warn("[botProfile] BOT_DESCRIPTION > 512 chars, truncated");
  }

  try {
    await telegram.setMyShortDescription(short.slice(0, 120));
    await telegram.setMyDescription(long.slice(0, 512));
    log("Bot profile: setMyShortDescription + setMyDescription (default)");
  } catch (e) {
    console.warn("[botProfile] failed:", e?.message || e);
  }
}
