"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt, strToCents } from "@/lib/money";
import { RangoBar, inputCls, localToIso, nowLocal, startOfMonthLocal } from "./rango";

type Cat = { id: string; nombre: string };
type Movimiento = {
  id: string;
  monto: string;
  fecha: string;
  descripcion: string | null;
  origen?: "MANUAL" | "PLANILLA";
  categoria: { id: string; nombre: string };
};

/** Tabla genérica de movimientos (egresos o ingresos extra): rango, alta, baja y total. */
export function MovimientosTab({
  titulo,
  subtitulo,
  listEndpoint,
  catEndpoint,
}: {
  titulo: string;
  subtitulo: string;
  listEndpoint: string;
  catEndpoint: string;
}) {
  const [desde, setDesde] = useState(startOfMonthLocal);
  const [hasta, setHasta] = useState(nowLocal);
  const [cats, setCats] = useState<Cat[]>([]);
  const [list, setList] = useState<Movimiento[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [categoriaId, setCategoriaId] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(nowLocal);
  const [descripcion, setDescripcion] = useState("");

  const cargarCats = useCallback(async () => {
    try {
      const c = await api.get<Cat[]>(catEndpoint);
      setCats(c);
      setCategoriaId((prev) => prev || c[0]?.id || "");
    } catch {
      /* noop */
    }
  }, [catEndpoint]);

  const cargarLista = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `desde=${encodeURIComponent(localToIso(desde))}&hasta=${encodeURIComponent(localToIso(hasta))}`;
      setList(await api.get<Movimiento[]>(`${listEndpoint}?${qs}`));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, listEndpoint]);

  useEffect(() => {
    cargarCats();
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoriaId || !monto) return;
    setBusy("add");
    setError(null);
    try {
      await api.post(listEndpoint, {
        categoriaId,
        monto: (parseFloat(monto) || 0).toFixed(2),
        fecha: localToIso(fecha),
        descripcion: descripcion.trim() || undefined,
      });
      setMonto("");
      setDescripcion("");
      await cargarLista();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo registrar");
    } finally {
      setBusy(null);
    }
  }

  async function eliminar(id: string) {
    setBusy(id);
    setError(null);
    try {
      await api.del(`${listEndpoint}/${id}`);
      await cargarLista();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo eliminar");
    } finally {
      setBusy(null);
    }
  }

  const totalCents = (list ?? []).reduce((a, m) => a + strToCents(m.monto), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
          <p className="text-sm text-slate-500">{subtitulo}</p>
        </div>
        <RangoBar desde={desde} hasta={hasta} setDesde={setDesde} setHasta={setHasta} onApply={cargarLista} loading={loading} />
      </div>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={agregar} className="grid gap-2 sm:grid-cols-[1fr_120px_190px_auto]">
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputCls}>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" placeholder="Monto" className={inputCls} />
            <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
            <Button type="submit" disabled={busy === "add"}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (opcional)"
              className={inputCls + " sm:col-span-4"}
            />
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-500">Total del periodo</span>
        <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
          {fmt((totalCents / 100).toFixed(2))}
        </span>
      </div>

      {!list ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-400">Sin movimientos en el periodo.</p>
      ) : (
        <div className="space-y-2">
          {list.map((m) => {
            const planilla = m.origen === "PLANILLA";
            return (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{m.categoria.nombre}</span>
                      {planilla && <Badge tone="violet">planilla</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(m.fecha).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {m.descripcion && ` · ${m.descripcion}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium tabular-nums text-slate-900">{fmt(m.monto)}</span>
                    <button
                      disabled={busy === m.id || planilla}
                      onClick={() => eliminar(m.id)}
                      title={planilla ? "Generado por planilla" : "Eliminar"}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
