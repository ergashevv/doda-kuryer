import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatMessages } from "@/components/ChatMessages";
import { getUserDetail } from "@/lib/queries";
import { LogoutButton } from "@/components/LogoutButton";
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

  const { profile, files, messages } = data;
  const title = userDisplayName({ ...profile, telegram_id: profile.telegram_id });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <Link href="/" className="shrink-0 text-sm text-amber-500/90 hover:underline">
              ← Ro‘yxat
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{title}</h1>
              <p className="font-mono text-xs text-zinc-500">Telegram ID: {String(profile.telegram_id)}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20">
          <div className="border-b border-zinc-800/80 bg-[#17212b] px-4 py-2.5">
            <h2 className="text-sm font-medium text-zinc-200">Chat</h2>
            <p className="text-xs text-zinc-500">{messages.length} xabar</p>
          </div>
          <div className="p-3 sm:p-4">
            <ChatMessages messages={messages} messageLang={profile.language} />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">Profil</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Til</dt>
              <dd>{String(profile.language)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Servis</dt>
              <dd>{profile.service ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Tarif</dt>
              <dd>{profile.tariff ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Shahar</dt>
              <dd>{profile.city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Telefon</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Telegram</dt>
              <dd>
                {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"}
                {profile.username ? ` (@${profile.username})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Session</dt>
              <dd className="font-mono text-xs text-zinc-400">{String(profile.session_state)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">session_data (JSON)</dt>
              <dd className="mt-1 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                <pre>{JSON.stringify(profile.session_data ?? {}, null, 2)}</pre>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Yuklangan fayllar ({files.length})
          </h2>
          {files.length === 0 ? (
            <p className="text-sm text-zinc-500">Hozircha fayl yo‘q.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4">Turi</th>
                    <th className="py-2 pr-4">file_id</th>
                    <th className="py-2">Lokal yo‘l</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 pr-4">{f.doc_type}</td>
                      <td className="max-w-[180px] truncate font-mono text-xs text-zinc-400">{f.telegram_file_id}</td>
                      <td className="break-all font-mono text-xs text-zinc-400">{f.local_path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
