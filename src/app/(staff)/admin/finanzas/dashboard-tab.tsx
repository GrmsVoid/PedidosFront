"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import { RangoBar, localToIso, nowLocal, startOfMonthLocal } from "./rango";

type Cat = { nombre: string; monto: string };
type Resumen = {
  ingresosCaja: string;
  ingresosExtra: string;
  ingresosTotal: string;
  egresos: string;
  ganancia: string;
  margen: number;
  pagosCount: number;
  egresosPorCategoria: Cat[];
  ingresosPorCategoria: Cat[];
  cancelados: { count: number; monto: string };
};

export function DashboardTab() {
  const [desde, setDesde] = useState(startOfMonthLocal);
  const [hasta, setHasta] = useState(nowLocal);
  const [data, setData] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `desde=${encodeURIComponent(localToIso(desde))}&hasta=${encodeURIComponent(localToIso(hasta))}`;
      setData(await api.get<Resumen>(`/api/admin/finanzas/resumen?${qs}`));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gananciaPos = data ? Number(data.ganancia) >= 0 : true;
  const maxEgreso = data ? Math.max(1, ...data.egresosPorCategoria.map((c) => Number(c.monto))) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Ingresos, egresos y ganancia del periodo.</p>
        </div>
        <RangoBar desde={desde} hasta={hasta} setDesde={setDesde} setHasta={setHasta} onApply={cargar} loading={loading} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={TrendingUp} label="Ingresos" value={fmt(data.ingresosTotal)} hint={`Caja ${fmt(data.ingresosCaja)} · Extra ${fmt(data.ingresosExtra)}`} />
            <Kpi icon={TrendingDown} label="Egresos" value={fmt(data.egresos)} hint={`${data.egresosPorCategoria.length} categorías`} />
            <Card className={gananciaPos ? "bg-ink text-white" : "bg-red-600 text-white"}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Wallet className="h-4 w-4" /> Ganancia
                </div>
                <div className="mt-1 font-display text-3xl font-semibold tracking-tight">{fmt(data.ganancia)}</div>
                <div className="mt-1 text-sm text-white/60">Margen {data.margen}%</div>
              </CardContent>
            </Card>
            <Kpi icon={Ban} label="Pedidos cancelados" value={String(data.cancelados.count)} hint={`${fmt(data.cancelados.monto)} no facturado`} tone="amber" />
          </div>

          {/* Desgloses */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-4 font-display font-semibold tracking-tight text-slate-900">Egresos por categoría</h3>
                {data.egresosPorCategoria.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin egresos en el periodo.</p>
                ) : (
                  <div className="space-y-3">
                    {data.egresosPorCategoria.map((c) => (
                      <div key={c.nombre}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-600">{c.nombre}</span>
                          <span className="font-medium tabular-nums text-slate-900">{fmt(c.monto)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-ink" style={{ width: `${(Number(c.monto) / maxEgreso) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-4 font-display font-semibold tracking-tight text-slate-900">Ingresos</h3>
                <div className="space-y-2 text-sm">
                  <Row label={`Ventas en caja (${data.pagosCount} pagos)`} value={fmt(data.ingresosCaja)} />
                  {data.ingresosPorCategoria.map((c) => (
                    <Row key={c.nombre} label={c.nombre} value={fmt(c.monto)} muted />
                  ))}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{fmt(data.ingresosTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: "amber";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={"flex items-center gap-2 text-sm " + (tone === "amber" ? "text-amber-600" : "text-slate-500")}>
          <Icon className="h-4 w-4" /> {label}
        </div>
        <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-slate-400" : "text-slate-600"}>{label}</span>
      <span className="tabular-nums text-slate-700">{value}</span>
    </div>
  );
}
