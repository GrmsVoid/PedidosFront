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
      <div className="flex min-h-screen items-center justify-center bg-paper">
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
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Link href="/staff" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="Grimes OS, panel staff">
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-[11px] font-bold text-white">
                G
              </span>
              <span className="hidden text-[15px] font-semibold tracking-tight text-slate-900 sm:inline">
                Grimes<span className="text-brand">/OS</span>
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
                      "relative shrink-0 rounded-sm px-3 py-2 text-sm font-semibold tracking-tight transition-[background-color,color,box-shadow] duration-150 ease-out-strong",
                      active
                        ? "bg-ink text-white shadow-sm after:absolute after:inset-x-2 after:-bottom-[9px] after:h-0.5 after:bg-brand"
                        : "text-muted hover:bg-accent-soft hover:text-ink",
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
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-panel text-xs font-semibold text-slate-700">
                {user.name?.trim().charAt(0).toUpperCase() || "?"}
              </span>
              {user.name}
            </span>
            <button
              onClick={salir}
              className="flex min-h-10 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">{children}</main>
    </div>
  );
}
