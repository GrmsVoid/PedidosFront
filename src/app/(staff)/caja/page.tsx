"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { usePoll } from "@/lib/use-poll";
import { centsToStr, fmt, strToCents } from "@/lib/money";

type Metodo = "EFECTIVO" | "YAPE" | "POS";

type SesionLista = {
  id: string;
  mesas: { mesa: { codigo: string } }[];
  pedidos: { estado: string }[];
  pagos: { monto: string }[];
};

type Cuenta = {
  sesion: {
    id: string;
    pedidos: {
      id: string;
      numeroSesion: number;
      estado: string;
      items: {
        id: string;
        cantidad: number;
        precioUnitarioCongelado: string;
        producto: { nombre: string };
        modificadores: { nombreCongelado: string }[];
      }[];
    }[];
    pagos: { id: string; metodo: Metodo; monto: string; comensalNum: number | null }[];
  };
  total: string;
  restante: string;
};

export default function CajaPage() {
  const lista = usePoll<SesionLista[]>(
    () => api.get<SesionLista[]>("/api/caja/sesiones-por-cobrar"),
    5000,
  );
  const [selId, setSelId] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("EFECTIVO");
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarCuenta = useCallback(async (id: string) => {
    setError(null);
    try {
      const c = await api.get<Cuenta>(`/api/caja/sesion/${id}/cuenta`);
      setCuenta(c);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar la cuenta");
    }
  }, []);

  useEffect(() => {
    if (selId) cargarCuenta(selId);
    else setCuenta(null);
  }, [selId, cargarCuenta]);

  const sesiones = lista.data ?? [];
  const restanteCents = cuenta ? strToCents(cuenta.restante) : 0;

  function split(n: number) {
    if (!cuenta) return;
    setMonto(centsToStr(Math.floor(restanteCents / n)));
  }

  async function registrarPago() {
    if (!selId || !cuenta) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(
        `/api/caja/sesion/${selId}/pago`,
        { metodo, monto, comensalNum: null },
        { idempotencyKey: crypto.randomUUID() },
      );
      setMonto("");
      await cargarCuenta(selId);
      await lista.reload();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo registrar el pago");
    } finally {
      setBusy(false);
    }
  }

  async function cerrar() {
    if (!selId) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/caja/sesion/${selId}/cerrar`);
      setSelId(null);
      await lista.reload();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cerrar");
    } finally {
      setBusy(false);
    }
  }

  async function cerrarSinPago() {
    if (!selId) return;
    const motivo = window.prompt("Motivo del cierre sin pago (mesa fugada, cortesía…):");
    if (!motivo || motivo.trim().length < 3) return;
    setBusy(true);
    try {
      await api.post(`/api/caja/sesion/${selId}/cerrar-sin-pago`, { motivo });
      setSelId(null);
      await lista.reload();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cerrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Lista */}
      <div>
        <h1 className="mb-3 text-xl font-bold text-slate-900">Por cobrar</h1>
        {!lista.cargado ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : sesiones.length === 0 ? (
          <p className="text-sm text-slate-400">No hay cuentas pendientes.</p>
        ) : (
          <div className="space-y-2">
            {sesiones.map((s) => {
              const pagado = s.pagos.reduce((a, p) => a + strToCents(p.monto), 0);
              return (
                <button
                  key={s.id}
                  onClick={() => setSelId(s.id)}
                  className={
                    "w-full rounded-xl border p-3 text-left transition-colors " +
                    (selId === s.id
                      ? "border-slate-900 bg-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      Mesa {s.mesas.map((m) => m.mesa.codigo).join(" + ")}
                    </span>
                    <Badge tone="blue">{s.pedidos.length} ped.</Badge>
                  </div>
                  {pagado > 0 && (
                    <p className="mt-1 text-xs text-slate-400">Pagos parciales registrados</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detalle */}
      <div>
        {!cuenta ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-slate-400">
            <Receipt className="mb-2 h-10 w-10" />
            <p>Selecciona una cuenta para cobrar.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1">
                {cuenta.sesion.pedidos
                  .filter((p) => p.estado !== "CANCELADO")
                  .flatMap((p) => p.items)
                  .map((it) => (
                    <div key={it.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-slate-700">
                        {it.cantidad}× {it.producto.nombre}
                        {it.modificadores.length > 0 && (
                          <span className="text-slate-400">
                            {" "}
                            ({it.modificadores.map((m) => m.nombreCongelado).join(", ")})
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        {fmt(it.precioUnitarioCongelado)} ×{it.cantidad}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-medium">{fmt(cuenta.total)}</span>
                </div>
                {cuenta.sesion.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-500">
                    <span>Pago · {p.metodo}</span>
                    <span>− {fmt(p.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-bold">
                  <span>Restante</span>
                  <span className={restanteCents <= 0 ? "text-green-600" : "text-slate-900"}>
                    {fmt(cuenta.restante)}
                  </span>
                </div>
              </div>

              {restanteCents > 0 && (
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <div className="flex gap-2">
                    {(["EFECTIVO", "YAPE", "POS"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetodo(m)}
                        className={
                          "flex-1 rounded-md border px-2 py-1.5 text-sm font-medium " +
                          (metodo === m
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600")
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder={centsToStr(restanteCents)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                    <Button
                      disabled={busy || !monto}
                      onClick={registrarPago}
                      className="shrink-0"
                    >
                      <Banknote className="h-4 w-4" /> Cobrar
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Dividir:</span>
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => split(n)}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 hover:bg-slate-100"
                      >
                        ÷{n}
                      </button>
                    ))}
                    <button
                      onClick={() => setMonto(centsToStr(restanteCents))}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 hover:bg-slate-100"
                    >
                      Todo
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={busy || restanteCents > 0}
                  onClick={cerrar}
                >
                  {restanteCents > 0 ? "Falta cobrar para cerrar" : "Cerrar cuenta"}
                </Button>
                <Button variant="ghost" disabled={busy} onClick={cerrarSinPago}>
                  Sin pago
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
