import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASHBOARD_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
