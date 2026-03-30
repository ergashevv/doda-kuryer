import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardShell({
  title,
  subtitle,
  backHref,
  backLabel = "← Ro‘yxat",
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            {backHref ? (
              <Link
                href={backHref}
                className="shrink-0 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                {backLabel}
              </Link>
            ) : null}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {title}
              </h1>
              {subtitle ? <p className="mt-0.5 font-mono text-xs text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function DashboardCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
