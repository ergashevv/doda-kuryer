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

/** Bank rekvizitlari qadamida: PDF/rasm + ko‘pchilik ofis/hujjat MIME va `.bin` kabi kengaytmalar. */
export function isAllowedYxRekvizitDocument(doc) {
  if (!doc || typeof doc !== "object") return false;
  if (isAllowedDocumentMime(doc.mime_type)) return true;
  const m = String(doc.mime_type || "").toLowerCase();
  if (
    m === "application/octet-stream" ||
    m.startsWith("application/msword") ||
    m ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    m === "text/plain"
  ) {
    return true;
  }
  const fn = String(doc.file_name || "");
  return /\.(pdf|png|jpe?g|gif|webp|doc|docx|txt|bin|rtf)$/i.test(fn);
}
