import path from "node:path";

/**
 * Bot `doda/uploads`, Next `web/` dan — lokalda default `../uploads` (repo ildizi).
 * Production: `STORAGE_PATH` aniq yoziladi (bot bilan bir xil).
 */
export function getStorageRoot(): string {
  const env = process.env.STORAGE_PATH?.trim();
  if (env) return path.resolve(env);
  return path.resolve(process.cwd(), "..", "uploads");
}
