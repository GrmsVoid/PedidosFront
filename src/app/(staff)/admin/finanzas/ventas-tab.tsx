"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Receipt, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt, strToCents } from "@/lib/money";
import { RangoBar, localToIso, nowLocal, startOfMonthLocal } from "./rango";

type Metodo = "EFECTIVO" | "YAPE" | "POS";
type ItemC = {
  cantidad: number;
  nombre: string;
  esCombo: boolean;
  precioUnitario: string;
  subtotal: string;
  modificadores: string[];
  nota: string | null;
};
type PedidoC = {
  numeroSesion: number;
  origen: string;
  estado: string;
  confirmadoEn: string;
  items: ItemC[];
};
type Comprobante = {
  sesionId: string;
  mesas: string[];
  cerradaEn: string | null;
  estadoSesion: "CERRADA" | "FUGADA";
  itemsCount: number;
  consumo: string;
  total: string;
  sinPago: boolean;
  pagos: { metodo: Metodo; monto: string; comensalNum: number | null }[];
  estrellas: number | null;
  pedidos: PedidoC[];
};

const METODO_TONE: Record<Metodo, "green" | "violet" | "blue"> = {
  EFECTIVO: "green",
  YAPE: "violet",
  POS: "blue",
};

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VentasTab() {
  const [desde, setDesde] = useState(startOfMonthLocal);
  const [hasta, setHasta] = useState(nowLocal);
  const [data, setData] = useState<Comprobante[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `desde=${encodeURIComponent(localToIso(desde))}&hasta=${encodeURIComponent(localToIso(hasta))}`;
      setData(await api.get<Comprobante[]>(`/api/admin/reportes/comprobantes?${qs}`));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar el detalle de ventas");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCents = (data ?? []).reduce((a, c) => a + strToCents(c.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">Detalle de cada cuenta cobrada (comprobante por comprobante).</p>
        </div>
        <RangoBar desde={desde} hasta={hasta} setDesde={setDesde} setHasta={setHasta} onApply={cargar} loading={loading} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Receipt className="mb-2 h-10 w-10" />
          <p>No hay ventas cerradas en el periodo.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">
              <span className="font-display text-xl font-semibold text-slate-900">{data.length}</span> comprobantes
            </span>
            <span className="text-slate-500">
              Total cobrado{" "}
              <span className="font-display text-xl font-semibold text-slate-900">{fmt(String(totalCents / 100))}</span>
            </span>
          </div>

          {/* Lista de comprobantes */}
          <div className="space-y-2">
            {data.map((c) => {
              const open = abierto === c.sesionId;
              return (
                <Card key={c.sesionId} className="overflow-hidden">
                  <button
                    onClick={() => setAbierto(open ? null : c.sesionId)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <Receipt className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">Mesa {c.mesas.join(" + ") || "—"}</span>
                        {c.estrellas != null && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400" /> {c.estrellas}
                          </span>
                        )}
                        {c.estadoSesion === "FUGADA" && <Badge tone="red">Fugada / cortesía</Badge>}
                      </div>
                      <p className="text-xs text-slate-400">
                        {fechaCorta(c.cerradaEn)} · {c.itemsCount} ítems
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {c.pagos.map((p, i) => (
                        <Badge key={i} tone={METODO_TONE[p.metodo]}>
                          {p.metodo}
                        </Badge>
                      ))}
                    </div>
                    <span className="w-20 shrink-0 text-right font-display text-lg font-semibold tabular-nums text-slate-900">
                      {fmt(c.total)}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
                  </button>

                  {open && (
                    <CardContent className="border-t border-slate-100 bg-slate-50/50 pt-4">
                      {c.pedidos.map((p) => (
                        <div key={p.numeroSesion} className="mb-3 last:mb-0">
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Pedido #{p.numeroSesion}
                            <span className="lowercase">· {p.origen}</span>
                            {p.estado === "CANCELADO" && <Badge tone="red">Cancelado</Badge>}
                          </div>
                          <div className="space-y-1">
                            {p.items.map((it, i) => (
                              <div key={i} className={cn("flex justify-between gap-3 text-sm", p.estado === "CANCELADO" && "text-slate-400 line-through")}>
                                <span className="min-w-0 text-slate-700">
                                  {it.cantidad}× {it.nombre}
                                  {it.esCombo && <span className="ml-1 text-xs text-amber-600">(combo)</span>}
                                  {it.modificadores.length > 0 && (
                                    <span className="text-slate-400"> · {it.modificadores.join(", ")}</span>
                                  )}
                                  {it.nota && <span className="block text-xs italic text-slate-400">“{it.nota}”</span>}
                                </span>
                                <span className="shrink-0 tabular-nums text-slate-500">
                                  {fmt(it.precioUnitario)} × {it.cantidad} = <span className="font-medium text-slate-700">{fmt(it.subtotal)}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Pagos */}
                      <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
                        {c.pagos.length === 0 ? (
                          <p className="text-slate-400">Cerrada sin pago — consumo {fmt(c.consumo)} no facturado.</p>
                        ) : (
                          c.pagos.map((p, i) => (
                            <div key={i} className="flex justify-between text-slate-500">
                              <span>
                                Pago · {p.metodo}
                                {p.comensalNum != null && ` · comensal ${p.comensalNum}`}
                              </span>
                              <span className="tabular-nums">{fmt(p.monto)}</span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-900">
                          <span>Total cobrado</span>
                          <span className="tabular-nums">{fmt(c.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
