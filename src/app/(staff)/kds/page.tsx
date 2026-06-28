"use client";

import { useCallback, useState } from "react";
import { Clock, Coffee, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/client-api";
import { usePoll } from "@/lib/use-poll";

type ColaItem = {
  id: string;
  cantidad: number;
  notaLibre: string | null;
  producto: { nombre: string } | null;
  nombreCongelado: string | null;
  combo: { items: { cantidad: number; producto: { nombre: string } }[] } | null;
  modificadores: { nombreCongelado: string }[];
};
type ColaPedido = {
  id: string;
  numeroSesion: number;
  estado: "CONFIRMADO" | "EN_PREPARACION";
  confirmadoEn: string;
  etaSegundos: number;
  items: ColaItem[];
};
type Cola = { pedidos: ColaPedido[] };

type MenuProd = { id: string; nombre: string; disponible: boolean };
type Menu = { categorias: { productos: MenuProd[] }[] };

function etaLabel(seg: number): string {
  if (seg <= 0) return "cualquier momento";
  return `~${Math.ceil(seg / 60)} min`;
}

export default function KdsPage() {
  const cola = usePoll<Cola>(() => api.get<Cola>("/api/kds/cola"), 4000);
  const menu = usePoll<Menu>(() => api.get<Menu>("/api/menu"), 15000);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAgotados, setShowAgotados] = useState(false);

  const transicionar = useCallback(
    async (pedidoId: string, accion: "tomar" | "listo") => {
      setBusy(pedidoId);
      try {
        await api.patch(`/api/kds/pedido/${pedidoId}/${accion}`);
        await cola.reload();
      } finally {
        setBusy(null);
      }
    },
    [cola],
  );

  const toggleDisponible = useCallback(
    async (productoId: string, disponible: boolean) => {
      setBusy(productoId);
      try {
        await api.patch(`/api/kds/producto/${productoId}/disponibilidad`, { disponible });
        await menu.reload();
      } finally {
        setBusy(null);
      }
    },
    [menu],
  );

  const pedidos = cola.data?.pedidos ?? [];
  const productos = (menu.data?.categorias ?? []).flatMap((c) => c.productos);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cocina · Barra</h1>
        <Button variant="outline" size="sm" onClick={() => setShowAgotados((v) => !v)}>
          <Power className="h-4 w-4" /> Disponibilidad
        </Button>
      </div>

      {showAgotados && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Marcar agotados</h2>
            <div className="flex flex-wrap gap-2">
              {productos.map((p) => (
                <button
                  key={p.id}
                  disabled={busy === p.id}
                  onClick={() => toggleDisponible(p.id, !p.disponible)}
                  className={
                    "rounded-full border px-3 py-1 text-sm transition-colors " +
                    (p.disponible
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-red-300 bg-red-50 text-red-600")
                  }
                >
                  {p.nombre} · {p.disponible ? "disponible" : "agotado"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!cola.cargado ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Coffee className="mb-2 h-10 w-10" />
          <p>Sin pedidos en cola. Todo al día ☕</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((p) => (
            <Card key={p.id} className={p.estado === "EN_PREPARACION" ? "ring-2 ring-amber-300" : ""}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">#{p.numeroSesion}</span>
                  <Badge tone={p.estado === "CONFIRMADO" ? "blue" : "amber"}>
                    {p.estado === "CONFIRMADO" ? "Nuevo" : "Preparando"}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {p.items.map((it) => (
                    <li key={it.id} className="text-sm">
                      <span className="font-medium text-slate-800">
                        {it.cantidad}× {it.producto?.nombre ?? it.nombreCongelado ?? "Ítem"}
                      </span>
                      {it.combo && (
                        <span className="block text-xs text-slate-500">
                          {it.combo.items.map((ci) => `${ci.cantidad}× ${ci.producto.nombre}`).join(", ")}
                        </span>
                      )}
                      {it.modificadores.length > 0 && (
                        <span className="block text-xs text-slate-500">
                          {it.modificadores.map((m) => m.nombreCongelado).join(", ")}
                        </span>
                      )}
                      {it.notaLibre && (
                        <span className="block text-xs italic text-amber-600">“{it.notaLibre}”</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> {etaLabel(p.etaSegundos)}
                </div>
                {p.estado === "CONFIRMADO" ? (
                  <Button
                    className="w-full"
                    disabled={busy === p.id}
                    onClick={() => transicionar(p.id, "tomar")}
                  >
                    Tomar
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="secondary"
                    disabled={busy === p.id}
                    onClick={() => transicionar(p.id, "listo")}
                  >
                    Marcar listo
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
