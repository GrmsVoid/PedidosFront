"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CatalogoTab } from "./catalogo-tab";
import { MesasTab } from "./mesas-tab";
import { ReportesTab } from "./reportes-tab";

const TABS = [
  ["catalogo", "Catálogo"],
  ["mesas", "Mesas y QR"],
  ["reportes", "Reportes"],
] as const;
type TabId = (typeof TABS)[number][0];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("catalogo");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Administración</h1>
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "catalogo" && <CatalogoTab />}
      {tab === "mesas" && <MesasTab />}
      {tab === "reportes" && <ReportesTab />}
    </div>
  );
}
