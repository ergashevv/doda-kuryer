/** Ro‘yxat va sarlavha uchun ko‘rinadigan ism. */
export function userDisplayName(p: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  telegram_id?: string | null;
}): string {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (p.username) return `@${p.username}`;
  if (p.telegram_id) return `ID ${p.telegram_id}`;
  return "Noma'lum";
}
