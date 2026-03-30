import { validateApiRequest, unauthorizedResponse } from "@/lib/auth-api";
import { getUserDetail } from "@/lib/queries";

type Params = { params: Promise<{ telegramId: string }> };

export async function GET(request: Request, context: Params) {
  if (!validateApiRequest(request)) {
    return unauthorizedResponse();
  }
  const { telegramId } = await context.params;
  if (!/^\d+$/.test(telegramId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const data = await getUserDetail(telegramId);
    if (!data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(data);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
