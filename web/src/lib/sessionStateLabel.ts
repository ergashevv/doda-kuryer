/** Moderatorlar uchun qisqa tushuntirish (texnik kalit emas). */
export function sessionStateLabelUz(state: string | null | undefined): string {
  const s = String(state || "");
  const map: Record<string, string> = {
    language: "Til tanlash",
    service: "Servis tanlash",
    tariff: "Tarif tanlash",
    phone: "Telefon",
    city: "Shahar",
    ready: "Tayyor",
    collect: "Hujjatlar",
    done: "Yakunlangan",
  };
  return map[s] ?? s;
}
