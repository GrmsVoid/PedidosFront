"use client";

import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatStr } from "@/lib/price";
import type { Menu, MenuCombo, MenuProducto } from "./types";

export function MenuView({
  menu,
  onSelect,
  onAddCombo,
}: {
  menu: Menu;
  onSelect: (p: MenuProducto) => void;
  onAddCombo?: (c: MenuCombo) => void;
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
                    {p.precioAntes && (
                      <span className="mr-1.5 font-normal text-slate-400 line-through">
                        {formatStr(p.precioAntes)}
                      </span>
                    )}
                    {formatStr(p.precioBase)}
                    {p.precioAntes && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        promo
                      </span>
                    )}
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

      {onAddCombo && menu.combos.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-lg font-semibold text-slate-900">Combos</h2>
          <div className="space-y-2">
            {menu.combos.map((c) => (
              <button
                key={c.id}
                onClick={() => onAddCombo(c)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-left transition-colors hover:border-amber-300"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{c.nombre}</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      combo
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {c.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(" + ")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{formatStr(c.precio)}</p>
                </div>
                <Plus className="h-5 w-5 shrink-0 text-amber-500" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
