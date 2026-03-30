export function validateApiRequest(request: Request): boolean {
  const key = (process.env.DASHBOARD_API_KEY || "").trim();
  if (!key) return false;
  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${key}`) return true;
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey === key) return true;
  return false;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
