import { registerBkHandlers } from "../bk/handlers.js";

export function registerHandlers(bot) {
  bot.catch((err) => {
    console.error("[telegraf]", err?.stack || err?.message || err);
  });
  registerBkHandlers(bot);
}
