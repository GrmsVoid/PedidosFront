"use client";

import { useCallback, useState } from "react";
import { BellRing, Link2, Plus, ReceiptText, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { usePoll } from "@/lib/use-poll";
import { ManualOrderModal } from "@/components/menu/manual-order-modal";

type MesaEstado = "LIBRE" | "OCUPADA" | "UNIDA";
type Mesa = { id: string; codigo: string; estado: MesaEstado; capacidad: number };

type PedidoEstado = "CONFIRMADO" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO";
type MozoSesion = {
  id: string;
  mesas: { mesa: { id: string; codigo: string } }[];
  pedidos: {
    id: string;
    numeroSesion: number;
    estado: PedidoEstado;
    items: {
      id: string;
      cantidad: number;
      producto: { nombre: string };
      modificadores: { nombreCongelado: string }[];
    }[];
  }[];
  eventos: { id: string; tipo: string; creadoEn: string }[];
};

const MESA_TONE: Record<MesaEstado, string> = {
  LIBRE: "border-green-300 bg-green-50 text-green-700",
  OCUPADA: "border-blue-300 bg-blue-50 text-blue-700",
  UNIDA: "border-violet-300 bg-violet-50 text-violet-700",
};

export default function MozoPage() {
  const mesas = usePoll<Mesa[]>(() => api.get<Mesa[]>("/api/mozo/mesas"), 5000);
  const sesiones = usePoll<MozoSesion[]>(() => api.get<MozoSesion[]>("/api/mozo/sesiones"), 4000);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<{ sesionId: string; label: string } | null>(null);

  const refrescar = useCallback(async () => {
    await Promise.all([mesas.reload(), sesiones.reload()]);
  }, [mesas, sesiones]);

  function toggleSel(m: Mesa) {
    if (m.estado !== "LIBRE") return;
    setSel((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]));
  }

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await refrescar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Operación fallida");
    } finally {
      setBusy(null);
    }
  }

  async function unir() {
    if (sel.length < 2) return;
    const [first, ...rest] = sel;
    await run("unir", () =>
      api.post(`/api/mozo/mesas/${first}/unir`, { mesaIdsAdicionales: rest }),
    );
    setSel([]);
  }

  const eventosPendientes = (sesiones.data ?? []).flatMap((s) =>
    s.eventos.map((e) => ({ ...e, mesas: s.mesas.map((m) => m.mesa.codigo).join(" + ") })),
  );
  const pedidosAccionables = (sesiones.data ?? []).flatMap((s) =>
    s.pedidos
      .filter((p) => p.estado === "LISTO" || p.estado === "CONFIRMADO" || p.estado === "EN_PREPARACION")
      .map((p) => ({ ...p, mesas: s.mesas.map((m) => m.mesa.codigo).join(" + ") })),
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Eventos pendientes */}
      {eventosPendientes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Atención</h2>
          <div className="space-y-2">
            {eventosPendientes.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    {e.tipo === "LLAMAR_MOZO" ? (
                      <BellRing className="h-5 w-5 text-amber-500" />
                    ) : (
                      <ReceiptText className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="text-sm font-medium text-slate-800">
                      Mesa {e.mesas} ·{" "}
                      {e.tipo === "LLAMAR_MOZO" ? "Llama al mozo" : "Pide la cuenta"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={busy === e.id}
                    onClick={() => run(e.id, () => api.post(`/api/mozo/evento/${e.id}/atender`))}
                  >
                    Atender
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Grilla de mesas */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Mesas</h2>
          {sel.length >= 2 && (
            <Button size="sm" disabled={busy === "unir"} onClick={unir}>
              <Link2 className="h-4 w-4" /> Unir {sel.length} mesas
            </Button>
          )}
        </div>
        {!mesas.cargado ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(mesas.data ?? []).map((m) => (
              <button
                key={m.id}
                onClick={() => toggleSel(m)}
                className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  MESA_TONE[m.estado],
                  sel.includes(m.id) && "ring-2 ring-slate-900",
                  m.estado !== "LIBRE" && "cursor-default",
                )}
              >
                <div className="font-bold">{m.codigo}</div>
                <div className="text-[11px] uppercase tracking-wide">{m.estado}</div>
                {m.estado === "UNIDA" && (
                  <span
                    onClick={(ev) => {
                      ev.stopPropagation();
                      run(m.id, () => api.post(`/api/mozo/mesas/${m.id}/separar`));
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] underline"
                  >
                    <Unlink className="h-3 w-3" /> separar
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Toca mesas libres para seleccionarlas y unirlas.
        </p>
      </section>

      {/* Sesiones abiertas → pedido manual */}
      {(sesiones.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Sesiones abiertas</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(sesiones.data ?? []).map((s) => {
              const label = s.mesas.map((m) => m.mesa.codigo).join(" + ");
              return (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm font-medium text-slate-800">Mesa {label}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManual({ sesionId: s.id, label })}
                    >
                      <Plus className="h-4 w-4" /> Pedido manual
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Pedidos en curso */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Pedidos en curso</h2>
        {pedidosAccionables.length === 0 ? (
          <p className="text-sm text-slate-400">Sin pedidos activos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {pedidosAccionables.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Mesa {p.mesas} · #{p.numeroSesion}
                    </span>
                    <Badge
                      tone={
                        p.estado === "LISTO" ? "green" : p.estado === "EN_PREPARACION" ? "amber" : "blue"
                      }
                    >
                      {p.estado}
                    </Badge>
                  </div>
                  <ul className="text-sm text-slate-600">
                    {p.items.map((it) => (
                      <li key={it.id}>
                        {it.cantidad}× {it.producto.nombre}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    {p.estado === "LISTO" && (
                      <Button
                        size="sm"
                        disabled={busy === p.id}
                        onClick={() =>
                          run(p.id, () => api.patch(`/api/mozo/pedido/${p.id}/entregado`))
                        }
                      >
                        Entregar
                      </Button>
                    )}
                    {p.estado !== "LISTO" && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy === p.id}
                        onClick={() => {
                          const motivo = window.prompt("Motivo de cancelación:");
                          if (!motivo || motivo.trim().length < 3) return;
                          run(p.id, () =>
                            api.patch(`/api/mozo/pedido/${p.id}/cancelar`, { motivo }),
                          );
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {manual && (
        <ManualOrderModal
          sesionId={manual.sesionId}
          mesaLabel={manual.label}
          onClose={() => setManual(null)}
          onCreated={async () => {
            setManual(null);
            await refrescar();
          }}
        />
      )}
    </div>
  );
}
