/** Telegram takroriy yuborish / ikki marta bosishdan himoya (xotirada, bitta jarayon). */

const UPDATE_SEEN = new Map();
const START_DEBOUNCE = new Map();

const UPDATE_TTL_MS = 10 * 60 * 1000;
const START_DEBOUNCE_MS = 3000;

function pruneByAge(m, ttlMs, maxSize = 4000) {
  if (m.size < maxSize) return;
  const cut = Date.now() - ttlMs;
  for (const [k, t] of m) {
    if (t < cut) m.delete(k);
  }
}

/** Bir xil `update_id` ikki marta ishlanmasin (webhook retry / xatoliklar uchun). */
export function inboundDedupeMiddleware() {
  return async (ctx, next) => {
    const id = ctx.update?.update_id;
    if (id != null) {
      if (UPDATE_SEEN.has(id)) {
        console.warn(
          new Date().toISOString(),
          "[bk] skip duplicate update_id",
          id
        );
        return;
      }
      UPDATE_SEEN.set(id, Date.now());
      pruneByAge(UPDATE_SEEN, UPDATE_TTL_MS);
    }
    await next();
  };
}

/** Tez ketma-ket /start (tugma ikki marta) — ikkinchisini yubormaslik. */
export function allowStartCommand(uid) {
  const now = Date.now();
  const prev = START_DEBOUNCE.get(uid);
  if (prev != null && now - prev < START_DEBOUNCE_MS) {
    console.log(new Date().toISOString(), "[bk] /start debounce skip", uid);
    return false;
  }
  START_DEBOUNCE.set(uid, now);
  pruneByAge(START_DEBOUNCE, START_DEBOUNCE_MS * 4, 8000);
  return true;
}
