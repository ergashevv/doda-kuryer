/** Telegram коллектор: невалидные типы и MIME для шага «документ». */

export function hasForbiddenMediaTypes(msg) {
  return !!(
    msg.voice ||
    msg.video ||
    msg.video_note ||
    msg.sticker ||
    msg.animation
  );
}

export function isAllowedDocumentMime(mime) {
  if (!mime || typeof mime !== "string") return false;
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return true;
  return m === "application/pdf";
}
