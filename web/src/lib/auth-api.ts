export function validateApiRequest(request: Request): boolean {
  const apiKey = (process.env.DASHBOARD_API_KEY || "").trim();
  const password = (process.env.DASHBOARD_PASSWORD || "").trim();
  const auth = request.headers.get("authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (apiKey && bearer === apiKey) return true;
  if (password && bearer === password) return true;
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (apiKey && headerKey === apiKey) return true;
  if (password && headerKey === password) return true;
  return false;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
