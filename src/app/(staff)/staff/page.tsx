"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChefHat, ClipboardList, LayoutDashboard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import type { RolCodigo } from "@/lib/roles";

const SECCIONES: Array<{
  href: string;
  label: string;
  desc: string;
  roles: RolCodigo[];
  icon: typeof ChefHat;
  tint: string;
}> = [
  { href: "/mozo", label: "Mozo", desc: "Mesas, pedidos y eventos", roles: ["MOZO"], icon: ClipboardList, tint: "bg-sky-50 text-sky-600" },
  { href: "/kds", label: "Cocina (KDS)", desc: "Cola de preparación", roles: ["BARISTA"], icon: ChefHat, tint: "bg-amber-50 text-amber-600" },
  { href: "/caja", label: "Caja", desc: "Cobros y cierres", roles: ["CAJERO"], icon: Wallet, tint: "bg-emerald-50 text-emerald-600" },
  { href: "/admin", label: "Administración", desc: "Catálogo, salón, finanzas y reportes", roles: ["ADMIN"], icon: LayoutDashboard, tint: "bg-violet-50 text-violet-600" },
];

export default function StaffHub() {
  const { user } = useAuth();
  const router = useRouter();
  const roles = user?.roles ?? [];
  const disponibles = SECCIONES.filter((s) => s.roles.some((r) => roles.includes(r)));

  // Con un solo rol no hay nada que elegir: directo a su pantalla.
  useEffect(() => {
    if (disponibles.length === 1) router.replace(disponibles[0].href);
  }, [disponibles, router]);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-slate-900">
        Hola, {user?.name}
      </h1>
      <p className="mb-6 text-slate-500">Elige una sección para empezar.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {disponibles.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card
                interactive
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="flex items-center gap-4 pt-6">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${s.tint}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">{s.label}</h2>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
