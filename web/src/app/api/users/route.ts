import { validateApiRequest, unauthorizedResponse } from "@/lib/auth-api";
import { listUsers } from "@/lib/queries";

export async function GET(request: Request) {
  if (!validateApiRequest(request)) {
    return unauthorizedResponse();
  }
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
    const users = await listUsers(limit, offset);
    return Response.json({ users, limit, offset });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
