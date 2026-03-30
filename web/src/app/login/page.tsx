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
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl border border-slate-200 bg-white p-8 shadow-lg"
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
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Doda</h1>
        <p className="mt-1 text-sm text-slate-600">Kuryerlar boshqaruv paneli</p>
      </div>
      <p className="text-sm text-slate-500">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">DASHBOARD_API_KEY</code> yoki{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">DASHBOARD_PASSWORD</code> bilan
        kiriting.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Parol / kalit</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-slate-400 focus:ring-2"
        />
      </label>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "…" : "Kirish"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Suspense fallback={<p className="text-slate-600">Yuklanmoqda…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
