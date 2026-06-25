"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";

type Ventas = { sesiones: number; total: string; ticketPromedio: string };
type Top = { productoId: string; nombre: string; cantidadTotal: number }[];
type Horas = Record<string, number>;
type Satisfaccion = { total: number; promedio: number; distribucion: Record<string, number> };

function localToIso(local: string): string {
  return new Date(local).toISOString();
}

function defaultDesde(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toLocalInput(d);
}
function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function ReportesTab() {
  const [desde, setDesde] = useState(defaultDesde());
  const [hasta, setHasta] = useState(toLocalInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ventas, setVentas] = useState<Ventas | null>(null);
  const [top, setTop] = useState<Top | null>(null);
  const [horas, setHoras] = useState<Horas | null>(null);
  const [satis, setSatis] = useState<Satisfaccion | null>(null);

  const generar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `desde=${encodeURIComponent(localToIso(desde))}&hasta=${encodeURIComponent(localToIso(hasta))}`;
      const [v, t, h, s] = await Promise.all([
        api.get<Ventas>(`/api/admin/reportes/ventas?${qs}`),
        api.get<Top>(`/api/admin/reportes/top-productos?${qs}&limit=10`),
        api.get<Horas>(`/api/admin/reportes/horas-pico?${qs}`),
        api.get<Satisfaccion>(`/api/admin/reportes/satisfaccion?${qs}`),
      ]);
      setVentas(v);
      setTop(t);
      setHoras(h);
      setSatis(s);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Error al generar reportes");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    generar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxHora = horas ? Math.max(1, ...Object.values(horas)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
          <input
            type="datetime-local"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
          <input
            type="datetime-local"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <Button onClick={generar} disabled={loading}>
          {loading ? "Generando…" : "Generar"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !ventas ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ventas && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-3 font-semibold text-slate-900">Ventas</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Metric label="Sesiones" value={String(ventas.sesiones)} />
                  <Metric label="Total" value={fmt(ventas.total)} />
                  <Metric label="Ticket prom." value={fmt(ventas.ticketPromedio)} />
                </div>
              </CardContent>
            </Card>
          )}

          {satis && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-3 font-semibold text-slate-900">Satisfacción</h3>
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-amber-500">
                    {satis.promedio.toFixed(1)}
                  </span>
                  <span className="text-slate-400">★ · {satis.total} encuestas</span>
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = satis.distribucion[String(n)] ?? 0;
                    const pct = satis.total ? (c / satis.total) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-slate-500">{n}★</span>
                        <div className="h-2 flex-1 rounded bg-slate-100">
                          <div className="h-2 rounded bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-slate-400">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {top && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-3 font-semibold text-slate-900">Top productos</h3>
                {top.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin datos en el rango.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {top.map((p, i) => (
                      <li key={p.productoId} className="flex justify-between text-sm">
                        <span className="text-slate-700">
                          {i + 1}. {p.nombre}
                        </span>
                        <span className="font-medium text-slate-500">{p.cantidadTotal} u.</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}

          {horas && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-3 font-semibold text-slate-900">Horas pico</h3>
                <div className="flex h-32 items-end gap-0.5">
                  {Array.from({ length: 24 }, (_, h) => {
                    const c = horas[String(h)] ?? 0;
                    return (
                      <div key={h} className="flex flex-1 flex-col items-center justify-end">
                        <div
                          className="w-full rounded-t bg-slate-800"
                          style={{ height: `${(c / maxHora) * 100}%` }}
                          title={`${h}:00 · ${c}`}
                        />
                        {h % 6 === 0 && <span className="mt-1 text-[9px] text-slate-400">{h}h</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-3">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
