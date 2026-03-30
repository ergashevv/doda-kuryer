import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME, getSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const apiKey = (process.env.DASHBOARD_API_KEY || "").trim();
  const password = (process.env.DASHBOARD_PASSWORD || "").trim();
  if (!apiKey && !password) {
    return Response.json(
      {
        error:
          "Server sozlanmagan: web/.env ichida DASHBOARD_API_KEY yoki DASHBOARD_PASSWORD kiriting (masalan: openssl rand -hex 32).",
      },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submitted = (body.password || "").trim();
  const ok =
    (apiKey !== "" && submitted === apiKey) ||
    (password !== "" && submitted === password);
  if (!ok) {
    return Response.json({ error: "Parol noto‘g‘ri" }, { status: 401 });
  }

  let token: string;
  try {
    token = await getSessionToken();
  } catch (e) {
    console.error("getSessionToken", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Session yaratilmadi" },
      { status: 500 }
    );
  }
  if (!token) {
    return Response.json(
      { error: "Session kaliti bo‘sh — DASHBOARD_API_KEY / DASHBOARD_PASSWORD ni tekshiring." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  /** Brauzer cheklovi ~400 kun; amalda “cheksiz” sessiya uchun maksimal muddat. */
  const tenYears = 60 * 60 * 24 * 365 * 10;
  res.cookies.set(DASHBOARD_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tenYears,
  });
  return res;
}
