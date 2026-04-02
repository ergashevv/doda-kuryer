/**
 * Российский номер: E.164 вида +7 и ровно 10 цифр национальной части.
 * Принимаем: +7XXXXXXXXXX, 8XXXXXXXXXX, 10 цифр без кода (3–9 в начале НДС).
 * Отклоняем: +998, +1, и любые не-РФ.
 */

const TEN = /^[3-9]\d{9}$/;

export function normalizeRussianPhone(msg) {
  let digits = "";
  if (msg.contact?.phone_number) {
    digits = msg.contact.phone_number.replace(/\D/g, "");
  } else if (msg.text) {
    digits = msg.text.replace(/\D/g, "");
  } else {
    return null;
  }

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
