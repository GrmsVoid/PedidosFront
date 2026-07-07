"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Receipt, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveDot } from "@/components/ui/live-dot";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { usePoll } from "@/lib/use-poll";
import { useRealtime } from "@/lib/realtime";
import { notify } from "@/lib/notify";
import { centsToStr, fmt, strToCents } from "@/lib/money";

type Metodo = "EFECTIVO" | "YAPE" | "POS";

const METODOS: Array<{ id: Metodo; label: string; icon: typeof Banknote }> = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "YAPE", label: "Yape", icon: Smartphone },
  { id: "POS", label: "POS", icon: CreditCard },
];

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
        producto: { nombre: string } | null;
        nombreCongelado: string | null;
        modificadores: { nombreCongelado: string }[];
      }[];
    }[];
    pagos: { id: string; metodo: Metodo; monto: string; comensalNum: number | null }[];
  };
  total: string;
  restante: string;
};

export default function CajaPage() {
  // Los pedidos LISTO/ENTREGADO no llegan a la room "caja": el polling a 8 s
  // mantiene fresca la lista; el socket empuja cuentas y pagos al instante.
  const lista = usePoll<SesionLista[]>(
    () => api.get<SesionLista[]>("/api/caja/sesiones-por-cobrar"),
    8000,
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

  const { conectado } = useRealtime(["caja"], { staff: true }, (ev) => {
    if (ev === "evento:pedir_cuenta") {
      notify("Una mesa pide la cuenta");
      lista.reload();
    } else if (ev === "pago:registrado" || ev === "sesion:cerrada") {
      lista.reload();
      if (selId) cargarCuenta(selId);
    }
  });

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
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Lista */}
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Caja</h1>
          <LiveDot conectado={conectado} />
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {sesiones.length === 0 ? "Sin cuentas pendientes" : `${sesiones.length} por cobrar`}
        </p>
        {!lista.cargado ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : sesiones.length === 0 ? (
          <p className="text-sm text-slate-400">No hay cuentas pendientes.</p>
        ) : (
          <div className="space-y-2">
            {sesiones.map((s) => {
              const pagado = s.pagos.reduce((a, p) => a + strToCents(p.monto), 0);
              const activa = selId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelId(s.id)}
                  className={cn(
                    "w-full rounded-2xl border bg-white p-3.5 text-left transition-all duration-150 active:scale-[0.99]",
                    activa
                      ? "border-ink shadow-soft ring-1 ring-ink"
                      : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Mesa {s.mesas.map((m) => m.mesa.codigo).join(" + ")}
                    </span>
                    <Badge tone="blue">{s.pedidos.length} ped.</Badge>
                  </div>
                  {pagado > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pagos parciales registrados
                    </p>
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
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Receipt className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm">Selecciona una cuenta para cobrar.</p>
          </div>
        ) : (
          <Card className="animate-fade-up">
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                {cuenta.sesion.pedidos
                  .filter((p) => p.estado !== "CANCELADO")
                  .flatMap((p) => p.items)
                  .map((it) => (
                    <div key={it.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-slate-700">
                        <span className="tabular-nums">{it.cantidad}×</span>{" "}
                        {it.producto?.nombre ?? it.nombreCongelado ?? "Ítem"}
                        {it.modificadores.length > 0 && (
                          <span className="text-slate-400">
                            {" "}
                            ({it.modificadores.map((m) => m.nombreCongelado).join(", ")})
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">
                        {fmt(it.precioUnitarioCongelado)} ×{it.cantidad}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="space-y-1 border-t border-dashed border-slate-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-medium tabular-nums">{fmt(cuenta.total)}</span>
                </div>
                {cuenta.sesion.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-500">
                    <span>Pago · {p.metodo}</span>
                    <span className="tabular-nums">− {fmt(p.monto)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-lg font-bold">
                  <span>Restante</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      restanteCents <= 0 ? "text-emerald-600" : "text-slate-900",
                    )}
                  >
                    {restanteCents <= 0 && <CheckCircle2 className="mr-1 inline h-5 w-5" />}
                    {fmt(cuenta.restante)}
                  </span>
                </div>
              </div>

              {restanteCents > 0 && (
                <div className="space-y-2.5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-100">
                  <div className="flex gap-2">
                    {METODOS.map((m) => {
                      const Icon = m.icon;
                      const activo = metodo === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMetodo(m.id)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-all duration-150 active:scale-95",
                            activo
                              ? "border-ink bg-ink text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          <Icon className="h-4 w-4" /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder={centsToStr(restanteCents)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums transition-colors placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                    <Button disabled={!monto} loading={busy} onClick={registrarPago} className="shrink-0">
                      <Banknote className="h-4 w-4" /> Cobrar
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Dividir:</span>
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => split(n)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 active:scale-95"
                      >
                        ÷{n}
                      </button>
                    ))}
                    <button
                      onClick={() => setMonto(centsToStr(restanteCents))}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 active:scale-95"
                    >
                      Todo
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button className="flex-1" disabled={restanteCents > 0} loading={busy} onClick={cerrar}>
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
