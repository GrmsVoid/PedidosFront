"use client";

import { useState } from "react";
import {
  BarChart3,
  Grid3x3,
  LayoutDashboard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CatalogoTab } from "./catalogo-tab";
import { MesasTab } from "./mesas-tab";
import { ReportesTab } from "./reportes-tab";
import { DashboardTab } from "./finanzas/dashboard-tab";
import { EgresosTab } from "./finanzas/egresos-tab";
import { IngresosTab } from "./finanzas/ingresos-tab";
import { PresupuestoTab } from "./finanzas/presupuesto-tab";

type SectionId =
  | "dashboard"
  | "egresos"
  | "ingresos"
  | "presupuesto"
  | "catalogo"
  | "mesas"
  | "reportes";

const GROUPS: { label: string; items: { id: SectionId; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Negocio",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "egresos", label: "Egresos", icon: TrendingDown },
      { id: "ingresos", label: "Ingresos", icon: TrendingUp },
      { id: "presupuesto", label: "Presupuesto", icon: PiggyBank },
    ],
  },
  {
    label: "Operación",
    items: [
      { id: "catalogo", label: "Catálogo", icon: UtensilsCrossed },
      { id: "mesas", label: "Mesas y QR", icon: Grid3x3 },
    ],
  },
  {
    label: "Análisis",
    items: [{ id: "reportes", label: "Reportes", icon: BarChart3 }],
  },
];

export default function AdminPage() {
  const [section, setSection] = useState<SectionId>("dashboard");

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
          {GROUPS.map((g) => (
            <div key={g.label} className="lg:mb-5">
              <p className="hidden px-3 pb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 lg:block">
                {g.label}
              </p>
              <div className="flex gap-1 lg:flex-col">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = section === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSection(it.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-colors",
                        active
                          ? "bg-ink text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {section === "dashboard" && <DashboardTab />}
        {section === "egresos" && <EgresosTab />}
        {section === "ingresos" && <IngresosTab />}
        {section === "presupuesto" && <PresupuestoTab />}
        {section === "catalogo" && <CatalogoTab />}
        {section === "mesas" && <MesasTab />}
        {section === "reportes" && <ReportesTab />}
      </div>
    </div>
  );
}
