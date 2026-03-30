"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mx-auto flex max-w-sm flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const password = String(fd.get("password") || "");
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setErr((j as { error?: string }).error || "Xato");
            return;
          }
          window.location.href = next.startsWith("/") ? next : "/";
        } finally {
          setLoading(false);
        }
      }}
    >
      <h1 className="text-lg font-semibold text-zinc-100">Doda — dashboard</h1>
      <p className="text-sm text-zinc-500">Parolni kiriting (DASHBOARD_PASSWORD yoki API kalit).</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Parol</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-600/50"
        />
      </label>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "…" : "Kirish"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <Suspense fallback={<p className="text-zinc-500">Yuklanmoqda…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
