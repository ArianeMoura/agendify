"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

const nav = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/spaces", label: "Espaços" },
  { href: "/bookings", label: "Reservas" },
  { href: "/reports", label: "Relatórios" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <div className="text-brand-700 mb-8 px-2 text-xl font-bold">Agendify</div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-soft hover:bg-[var(--color-muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--color-line)] pt-4">
          <p className="px-2 text-sm font-medium">{user.name}</p>
          <p className="text-ink-soft mb-2 px-2 text-xs">{user.email}</p>
          <button
            onClick={() => logout().then(() => router.replace("/login"))}
            className="text-ink-soft w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
