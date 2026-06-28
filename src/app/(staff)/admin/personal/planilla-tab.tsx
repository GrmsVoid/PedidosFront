"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import { inputCls } from "../finanzas/rango";

type Tipo = "FIJO_MENSUAL" | "POR_HORA" | "POR_TURNO";
type Linea = {
  usuarioId: string;
  nombre: string;
  tipoRemuneracion: Tipo;
  base: string;
  turnos: number;
  horas: string;
  monto: string;
};
type Planilla = {
  estado: "BORRADOR" | "CERRADA";
  anio: number;
  mes: number;
  periodoId: string | null;
  egresoId: string | null;
  generadoEn: string | null;
  total: string;
  lineas: Linea[];
};

const TIPO_LABEL: Record<Tipo, string> = {
  FIJO_MENSUAL: "Sueldo fijo",
  POR_HORA: "Por hora",
  POR_TURNO: "Por turno",
};

function baseTexto(l: Linea): string {
  if (l.tipoRemuneracion === "FIJO_MENSUAL") return `${fmt(l.base)}/mes`;
  if (l.tipoRemuneracion === "POR_HORA") return `${fmt(l.base)}/h`;
  return `${fmt(l.base)}/turno`;
}

function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PlanillaTab() {
  const [mesStr, setMesStr] = useState(mesActual);
  const [data, setData] = useState<Planilla | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [anio, mes] = mesStr.split("-").map(Number);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<Planilla>(`/api/admin/planilla?anio=${anio}&mes=${mes}`));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar la planilla");
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cerrar() {
    if (!window.confirm(`¿Cerrar la planilla de ${String(mes).padStart(2, "0")}/${anio}? Se generará un egreso por el total.`))
      return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/admin/planilla/cerrar", { anio, mes });
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cerrar");
    } finally {
      setBusy(false);
    }
  }

  async function reabrir() {
    if (!data?.periodoId) return;
    if (!window.confirm("¿Reabrir la planilla? Se eliminará el egreso generado.")) return;
    setBusy(true);
    setError(null);
    try {
      await api.del(`/api/admin/planilla/${data.periodoId}`);
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo reabrir");
    } finally {
      setBusy(false);
    }
  }

  const cerrada = data?.estado === "CERRADA";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Planilla</h1>
          <p className="text-sm text-slate-500">Pago del personal calculado desde turnos y remuneración.</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={cerrada ? "green" : "amber"}>{cerrada ? "Cerrada" : "Borrador"}</Badge>
            {cerrada ? (
              <Button variant="outline" disabled={busy} onClick={reabrir}>
                <RotateCcw className="h-4 w-4" /> Reabrir
              </Button>
            ) : (
              <Button disabled={busy || data.lineas.length === 0} onClick={cerrar}>
                <Lock className="h-4 w-4" /> Cerrar planilla del mes
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-medium">Persona</th>
                    <th className="px-4 py-3 font-medium">Remuneración</th>
                    <th className="px-4 py-3 text-right font-medium">Turnos</th>
                    <th className="px-4 py-3 text-right font-medium">Horas</th>
                    <th className="px-4 py-3 text-right font-medium">A pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No hay personal activo este mes.
                      </td>
                    </tr>
                  ) : (
                    data.lineas.map((l) => (
                      <tr key={l.usuarioId} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{l.nombre}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {TIPO_LABEL[l.tipoRemuneracion]} · {baseTexto(l)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {l.tipoRemuneracion === "POR_TURNO" ? l.turnos : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {l.tipoRemuneracion === "POR_HORA" ? Number(l.horas).toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{fmt(l.monto)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-3 text-right font-medium text-slate-500">
                      Total planilla
                    </td>
                    <td className="px-4 py-3 text-right font-display text-lg font-semibold tabular-nums text-slate-900">
                      {fmt(data.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400">
            {cerrada
              ? "Planilla cerrada: el total se registró como egreso en la categoría “Planilla”. Reábrela para anularlo y recalcular."
              : "Borrador en vivo: cambia con los turnos. Al cerrar se genera el egreso del mes."}
          </p>
        </>
      )}
    </div>
  );
}
