import type { ChatMessageRow } from "@/lib/queries";
import { humanizeChatMessageText } from "@/lib/humanizeCallbackLog";

type Variant = "light" | "dark";

const shell: Record<Variant, string> = {
  light:
    "flex max-h-[min(75vh,720px)] min-h-[360px] flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100/80 p-4",
  dark: "flex max-h-[min(70vh,640px)] min-h-[320px] flex-col gap-1 overflow-y-auto rounded-xl bg-[#0e1621] p-3 sm:p-4",
};

/** Telegram uslubida chat — light: korporativ dashboard, dark: qorong‘i. */
export function ChatMessages({
  messages,
  messageLang,
  variant = "light",
}: {
  messages: ChatMessageRow[];
  /** Profil tili — eski `[callback] …` yozuvlarini shu tilga mos matnga aylantirish uchun. */
  messageLang?: string | null;
  variant?: Variant;
}) {
  if (messages.length === 0) {
    return (
      <p className={variant === "light" ? "text-sm text-slate-500" : "text-sm text-zinc-500"}>
        Xabarlar yo‘q.
      </p>
    );
  }

  const v = variant;

  return (
    <div
      className={shell[v]}
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
            <span
              className={
                v === "light"
                  ? "mt-1 block font-mono text-[10px] leading-tight text-slate-500"
                  : "mt-1 block font-mono text-[10px] leading-tight opacity-70"
              }
            >
              {JSON.stringify(m.extra)}
            </span>
          ) : null;

        if (isUser) {
          if (v === "light") {
            return (
              <div key={m.id} className="flex w-full justify-end">
                <div className="max-w-[min(85%,28rem)] rounded-2xl rounded-br-md bg-sky-700 px-3 py-2 text-[15px] leading-snug text-white shadow-sm">
                  <p className="whitespace-pre-wrap break-words">
                    {humanizeChatMessageText(m.text, messageLang)}
                  </p>
                  {extra}
                  <p className="mt-1 text-right text-[11px] text-sky-100/90">{time}</p>
                </div>
              </div>
            );
          }
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

        if (v === "light") {
          return (
            <div key={m.id} className="flex w-full justify-start">
              <div className="max-w-[min(85%,28rem)] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[15px] leading-snug text-slate-800 shadow-sm">
                <p className="whitespace-pre-wrap break-words">
                  {humanizeChatMessageText(m.text, messageLang)}
                </p>
                {extra}
                <p className="mt-1 text-[11px] text-slate-400">{time}</p>
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
