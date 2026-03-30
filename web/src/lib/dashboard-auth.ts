import { validateApiRequest } from "./auth-api";
import { DASHBOARD_COOKIE_NAME, isValidSessionCookie } from "./session";

/** Brauzer cookie yoki API kalit (Bearer / X-API-Key). */
export async function isDashboardAuthorized(request: Request): Promise<boolean> {
  if (validateApiRequest(request)) return true;
  const header = request.headers.get("cookie") || "";
  const m = header.match(new RegExp(`(?:^|;\\s*)${DASHBOARD_COOKIE_NAME}=([^;]+)`));
  const raw = m?.[1];
  if (!raw) return false;
  try {
    return isValidSessionCookie(decodeURIComponent(raw));
  } catch {
    return isValidSessionCookie(raw);
  }
}

export function unauthorizedJson() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
