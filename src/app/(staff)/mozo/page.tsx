"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BookOpen, Globe, Link2, List, Map as MapIcon, Plus, ReceiptText, Unlink, X } from "lucide-react";
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
import { ManualOrderModal } from "@/components/menu/manual-order-modal";
import { SalonMapa } from "@/components/plano/salon-mapa";
import { pisoDeMesa, type Plano } from "@/components/plano/types";

type MesaEstado = "LIBRE" | "OCUPADA" | "UNIDA";
type Mesa = {
  id: string;
  codigo: string;
  estado: MesaEstado;
  capacidad: number;
  posicionX: number;
  posicionY: number;
  pisoId: string | null;
};

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
      producto: { nombre: string } | null;
      nombreCongelado: string | null;
      modificadores: { nombreCongelado: string }[];
    }[];
  }[];
  eventos: { id: string; tipo: string; creadoEn: string }[];
};

type PrePedido = {
  id: string;
  codigo: string;
  nombreCliente: string;
  telefono: string | null;
  total: string;
  creadoEn: string;
  itemsJson: Array<{
    cantidad: number;
    nombre: string;
    opcionesLabel: string;
    notaLibre: string | null;
    subtotal: string;
  }>;
  mesa: { codigo: string; estado: MesaEstado };
};

const MESA_STYLE: Record<MesaEstado, { tile: string; dot: string; label: string }> = {
  LIBRE: { tile: "border-emerald-200 bg-emerald-50/60 text-emerald-700", dot: "bg-emerald-500", label: "Libre" },
  OCUPADA: { tile: "border-sky-200 bg-sky-50/60 text-sky-700", dot: "bg-sky-500", label: "Ocupada" },
  UNIDA: { tile: "border-violet-200 bg-violet-50/60 text-violet-700", dot: "bg-violet-500", label: "Unida" },
};

export default function MozoPage() {
  // El socket empuja los cambios al instante; el polling queda de respaldo.
  const mesas = usePoll<Mesa[]>(() => api.get<Mesa[]>("/api/mozo/mesas"), 20000);
  const sesiones = usePoll<MozoSesion[]>(() => api.get<MozoSesion[]>("/api/mozo/sesiones"), 15000);
  const prePedidos = usePoll<PrePedido[]>(() => api.get<PrePedido[]>("/api/mozo/pre-pedidos"), 20000);

  const { conectado } = useRealtime(["mozos"], { staff: true }, (ev) => {
    switch (ev) {
      case "evento:llamar_mozo":
        notify("Una mesa llama al mozo");
        sesiones.reload();
        break;
      case "evento:pedir_cuenta":
        notify("Una mesa pide la cuenta");
        sesiones.reload();
        break;
      case "prepedido:nuevo":
        notify("Nuevo pedido web por confirmar");
        prePedidos.reload();
        break;
      case "prepedido:resuelto":
        prePedidos.reload();
        break;
      case "mesa:estado":
      case "sesion:cerrada":
        mesas.reload();
        sesiones.reload();
        break;
      case "pedido:estado":
      case "pedido:cancelado":
        sesiones.reload();
        break;
    }
  });
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<{ sesionId: string; label: string } | null>(null);
  const [sheet, setSheet] = useState<Mesa | null>(null);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [pisoSelId, setPisoSelId] = useState<string | null>(null);
  const [vista, setVista] = useState<"plano" | "lista">("lista");

  // El plano lo dibuja el admin; si existe, es la vista por defecto del salón.
  useEffect(() => {
    api
      .get<{ plano: Plano | null }>("/api/admin/plano")
      .then((r) => {
        if (r.plano && r.plano.pisos.length > 0) {
          setPlano(r.plano);
          setPisoSelId(r.plano.pisos[0].id);
          setVista("plano");
        }
      })
      .catch(() => {});
  }, []);

  const refrescar = useCallback(async () => {
    await Promise.all([mesas.reload(), sesiones.reload(), prePedidos.reload()]);
  }, [mesas, sesiones, prePedidos]);

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

  // Sesión abierta de cada mesa (para abrir la carta directo desde la mesa).
  const sesionPorMesa = new Map<string, { sesionId: string; label: string }>();
  for (const s of sesiones.data ?? []) {
    const label = s.mesas.map((m) => m.mesa.codigo).join(" + ");
    for (const m of s.mesas) sesionPorMesa.set(m.mesa.id, { sesionId: s.id, label });
  }

  // Toque en una mesa: en modo unión sigue seleccionando; si no, abre las acciones.
  function onMesa(m: Mesa) {
    if (sel.length > 0 && m.estado === "LIBRE") {
      toggleSel(m);
      return;
    }
    setSheet(m);
  }

  // "Tomar pedido" en una mesa libre: la abre (con hold de 5 min) y muestra la carta.
  async function tomarPedido(m: Mesa) {
    setBusy("abrir");
    setError(null);
    try {
      const r = await api.post<{ sesionId: string; mesaCodigo: string }>(
        `/api/mozo/mesas/${m.id}/abrir`,
      );
      setSheet(null);
      setManual({ sesionId: r.sesionId, label: r.mesaCodigo });
      await refrescar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo abrir la mesa");
      setSheet(null);
    } finally {
      setBusy(null);
    }
  }

  const listaMesas = mesas.data ?? [];
  const libres = listaMesas.filter((m) => m.estado === "LIBRE").length;
  const eventosPendientes = (sesiones.data ?? []).flatMap((s) =>
    s.eventos.map((e) => ({ ...e, mesas: s.mesas.map((m) => m.mesa.codigo).join(" + ") })),
  );
  const pedidosAccionables = (sesiones.data ?? []).flatMap((s) =>
    s.pedidos
      .filter((p) => p.estado === "LISTO" || p.estado === "CONFIRMADO" || p.estado === "EN_PREPARACION")
      .map((p) => ({ ...p, mesas: s.mesas.map((m) => m.mesa.codigo).join(" + ") })),
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Mozo</h1>
            <LiveDot conectado={conectado} />
          </div>
          <p className="text-sm text-slate-500">Mesas, pedidos y atención del salón.</p>
        </div>
        {mesas.cargado && (
          <div className="flex gap-2">
            <Badge tone="green">{libres} libres</Badge>
            <Badge tone="blue">{listaMesas.length - libres} en uso</Badge>
            {eventosPendientes.length > 0 && (
              <Badge tone="amber">{eventosPendientes.length} por atender</Badge>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Pedidos web por confirmar (el cliente eligió mesa desde la página pública) */}
      {(prePedidos.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <Globe className="h-5 w-5 text-sky-500" /> Pedidos web por confirmar
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            Pide el código al cliente (por teléfono o en persona) antes de aceptar: al aceptar, el
            pedido entra a cocina y la mesa se abre.
          </p>
          <div className="grid gap-2 lg:grid-cols-2">
            {(prePedidos.data ?? []).map((pp) => {
              const min = Math.max(0, Math.floor((Date.now() - new Date(pp.creadoEn).getTime()) / 60_000));
              const mesaLibre = pp.mesa.estado === "LIBRE";
              return (
                <Card key={pp.id} className="animate-fade-up border-sky-200 ring-1 ring-inset ring-sky-100">
                  <CardContent className="space-y-2.5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-ink px-2.5 py-1 font-display text-sm font-bold tracking-[0.2em] text-white">
                        {pp.codigo}
                      </span>
                      <span className="text-xs text-slate-400">
                        hace {min < 1 ? "un momento" : `${min} min`}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">
                        {pp.nombreCliente}
                        {pp.telefono && (
                          <span className="ml-2 font-normal text-slate-500">☎ {pp.telefono}</span>
                        )}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-slate-500">
                        Quiere la mesa <b className="text-slate-700">{pp.mesa.codigo}</b>
                        <Badge tone={mesaLibre ? "green" : "amber"}>
                          {mesaLibre ? "libre" : "ocupada ahora"}
                        </Badge>
                      </p>
                    </div>
                    <ul className="space-y-0.5 border-t border-slate-100 pt-2 text-sm text-slate-600">
                      {pp.itemsJson.map((it, i) => (
                        <li key={i}>
                          <span className="tabular-nums">{it.cantidad}×</span> {it.nombre}
                          {it.opcionesLabel && (
                            <span className="text-slate-400"> · {it.opcionesLabel}</span>
                          )}
                          {it.notaLibre && (
                            <span className="block text-xs italic text-amber-600">“{it.notaLibre}”</span>
                          )}
                        </li>
                      ))}
                      <li className="pt-1 font-semibold text-slate-900">Total S/ {pp.total}</li>
                    </ul>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        loading={busy === pp.id}
                        disabled={!mesaLibre}
                        onClick={() =>
                          run(pp.id, () => api.post(`/api/mozo/pre-pedido/${pp.id}/aceptar`))
                        }
                      >
                        Aceptar · a cocina
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === pp.id}
                        onClick={() =>
                          run(pp.id, () => api.post(`/api/mozo/pre-pedido/${pp.id}/rechazar`))
                        }
                      >
                        Rechazar
                      </Button>
                    </div>
                    {!mesaLibre && (
                      <p className="text-xs text-amber-600">
                        La mesa está en uso: espera a que se libere o rechaza para que elija otra.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Eventos pendientes */}
      {eventosPendientes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">Atención</h2>
          <div className="space-y-2">
            {eventosPendientes.map((e) => (
              <Card
                key={e.id}
                className="animate-fade-up border-amber-200 ring-1 ring-inset ring-amber-100"
              >
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 animate-pulse-ring items-center justify-center rounded-full",
                        e.tipo === "LLAMAR_MOZO" ? "bg-amber-100" : "bg-sky-100",
                      )}
                    >
                      {e.tipo === "LLAMAR_MOZO" ? (
                        <BellRing className="h-[18px] w-[18px] text-amber-600" />
                      ) : (
                        <ReceiptText className="h-[18px] w-[18px] text-sky-600" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Mesa {e.mesas}</p>
                      <p className="text-xs text-slate-500">
                        {e.tipo === "LLAMAR_MOZO" ? "Llama al mozo" : "Pide la cuenta"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    loading={busy === e.id}
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

      {/* Salón: plano a escala del local (o lista) */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Salón</h2>
          <div className="flex items-center gap-2">
            {sel.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setSel([])}>
                Cancelar
              </Button>
            )}
            {sel.length >= 2 && (
              <Button size="sm" loading={busy === "unir"} onClick={unir} className="animate-scale-in">
                <Link2 className="h-4 w-4" /> Unir {sel.length} mesas
              </Button>
            )}
            {plano && (
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                {(
                  [
                    { id: "plano", label: "Plano", icon: MapIcon },
                    { id: "lista", label: "Lista", icon: List },
                  ] as const
                ).map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVista(v.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
                        vista === v.id ? "bg-ink text-white shadow-sm" : "text-slate-500 hover:text-ink",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {v.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {!mesas.cargado ? (
          vista === "plano" && plano ? (
            <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[86px] rounded-2xl" />
              ))}
            </div>
          )
        ) : vista === "plano" && plano ? (
          <Card>
            <CardContent className="p-3 sm:p-4">
              {plano.pisos.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {plano.pisos.map((p) => {
                    const libres = listaMesas.filter(
                      (m) => pisoDeMesa(m, plano) === p.id && m.estado === "LIBRE",
                    ).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPisoSelId(p.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95",
                          (pisoSelId ?? plano.pisos[0].id) === p.id
                            ? "bg-ink text-white shadow-sm"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300",
                        )}
                      >
                        {p.nombre}
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] font-semibold",
                            (pisoSelId ?? plano.pisos[0].id) === p.id
                              ? "bg-white/20"
                              : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          {libres} libres
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {(() => {
                const piso =
                  plano.pisos.find((p) => p.id === pisoSelId) ?? plano.pisos[0];
                return (
                  <SalonMapa
                    piso={piso}
                    mesas={listaMesas.filter((m) => pisoDeMesa(m, plano) === piso.id)}
                    seleccion={sel}
                    onMesaClick={(m) => onMesa(m as Mesa)}
                  />
                );
              })()}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-400 bg-emerald-50" /> Libre
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-sky-400 bg-sky-50" /> Ocupada
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-violet-400 bg-violet-50" /> Unida
                </span>
                <span className="ml-auto">
                  {sel.length > 0
                    ? "Sigue tocando mesas libres para unirlas"
                    : "Toca una mesa para tomar el pedido o ver acciones"}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {listaMesas.map((m) => {
                const st = MESA_STYLE[m.estado];
                const seleccionada = sel.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => onMesa(m)}
                    className={cn(
                      "rounded-2xl border p-3 text-center transition-all duration-150",
                      st.tile,
                      "hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-95",
                      seleccionada && "ring-2 ring-ink ring-offset-2",
                    )}
                  >
                    <div className="text-lg font-bold tabular-nums">{m.codigo}</div>
                    <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-medium">
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                      {st.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {sel.length > 0
                ? "Sigue tocando mesas libres para unirlas."
                : "Toca una mesa para tomar el pedido o ver acciones."}
            </p>
          </>
        )}
      </section>

      {/* Sesiones abiertas → pedido manual */}
      {(sesiones.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
            Sesiones abiertas
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(sesiones.data ?? []).map((s) => {
              const label = s.mesas.map((m) => m.mesa.codigo).join(" + ");
              return (
                <Card key={s.id} interactive>
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
        <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
          Pedidos en curso
        </h2>
        {pedidosAccionables.length === 0 ? (
          <p className="text-sm text-slate-400">Sin pedidos activos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pedidosAccionables.map((p) => (
              <Card key={p.id} className={cn("animate-fade-up", p.estado === "LISTO" && "border-emerald-200 ring-1 ring-inset ring-emerald-100")}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      Mesa {p.mesas} · #{p.numeroSesion}
                    </span>
                    <Badge
                      tone={
                        p.estado === "LISTO" ? "green" : p.estado === "EN_PREPARACION" ? "amber" : "blue"
                      }
                    >
                      {p.estado === "LISTO"
                        ? "Listo"
                        : p.estado === "EN_PREPARACION"
                          ? "Preparando"
                          : "Confirmado"}
                    </Badge>
                  </div>
                  <ul className="text-sm text-slate-600">
                    {p.items.map((it) => (
                      <li key={it.id}>
                        <span className="tabular-nums">{it.cantidad}×</span>{" "}
                        {it.producto?.nombre ?? it.nombreCongelado ?? "Ítem"}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    {p.estado === "LISTO" && (
                      <Button
                        size="sm"
                        loading={busy === p.id}
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

      {/* Hoja de acciones de la mesa tocada */}
      {sheet && (
        <div
          className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Mesa ${sheet.codigo}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-slide-up rounded-t-3xl bg-white p-5 pb-safe shadow-lift sm:animate-scale-in sm:rounded-3xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-slate-900">
                  Mesa {sheet.codigo}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Badge
                    tone={
                      sheet.estado === "LIBRE" ? "green" : sheet.estado === "UNIDA" ? "violet" : "blue"
                    }
                  >
                    {MESA_STYLE[sheet.estado].label}
                  </Badge>
                  {sheet.capacidad} personas
                </div>
              </div>
              <button
                onClick={() => setSheet(null)}
                aria-label="Cerrar"
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-200 hover:text-ink active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {sheet.estado === "LIBRE" ? (
                <>
                  <Button
                    size="lg"
                    className="w-full"
                    loading={busy === "abrir"}
                    onClick={() => tomarPedido(sheet)}
                  >
                    <BookOpen className="h-5 w-5" /> Tomar pedido · abrir la carta
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toggleSel(sheet);
                      setSheet(null);
                    }}
                  >
                    <Link2 className="h-5 w-5" /> Seleccionar para unir mesas
                  </Button>
                </>
              ) : (
                <>
                  {sesionPorMesa.has(sheet.id) ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setManual(sesionPorMesa.get(sheet.id)!);
                        setSheet(null);
                      }}
                    >
                      <BookOpen className="h-5 w-5" /> Ver carta · agregar pedido
                    </Button>
                  ) : (
                    <p className="py-2 text-center text-sm text-slate-400">
                      Cargando la sesión de la mesa…
                    </p>
                  )}
                  {sheet.estado === "UNIDA" && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      disabled={busy === sheet.id}
                      onClick={() => {
                        const m = sheet;
                        setSheet(null);
                        run(m.id, () => api.post(`/api/mozo/mesas/${m.id}/separar`));
                      }}
                    >
                      <Unlink className="h-5 w-5" /> Separar de la unión
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
