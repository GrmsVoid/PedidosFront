"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { RolCodigo } from "@/lib/roles";
import { useAuth } from "@/components/providers";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

export const NAV: Array<{ href: string; label: string; roles: RolCodigo[] }> = [
  { href: "/mozo", label: "Mozo", roles: ["MOZO", "ADMIN"] },
  { href: "/kds", label: "Cocina", roles: ["BARISTA", "ADMIN"] },
  { href: "/caja", label: "Caja", roles: ["CAJERO", "ADMIN"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const roles = user.roles ?? [];
  const links = NAV.filter((n) => n.roles.some((r) => roles.includes(r)));

  function salir() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="font-bold text-slate-900">
              Café Demo
            </Link>
            <nav className="flex gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith(l.href)
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
            <button
              onClick={salir}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
