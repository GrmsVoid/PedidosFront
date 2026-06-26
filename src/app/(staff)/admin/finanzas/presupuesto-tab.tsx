"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import { inputCls } from "./rango";

type Estado = "sin" | "ok" | "alerta" | "excedido";
type CatPres = {
  categoriaId: string;
  nombre: string;
  presupuestoId: string | null;
  limite: string | null;
  gastado: string;
  restante: string | null;
  pct: number | null;
  estado: Estado;
};
type Resumen = {
  anio: number;
  mes: number;
  totalLimite: string;
  totalGastado: string;
  categorias: CatPres[];
};

const ESTADO_BADGE: Record<Estado, { tone: "slate" | "green" | "amber" | "red"; label: string }> = {
  sin: { tone: "slate", label: "sin presupuesto" },
  ok: { tone: "green", label: "en rango" },
  alerta: { tone: "amber", label: "≥ 80%" },
  excedido: { tone: "red", label: "excedido" },
};

const BAR: Record<Estado, string> = {
  sin: "bg-slate-300",
  ok: "bg-ink",
  alerta: "bg-amber-500",
  excedido: "bg-red-500",
};

function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PresupuestoTab() {
  const [mesStr, setMesStr] = useState(mesActual);
  const [data, setData] = useState<Resumen | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [anio, mes] = mesStr.split("-").map(Number);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<Resumen>(`/api/admin/finanzas/presupuestos?anio=${anio}&mes=${mes}`);
      setData(r);
      setEdits(Object.fromEntries(r.categorias.map((c) => [c.categoriaId, c.limite ?? ""])));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(c: CatPres) {
    const raw = (edits[c.categoriaId] ?? "").trim();
    setBusy(c.categoriaId);
    setError(null);
    try {
      if (raw && parseFloat(raw) > 0) {
        await api.put("/api/admin/finanzas/presupuestos", {
          categoriaId: c.categoriaId,
          anio,
          mes,
          montoLimite: (parseFloat(raw) || 0).toFixed(2),
        });
      } else if (c.presupuestoId) {
        await api.del(`/api/admin/finanzas/presupuestos/${c.presupuestoId}`);
      }
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Presupuesto</h1>
          <p className="text-sm text-slate-500">Límite mensual por categoría y avance del gasto.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Mes</span>
          <input type="month" value={mesStr} onChange={(e) => setMesStr(e.target.value)} className={inputCls} />
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data || loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Resumencito label="Presupuestado" value={fmt(data.totalLimite)} />
            <Resumencito label="Gastado" value={fmt(data.totalGastado)} />
            <Resumencito
              label="Disponible"
              value={fmt((Number(data.totalLimite) - Number(data.totalGastado)).toFixed(2))}
              tone={Number(data.totalGastado) > Number(data.totalLimite) ? "red" : "green"}
            />
          </div>

          <div className="space-y-2">
            {data.categorias.map((c) => {
              const badge = ESTADO_BADGE[c.estado];
              const ancho = c.pct === null ? 0 : Math.min(100, c.pct);
              return (
                <Card key={c.categoriaId}>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{c.nombre}</span>
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </div>
                      <span className="text-sm tabular-nums text-slate-500">
                        {fmt(c.gastado)}
                        {c.limite && <span className="text-slate-400"> / {fmt(c.limite)}</span>}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={cn("h-2 rounded-full transition-all", BAR[c.estado])}
                        style={{ width: `${ancho}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {c.estado === "sin"
                          ? "Define un límite para hacer seguimiento."
                          : c.restante && Number(c.restante) >= 0
                            ? `Quedan ${fmt(c.restante)} · ${c.pct}% usado`
                            : `Excedido en ${fmt((Number(c.gastado) - Number(c.limite ?? "0")).toFixed(2))}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            S/
                          </span>
                          <input
                            value={edits[c.categoriaId] ?? ""}
                            onChange={(e) =>
                              setEdits((p) => ({ ...p, [c.categoriaId]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && guardar(c)}
                            inputMode="decimal"
                            placeholder="0.00"
                            className={cn(inputCls, "w-28 pl-8")}
                          />
                        </div>
                        <button
                          onClick={() => guardar(c)}
                          disabled={busy === c.categoriaId}
                          className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-sm font-medium text-white transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60"
                        >
                          <Check className="h-4 w-4" /> Guardar
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Resumencito({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-sm text-slate-500">{label}</div>
        <div
          className={cn(
            "mt-1 font-display text-xl font-semibold tracking-tight",
            tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-600" : "text-slate-900",
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
