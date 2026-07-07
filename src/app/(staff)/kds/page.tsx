"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Coffee, Flame, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveDot } from "@/components/ui/live-dot";
import { cn } from "@/lib/cn";
import { api } from "@/lib/client-api";
import { usePoll } from "@/lib/use-poll";
import { useRealtime } from "@/lib/realtime";
import { notify } from "@/lib/notify";

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

/** Urgencia por tiempo en cola: verde <5 min, ámbar 5–10, rojo >10. */
function urgencia(confirmadoEn: string, now: number) {
  const min = (now - new Date(confirmadoEn).getTime()) / 60_000;
  if (min >= 10) return { nivel: 2, label: `${Math.floor(min)} min`, cls: "text-red-600" };
  if (min >= 5) return { nivel: 1, label: `${Math.floor(min)} min`, cls: "text-amber-600" };
  return { nivel: 0, label: min < 1 ? "recién" : `${Math.floor(min)} min`, cls: "text-slate-400" };
}

export default function KdsPage() {
  // El socket empuja los cambios al instante; el polling queda de respaldo.
  const cola = usePoll<Cola>(() => api.get<Cola>("/api/kds/cola"), 15000);
  const menu = usePoll<Menu>(() => api.get<Menu>("/api/menu"), 30000);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAgotados, setShowAgotados] = useState(false);
  const [now, setNow] = useState(Date.now());

  const { conectado } = useRealtime(["kds"], { staff: true }, (ev) => {
    if (ev === "pedido:creado") {
      notify("Nuevo pedido en cocina");
      cola.reload();
    } else if (ev === "pedido:estado" || ev === "pedido:cancelado") {
      cola.reload();
    }
  });

  // Tick para que la urgencia avance aunque la cola no cambie
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

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
  const nuevos = pedidos.filter((p) => p.estado === "CONFIRMADO").length;
  const productos = (menu.data?.categorias ?? []).flatMap((c) => c.productos);
  const agotados = productos.filter((p) => !p.disponible).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Cocina · Barra
            </h1>
            <LiveDot conectado={conectado} />
          </div>
          <p className="text-sm text-slate-500">
            {pedidos.length === 0
              ? "Cola vacía"
              : `${pedidos.length} en cola · ${nuevos} sin tomar`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAgotados((v) => !v)}>
          <Power className="h-4 w-4" /> Disponibilidad
          {agotados > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-semibold text-red-600">
              {agotados}
            </span>
          )}
        </Button>
      </div>

      {showAgotados && (
        <Card className="mb-5 animate-fade-up">
          <CardContent className="pt-4">
            <h2 className="mb-2.5 text-sm font-semibold text-slate-700">Marcar agotados</h2>
            <div className="flex flex-wrap gap-2">
              {productos.map((p) => (
                <button
                  key={p.id}
                  disabled={busy === p.id}
                  onClick={() => toggleDisponible(p.id, !p.disponible)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95",
                    p.disponible
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                      : "border-red-200 bg-red-50 text-red-600 hover:border-red-300",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      p.disponible ? "bg-emerald-500" : "bg-red-500",
                    )}
                  />
                  {p.nombre}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!cola.cargado ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Coffee className="h-7 w-7" />
          </span>
          <p className="mt-3 font-medium">Sin pedidos en cola</p>
          <p className="text-sm">Todo al día ☕</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidos.map((p) => {
            const urg = urgencia(p.confirmadoEn, now);
            return (
              <Card
                key={p.id}
                className={cn(
                  "animate-scale-in",
                  p.estado === "EN_PREPARACION" && "border-amber-300 ring-1 ring-inset ring-amber-200",
                  urg.nivel === 2 && "border-red-300 ring-1 ring-inset ring-red-200",
                )}
              >
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold tabular-nums text-slate-900">
                      #{p.numeroSesion}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {urg.nivel === 2 && (
                        <span title="Lleva demasiado en cola">
                          <Flame className="h-4 w-4 animate-pulse text-red-500" />
                        </span>
                      )}
                      <Badge tone={p.estado === "CONFIRMADO" ? "blue" : "amber"}>
                        {p.estado === "CONFIRMADO" ? "Nuevo" : "Preparando"}
                      </Badge>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {p.items.map((it) => (
                      <li key={it.id} className="text-sm">
                        <span className="font-medium text-slate-800">
                          <span className="tabular-nums">{it.cantidad}×</span>{" "}
                          {it.producto?.nombre ?? it.nombreCongelado ?? "Ítem"}
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
                          <span className="mt-0.5 block rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium italic text-amber-700">
                            “{it.notaLibre}”
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> ETA {etaLabel(p.etaSegundos)}
                    </span>
                    <span className={cn("font-semibold tabular-nums", urg.cls)}>
                      en cola {urg.label}
                    </span>
                  </div>
                  {p.estado === "CONFIRMADO" ? (
                    <Button
                      className="w-full"
                      loading={busy === p.id}
                      onClick={() => transicionar(p.id, "tomar")}
                    >
                      Tomar
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="secondary"
                      loading={busy === p.id}
                      onClick={() => transicionar(p.id, "listo")}
                    >
                      Marcar listo
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
