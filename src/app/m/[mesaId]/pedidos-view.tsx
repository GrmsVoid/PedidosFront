"use client";

import { Check, ChefHat, HandPlatter, Receipt, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatStr } from "@/lib/price";
import type { Menu, PedidoEstado, SesionActual } from "./types";

const PASOS: Array<{ estado: PedidoEstado; label: string; icon: typeof Check }> = [
  { estado: "CONFIRMADO", label: "Recibido", icon: Receipt },
  { estado: "EN_PREPARACION", label: "Preparando", icon: ChefHat },
  { estado: "LISTO", label: "Listo", icon: Check },
  { estado: "ENTREGADO", label: "Entregado", icon: HandPlatter },
];

/** Línea de progreso del pedido: recibido → preparando → listo → entregado. */
function Timeline({ estado }: { estado: PedidoEstado }) {
  const idx = PASOS.findIndex((p) => p.estado === estado);
  return (
    <div className="flex items-center">
      {PASOS.map((paso, i) => {
        const done = i < idx;
        const current = i === idx;
        const Icon = paso.icon;
        return (
          <div key={paso.estado} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <span
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full transition-colors duration-500",
                  i <= idx ? "bg-ink" : "bg-slate-200",
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
                  done && "bg-ink text-white",
                  current && "bg-ink text-white shadow-md ring-4 ring-ink/10",
                  !done && !current && "bg-slate-100 text-slate-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  current ? "text-ink" : done ? "text-slate-500" : "text-slate-400",
                )}
              >
                {paso.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PedidosView({ sesion, menu }: { sesion: SesionActual; menu: Menu | null }) {
  const nombrePorId = new Map<string, string>();
  if (menu) {
    for (const c of menu.categorias) for (const p of c.productos) nombrePorId.set(p.id, p.nombre);
  }

  const pedidos = [...sesion.sesion.pedidos].sort((a, b) => b.numeroSesion - a.numeroSesion);

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <p>Aún no hay pedidos.</p>
        <p className="text-sm">Arma el tuyo desde el menú.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-32">
      {pedidos.map((pedido) => {
        const cancelado = pedido.estado === "CANCELADO";
        return (
          <div
            key={pedido.id}
            className="animate-fade-up space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(11,11,13,0.03)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Pedido #{pedido.numeroSesion}
              </span>
              {cancelado && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-600/15">
                  <XCircle className="h-3.5 w-3.5" /> Cancelado
                </span>
              )}
            </div>

            {!cancelado && <Timeline estado={pedido.estado} />}

            <ul className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              {pedido.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="text-slate-700">
                    <span className="tabular-nums">{it.cantidad}×</span>{" "}
                    {(it.productoId && nombrePorId.get(it.productoId)) ?? it.nombreCongelado ?? "Producto"}
                    {it.modificadores.length > 0 && (
                      <span className="text-slate-400">
                        {" "}
                        ({it.modificadores.map((m) => m.nombreCongelado).join(", ")})
                      </span>
                    )}
                    {it.notaLibre && (
                      <span className="block text-xs italic text-slate-400">“{it.notaLibre}”</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {formatStr(it.precioUnitarioCongelado)} ×{it.cantidad}
                  </span>
                </li>
              ))}
            </ul>
            {cancelado && pedido.canceladoMotivo && (
              <p className="text-xs text-red-500">Motivo: {pedido.canceladoMotivo}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
