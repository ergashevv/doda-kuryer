import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../assets/placeholders");

/** Карта ключ → файл.png в assets/placeholders */
const KEYS = new Set([
  "welcome",
  "phone",
  "category",
  "city",
  "passport",
  "license",
  "vu",
  "sts",
  "thermal",
  "review",
  "arenda",
  "faq",
  "rental",
  "default",
]);

export function resolvePlaceholderPath(key) {
  const k = KEYS.has(key) ? key : "default";
  const fromEnv = (process.env[`PLACEHOLDER_${k.toUpperCase()}`] || "").trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  for (const ext of [".png", ".jpg", ".jpeg"]) {
    const p = path.join(ROOT, `${k}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  const def = path.join(ROOT, "default.png");
  if (fs.existsSync(def)) return def;
  return null;
}

export function resolveWelcomeVideoNotePath() {
  const v = (process.env.BK_WELCOME_VIDEO_NOTE || "").trim();
  if (v && fs.existsSync(v)) return v;
  const fallback = path.join(__dirname, "../../assets/welcome_note.mp4");
  return fs.existsSync(fallback) ? fallback : null;
}
