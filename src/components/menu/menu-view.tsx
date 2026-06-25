"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatStr } from "@/lib/price";
import type { Menu, MenuProducto } from "./types";

export function MenuView({
  menu,
  onSelect,
}: {
  menu: Menu;
  onSelect: (p: MenuProducto) => void;
}) {
  return (
    <div className="space-y-6 pb-32">
      {menu.categorias.map((cat) => (
        <section key={cat.id}>
          <h2 className="mb-2 px-1 text-lg font-semibold text-slate-900">{cat.nombre}</h2>
          <div className="space-y-2">
            {cat.productos.map((p) => (
              <button
                key={p.id}
                disabled={!p.disponible}
                onClick={() => onSelect(p)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors",
                  p.disponible ? "hover:border-slate-300 hover:shadow-sm" : "opacity-60",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.nombre}</span>
                    {!p.disponible && <Badge tone="red">Agotado</Badge>}
                  </div>
                  {p.descripcion && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{p.descripcion}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatStr(p.precioBase)}
                    {p.grupos.length > 0 && (
                      <span className="ml-1 font-normal text-slate-400">· personalizable</span>
                    )}
                  </p>
                </div>
                {p.disponible && <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
