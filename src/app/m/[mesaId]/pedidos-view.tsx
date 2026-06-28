"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatStr } from "@/lib/price";
import type { Menu, PedidoEstado, SesionActual } from "./types";

const ESTADO_LABEL: Record<PedidoEstado, { label: string; tone: "blue" | "amber" | "green" | "slate" | "red" }> = {
  CONFIRMADO: { label: "Confirmado", tone: "blue" },
  EN_PREPARACION: { label: "En preparación", tone: "amber" },
  LISTO: { label: "Listo", tone: "green" },
  ENTREGADO: { label: "Entregado", tone: "slate" },
  CANCELADO: { label: "Cancelado", tone: "red" },
};

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
        const est = ESTADO_LABEL[pedido.estado];
        return (
          <Card key={pedido.id}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Pedido #{pedido.numeroSesion}
                </span>
                <Badge tone={est.tone}>{est.label}</Badge>
              </div>
              <ul className="space-y-1 text-sm">
                {pedido.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span className="text-slate-700">
                      {it.cantidad}×{" "}
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
                    <span className="shrink-0 text-slate-500">
                      {formatStr(it.precioUnitarioCongelado)} ×{it.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
              {pedido.estado === "CANCELADO" && pedido.canceladoMotivo && (
                <p className="text-xs text-red-500">Motivo: {pedido.canceladoMotivo}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
