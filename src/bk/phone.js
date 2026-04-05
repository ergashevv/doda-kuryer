/**
 * Российский номер: E.164 вида +7 и ровно 10 цифр национальной части.
 * Принимаем: +7XXXXXXXXXX, 8XXXXXXXXXX, 10 цифр без кода (3–9 в начале НДС).
 * Отклоняем: +998, +1, и любые не-РФ.
 */

const TEN = /^[3-9]\d{9}$/;

export function normalizeRussianPhone(msg) {
  let raw = "";
  if (msg.contact?.phone_number) {
    raw = msg.contact.phone_number;
  } else if (msg.text) {
    raw = msg.text.trim();
  } else {
    return null;
  }

  if (!raw) return null;

  // For text input, we perform stricter validation than just stripping digits.
  if (msg.text) {
    // 1. Only allow digits, plus, minus, parenthesis, and space.
    if (!/^[0-9+\-()\s]+$/.test(raw)) return null;

    // 2. Plus sign can only be at the beginning.
    if (raw.indexOf("+") > 0) return null;

    // 3. Must end with a digit (reject trailing '-' or '+')
    if (!/[0-9]$/.test(raw)) return null;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let national10;
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    national10 = digits.slice(1);
  } else if (digits.length === 10) {
    national10 = digits;
  } else {
    return null;
  }

  if (!TEN.test(national10)) return null;
  return `+7${national10}`;
}
