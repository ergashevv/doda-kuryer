const PAYLOAD = "doda-dashboard-v1";

export const DASHBOARD_COOKIE_NAME = "doda_dashboard";

function secret(): string {
  return (
    (process.env.DASHBOARD_API_KEY || "").trim() ||
    (process.env.DASHBOARD_PASSWORD || "").trim()
  );
}

/** Edge va Node da ishlaydi (Web Crypto). */
export async function getSessionToken(): Promise<string> {
  const s = secret();
  if (!s) return "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(s),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(PAYLOAD));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function isValidSessionCookie(value: string | undefined): Promise<boolean> {
  const expected = await getSessionToken();
  if (!value || !expected || value.length !== expected.length) return false;
  try {
    const a = hexToBytes(value);
    const b = hexToBytes(expected);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}
