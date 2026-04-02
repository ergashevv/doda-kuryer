import fs from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.resolve(
  process.env.STORAGE_PATH || path.join(process.cwd(), "uploads")
);

export function ensureStorage() {
  return fs.mkdir(STORAGE_ROOT, { recursive: true });
}

function extFromMime(mime) {
  if (!mime) return "bin";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("mp4")) return "mp4";
  if (mime.startsWith("video/")) return "mp4";
  return "bin";
}

/** `telegram` — `ctx.telegram` (Telegraf Telegram client), `Telegraf` emas. */
export async function downloadTelegramFile(telegram, fileId, telegramUserId, docType, mimeType) {
  await ensureStorage();
  const link = await telegram.getFileLink(fileId);
  const ext = extFromMime(mimeType);
  const ts = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "_");
  const userDir = path.join(STORAGE_ROOT, String(telegramUserId));
  await fs.mkdir(userDir, { recursive: true });
  const fname = `${docType}_${ts}.${ext}`;
  const dest = path.join(userDir, fname);
  const res = await fetch(link.href);
  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return dest;
}

export { STORAGE_ROOT };
