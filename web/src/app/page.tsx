import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { listUsers } from "@/lib/queries";
import { sessionStateLabelUz } from "@/lib/sessionStateLabel";
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
    <DashboardShell title="Kuryerlar" subtitle="Ro‘yxatdan o‘tgan foydalanuvchilar" actions={<LogoutButton />}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ism</th>
                  <th className="px-4 py-3 font-semibold">@username</th>
                  <th className="px-4 py-3 font-semibold">Telefon</th>
                  <th className="px-4 py-3 font-semibold">Shahar</th>
                  <th className="px-4 py-3 font-semibold">Servis</th>
                  <th className="px-4 py-3 font-semibold">Holat</th>
                  <th className="px-4 py-3 font-semibold">Telegram ID</th>
                  <th className="px-4 py-3 font-semibold">Yangilangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Hozircha foydalanuvchi yo‘q.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const label = userDisplayName(u);
                    return (
                      <tr key={u.telegram_id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link
                            href={`/users/${u.telegram_id}`}
                            className="text-sky-800 underline-offset-2 hover:text-sky-900 hover:underline"
                          >
                            {label}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.username ? `@${u.username}` : "—"}</td>
                        <td className="px-4 py-3">{u.phone || "—"}</td>
                        <td className="px-4 py-3">{u.city || "—"}</td>
                        <td className="px-4 py-3">{u.service || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{sessionStateLabelUz(u.session_state)}</td>
                        <td className="px-4 py-3 text-slate-700">{u.telegram_id}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {u.updated_at
                            ? new Date(u.updated_at).toLocaleString("uz-UZ", {
                                timeZone: "Asia/Tashkent",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
