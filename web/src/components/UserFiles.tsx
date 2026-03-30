import path from "node:path";
import type { UploadedFileRow } from "@/lib/queries";

function isImagePath(p: string) {
  const e = path.extname(p).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(e);
}

function isPdfPath(p: string) {
  return path.extname(p).toLowerCase() === ".pdf";
}

export function UserFiles({ telegramId, files }: { telegramId: string; files: UploadedFileRow[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">Hozircha yuklangan fayl yo‘q.</p>;
  }

  const base = `/api/users/${telegramId}/files`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((f) => {
        const previewUrl = `${base}/${f.id}`;
        const downloadUrl = `${base}/${f.id}?download=1`;
        const image = isImagePath(f.local_path);
        const pdf = isPdfPath(f.local_path);

        return (
          <article
            key={f.id}
            className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80"
          >
            <div className="border-b border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hujjat</p>
              <p className="font-mono text-sm text-slate-900">{f.doc_type}</p>
            </div>
            <div className="relative flex min-h-[160px] flex-1 items-center justify-center bg-slate-100">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={f.doc_type}
                  className="max-h-56 w-full object-contain"
                />
              ) : pdf ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className="text-4xl" aria-hidden>
                    PDF
                  </span>
                  <p className="text-xs text-slate-600">PDF — ko‘rish yoki yuklab olish</p>
                </div>
              ) : (
                <p className="px-2 text-center text-xs text-slate-500">Fayl (preview yo‘q)</p>
              )}
            </div>
            <div className="flex gap-2 border-t border-slate-200 bg-white p-2">
              {pdf ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ochish
                </a>
              ) : null}
              <a
                href={downloadUrl}
                className="flex-1 rounded bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
                download
              >
                Yuklab olish
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
