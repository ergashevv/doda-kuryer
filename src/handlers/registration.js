import { registerBkHandlers } from "../bk/handlers.js";
import { inboundDedupeMiddleware } from "../bk/inboundDedupe.js";

export function registerHandlers(bot) {
  bot.use(inboundDedupeMiddleware());
  bot.catch((err) => {
    console.error("[telegraf]", err?.stack || err?.message || err);
  });
  registerBkHandlers(bot);
}
