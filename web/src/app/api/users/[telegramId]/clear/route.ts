import { isDashboardAuthorized, unauthorizedJson } from "@/lib/dashboard-auth";
import { clearUserData } from "@/lib/queries";

export const runtime = "nodejs";

type Params = { params: Promise<{ telegramId: string }> };

/**
 * POST body: `{ "confirm": true }` — foydalanuvchi chati, hujjatlari va profili o‘chiriladi.
 */
export async function POST(request: Request, context: Params) {
  if (!(await isDashboardAuthorized(request))) {
    return unauthorizedJson();
  }
  const { telegramId } = await context.params;
  if (!/^\d+$/.test(telegramId)) {
    return Response.json({ error: "Noto‘g‘ri ID" }, { status: 400 });
  }

  let body: { confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON kutilmoqda" }, { status: 400 });
  }
  if (body.confirm !== true) {
    return Response.json(
      { error: "Tasdiqlash kerak: { \"confirm\": true }" },
      { status: 400 }
    );
  }

  try {
    const deleted = await clearUserData(telegramId);
    if (!deleted) {
      return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Server xatosi" },
      { status: 500 }
    );
  }
}
