import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardCard, DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { UserFiles } from "@/components/UserFiles";
import { getUserDetail } from "@/lib/queries";
import { userDisplayName } from "@/lib/userDisplay";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ telegramId: string }> };

export default async function UserDetailPage(props: Params) {
  const { telegramId } = await props.params;
  if (!/^\d+$/.test(telegramId)) notFound();

  let data: Awaited<ReturnType<typeof getUserDetail>>;
  try {
    data = await getUserDetail(telegramId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  const { profile, files } = data;
  const title = userDisplayName({ ...profile, telegram_id: profile.telegram_id });

  return (
    <DashboardShell
      title={title}
      subtitle={`Telegram ID: ${String(profile.telegram_id)}`}
      backHref="/"
      actions={
        <>
          <Link
            href={`/users/${telegramId}/chat`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Telegram chat
          </Link>
          <LogoutButton />
        </>
      }
    >
      <div className="space-y-8">
        <DashboardCard title="Profil">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Til</dt>
              <dd className="mt-0.5 text-slate-900">{String(profile.language)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Servis</dt>
              <dd className="mt-0.5">{profile.service ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Tarif</dt>
              <dd className="mt-0.5">{profile.tariff ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Shahar</dt>
              <dd className="mt-0.5">{profile.city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefon</dt>
              <dd className="mt-0.5">{profile.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Telegram</dt>
              <dd className="mt-0.5">
                {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"}
                {profile.username ? ` (@${profile.username})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Session holati</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-600">{String(profile.session_state)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">session_data</dt>
              <dd className="mt-2 overflow-x-auto rounded-md border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-800">
                <pre className="whitespace-pre-wrap">{JSON.stringify(profile.session_data ?? {}, null, 2)}</pre>
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard title={`Hujjatlar (${files.length})`}>
          <UserFiles telegramId={telegramId} files={files} />
        </DashboardCard>
      </div>
    </DashboardShell>
  );
}
