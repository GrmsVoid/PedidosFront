"use client";

import Link from "next/link";
import { ChefHat, ClipboardList, LayoutDashboard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import type { RolCodigo } from "@/lib/roles";

const SECCIONES: Array<{
  href: string;
  label: string;
  desc: string;
  roles: RolCodigo[];
  icon: typeof ChefHat;
}> = [
  { href: "/mozo", label: "Mozo", desc: "Mesas, pedidos y eventos", roles: ["MOZO", "ADMIN"], icon: ClipboardList },
  { href: "/kds", label: "Cocina (KDS)", desc: "Cola de preparación", roles: ["BARISTA", "ADMIN"], icon: ChefHat },
  { href: "/caja", label: "Caja", desc: "Cobros y cierres", roles: ["CAJERO", "ADMIN"], icon: Wallet },
  { href: "/admin", label: "Administración", desc: "Catálogo, mesas y reportes", roles: ["ADMIN"], icon: LayoutDashboard },
];

export default function StaffHub() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const disponibles = SECCIONES.filter((s) => s.roles.some((r) => roles.includes(r)));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Hola, {user?.name}</h1>
      <p className="mb-6 text-slate-500">Elige una sección para empezar.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {disponibles.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{s.label}</h2>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
