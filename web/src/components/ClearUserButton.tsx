"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClearUserButton({ telegramId }: { telegramId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
      onClick={async () => {
        if (
          !confirm(
            "Bu foydalanuvchining barcha ma’lumotlari o‘chiriladi: profil, chat tarixi, yuklangan fayllar. Telegramdagi akkaunt qoladi — faqat serverdagi yozuvlar yo‘qoladi. Davom etasizmi?"
          )
        ) {
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`/api/users/${telegramId}/clear`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: true }),
          });
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            alert(j.error || "Xato");
            return;
          }
          router.push("/");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "…" : "Ma’lumotlarni o‘chirish"}
    </button>
  );
}
