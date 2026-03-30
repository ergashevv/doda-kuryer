import type { ChatMessageRow } from "@/lib/queries";
import { humanizeChatMessageText } from "@/lib/humanizeCallbackLog";

/** Telegram qorong‘i mavzuga yaqin chat ko‘rinishi. */
export function ChatMessages({
  messages,
  messageLang,
}: {
  messages: ChatMessageRow[];
  /** Profil tili — eski `[callback] …` yozuvlarini shu tilga mos matnga aylantirish uchun. */
  messageLang?: string | null;
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-zinc-500">Xabarlar yo‘q.</p>;
  }

  return (
    <div
      className="flex max-h-[min(70vh,640px)] min-h-[320px] flex-col gap-1 overflow-y-auto rounded-xl bg-[#0e1621] p-3 sm:p-4"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      {messages.map((m) => {
        const isUser = m.role === "user";
        const time = new Date(m.created_at).toLocaleString("uz-UZ", {
          timeZone: "Asia/Tashkent",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        });
        const extra =
          m.extra && Object.keys(m.extra).length > 0 ? (
            <span className="mt-1 block font-mono text-[10px] leading-tight opacity-70">
              {JSON.stringify(m.extra)}
            </span>
          ) : null;

        if (isUser) {
          return (
            <div key={m.id} className="flex w-full justify-end">
              <div className="max-w-[min(85%,28rem)] rounded-2xl rounded-br-md bg-[#2b5278] px-3 py-2 text-[15px] leading-snug text-white shadow-sm">
                <p className="whitespace-pre-wrap break-words">
                  {humanizeChatMessageText(m.text, messageLang)}
                </p>
                {extra}
                <p className="mt-1 text-right text-[11px] text-white/55">{time}</p>
              </div>
            </div>
          );
        }

        return (
          <div key={m.id} className="flex w-full justify-start">
            <div className="max-w-[min(85%,28rem)] rounded-2xl rounded-bl-md bg-[#182533] px-3 py-2 text-[15px] leading-snug text-zinc-100 shadow-sm">
              <p className="whitespace-pre-wrap break-words">
                {humanizeChatMessageText(m.text, messageLang)}
              </p>
              {extra}
              <p className="mt-1 text-[11px] text-zinc-500">{time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
