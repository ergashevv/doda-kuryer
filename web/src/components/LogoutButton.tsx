"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      Chiqish
    </button>
  );
}
