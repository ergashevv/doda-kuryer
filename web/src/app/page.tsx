import Link from "next/link";
import { listUsers } from "@/lib/queries";
import { LogoutButton } from "@/components/LogoutButton";
import { userDisplayName } from "@/lib/userDisplay";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let users: Awaited<ReturnType<typeof listUsers>> = [];
  let error: string | null = null;
  try {
    users = await listUsers(200, 0);
  } catch (e) {
    error = e instanceof Error ? e.message : "Ma’lumotlar bazasiga ulanishda xato";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Kuryerlar — foydalanuvchilar</h1>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {error ? (
          <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-200">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Ism</th>
                  <th className="px-4 py-3 font-medium">@username</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Shahar</th>
                  <th className="px-4 py-3 font-medium">Servis</th>
                  <th className="px-4 py-3 font-medium">Holat</th>
                  <th className="px-4 py-3 font-medium">Telegram ID</th>
                  <th className="px-4 py-3 font-medium">Yangilangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                      Hozircha foydalanuvchi yo‘q.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const label = userDisplayName(u);
                    return (
                      <tr key={u.telegram_id} className="hover:bg-zinc-900/40">
                        <td className="px-4 py-3 font-medium text-zinc-100">
                          <Link
                            href={`/users/${u.telegram_id}`}
                            className="text-amber-400/95 hover:text-amber-300 hover:underline"
                          >
                            {label}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {u.username ? `@${u.username}` : "—"}
                        </td>
                        <td className="px-4 py-3">{u.phone || "—"}</td>
                        <td className="px-4 py-3">{u.city || "—"}</td>
                        <td className="px-4 py-3">{u.service || "—"}</td>
                        <td className="px-4 py-3 text-zinc-400">{u.session_state}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">{u.telegram_id}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          {u.updated_at
                            ? new Date(u.updated_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-6 text-xs text-zinc-600">
          API: <code className="text-zinc-400">GET /api/users</code> —{" "}
          <code className="text-zinc-400">Authorization: Bearer …</code>
        </p>
      </main>
    </div>
  );
}
