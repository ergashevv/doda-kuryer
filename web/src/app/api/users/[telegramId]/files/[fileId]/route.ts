import fs from "node:fs/promises";
import path from "node:path";
import { isDashboardAuthorized, unauthorizedJson } from "@/lib/dashboard-auth";
import { getStorageRoot } from "@/lib/storage-root";
import { getUploadedFileForUser } from "@/lib/queries";

export const runtime = "nodejs";

function safeResolvedPath(dbPath: string): string | null {
  const resolved = path.resolve(dbPath);
  const root = path.resolve(getStorageRoot());
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(prefix)) return null;
  return resolved;
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

type Params = { params: Promise<{ telegramId: string; fileId: string }> };

export async function GET(request: Request, context: Params) {
  if (!(await isDashboardAuthorized(request))) {
    return unauthorizedJson();
  }
  const { telegramId, fileId } = await context.params;
  if (!/^\d+$/.test(telegramId) || !/^\d+$/.test(fileId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = await getUploadedFileForUser(telegramId, fileId);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const safe = safeResolvedPath(row.local_path);
  if (!safe) {
    return Response.json(
      {
        error:
          "Fayl yo‘li xavfsiz emas yoki STORAGE_PATH mos emas. web/.env da STORAGE_PATH ni bot bilan bir xil qiling (lokalda odatda ../uploads yoki to‘liq yo‘l).",
      },
      { status: 400 }
    );
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(safe);
  } catch {
    return Response.json(
      { error: "Fayl serverda yo‘q — STORAGE_PATH bot bilan bir xil disk/volume bo‘lishi kerak." },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const download =
    url.searchParams.get("download") === "1" || url.searchParams.get("download") === "true";
  const ct = contentType(safe);
  const ext = path.extname(safe) || ".bin";
  const filename = `${row.doc_type}${ext}`;

  const headers = new Headers();
  headers.set("Content-Type", ct);
  headers.set(
    "Content-Disposition",
    `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  headers.set("Cache-Control", "private, max-age=3600");

  return new Response(new Uint8Array(buf), { status: 200, headers });
}
