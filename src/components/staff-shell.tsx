"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { homeForRoles, type RolCodigo } from "@/lib/roles";
import { useAuth } from "@/components/providers";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

// Cada rol ve solo su pantalla; el ADMIN gestiona el negocio, no la operación.
export const NAV: Array<{ href: string; label: string; roles: RolCodigo[] }> = [
  { href: "/mozo", label: "Mozo", roles: ["MOZO"] },
  { href: "/kds", label: "Cocina", roles: ["BARISTA"] },
  { href: "/caja", label: "Caja", roles: ["CAJERO"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Sin sesión → login. Con sesión pero sin el rol de esta sección → su home.
  const seccion = NAV.find((n) => pathname.startsWith(n.href));
  const sinPermiso =
    !!user && !!seccion && !seccion.roles.some((r) => (user.roles ?? []).includes(r));

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (!loading && user && sinPermiso) {
      router.replace(homeForRoles(user.roles ?? []));
    }
  }, [loading, user, router, pathname, sinPermiso]);

  if (loading || !user || sinPermiso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Link href="/staff" className="flex shrink-0 items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs text-white shadow-sm">
                ☕
              </span>
              <span className="hidden font-display text-base font-semibold tracking-tight text-slate-900 sm:inline">
                Café Demo
              </span>
            </Link>
            <nav className="no-scrollbar flex gap-1 overflow-x-auto">
              {links.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium tracking-tight transition-all duration-150",
                      active
                        ? "bg-ink text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {user.name?.trim().charAt(0).toUpperCase() || "?"}
              </span>
              {user.name}
            </span>
            <button
              onClick={salir}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
