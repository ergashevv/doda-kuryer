import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatMessages } from "@/components/ChatMessages";
import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { getUserDetail } from "@/lib/queries";
import { userDisplayName } from "@/lib/userDisplay";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ telegramId: string }> };

export default async function UserChatPage(props: Params) {
  const { telegramId } = await props.params;
  if (!/^\d+$/.test(telegramId)) notFound();

  let data: Awaited<ReturnType<typeof getUserDetail>>;
  try {
    data = await getUserDetail(telegramId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  const { profile, messages } = data;
  const title = userDisplayName({ ...profile, telegram_id: profile.telegram_id });

  return (
    <DashboardShell
      title={`${title} — chat`}
      subtitle={`${messages.length} xabar · Telegram ID: ${String(profile.telegram_id)}`}
      backHref={`/users/${telegramId}`}
      backLabel="← Profil"
      actions={<LogoutButton />}
    >
      <div className="rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <ChatMessages messages={messages} messageLang={profile.language} variant="light" />
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href={`/users/${telegramId}`} className="font-medium text-slate-700 hover:underline">
          Profil va hujjatlarga qaytish
        </Link>
      </p>
    </DashboardShell>
  );
}
