"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { formatCents } from "@/lib/price";
import { SalonMapa } from "@/components/plano/salon-mapa";
import { pisoDeMesa, type Plano, type PlanoMesa } from "@/components/plano/types";
import { CartaView } from "@/app/m/[mesaId]/carta-view";
import { ModifierModal } from "@/components/menu/modifier-modal";
import type { CartItem, Menu, MenuCombo, MenuProducto } from "@/components/menu/types";

const CODIGO_KEY = "cafe-prepedido-codigo";

type Salon = { nombre: string; plano: Plano | null; mesas: PlanoMesa[] };
type PrePedidoEstado = "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "EXPIRADO";
type EstadoResp = {
  codigo: string;
  estado: PrePedidoEstado;
  mesaCodigo: string;
  nombre: string;
  total: string;
  items: Array<{ cantidad: number; nombre: string; opcionesLabel: string }>;
};

export default function PedirPage() {
  const [paso, setPaso] = useState<"mesa" | "datos" | "carta" | "codigo">("mesa");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [pisoSelId, setPisoSelId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [mesa, setMesa] = useState<PlanoMesa | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProducto, setModalProducto] = useState<MenuProducto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoResp | null>(null);

  // Datos iniciales + reanudar si ya hay un pre-pedido en curso
  useEffect(() => {
    setNombre(localStorage.getItem("cafe-nombre") ?? "");
    const guardado = localStorage.getItem(CODIGO_KEY);
    if (guardado) {
      setCodigo(guardado);
      setPaso("codigo");
    }
    api.get<Salon>("/api/publico/salon").then(setSalon).catch(() => setError("No se pudo cargar el salón"));
    api.get<Menu>("/api/menu").then(setMenu).catch(() => {});
  }, []);

  // Estado en vivo del pre-pedido
  const refrescarEstado = useCallback(async () => {
    if (!codigo) return;
    try {
      setEstado(await api.get<EstadoResp>(`/api/publico/pre-pedido/${codigo}`));
    } catch (e) {
      if (e instanceof ClientApiError && e.status === 404) {
        localStorage.removeItem(CODIGO_KEY);
        setCodigo(null);
        setPaso("mesa");
      }
    }
  }, [codigo]);

  useEffect(() => {
    if (paso !== "codigo" || !codigo) return;
    refrescarEstado();
    const id = setInterval(refrescarEstado, 5000);
    return () => clearInterval(id);
  }, [paso, codigo, refrescarEstado]);

  const totalCents = cart.reduce((a, it) => a + it.precioUnitarioCents * it.cantidad, 0);
  const count = cart.reduce((a, it) => a + it.cantidad, 0);
  const mesasLibres = useMemo(() => (salon?.mesas ?? []).filter((m) => m.estado === "LIBRE"), [salon]);

  async function enviar() {
    if (!mesa || cart.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await api.post<{ codigo: string }>("/api/publico/pre-pedido", {
        mesaId: mesa.id,
        nombre: nombre.trim().replace(/\s+/g, " "),
        telefono: telefono.trim() || undefined,
        items: cart.map((c) =>
          c.comboId
            ? { comboId: c.comboId, cantidad: c.cantidad, opcionesIds: [], notaLibre: c.notaLibre }
            : { productoId: c.productoId, cantidad: c.cantidad, opcionesIds: c.opcionesIds, notaLibre: c.notaLibre },
        ),
      });
      localStorage.setItem(CODIGO_KEY, r.codigo);
      localStorage.setItem("cafe-nombre", nombre.trim());
      setCodigo(r.codigo);
      setCart([]);
      setPaso("codigo");
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo enviar. Reintenta.");
    } finally {
      setEnviando(false);
    }
  }

  function otroPedido() {
    localStorage.removeItem(CODIGO_KEY);
    setCodigo(null);
    setEstado(null);
    setMesa(null);
    setPaso("mesa");
  }

  return (
    <div className="min-h-screen bg-[#e9e8e1]">
      <div className="mx-auto min-h-screen w-full max-w-md border-x border-line bg-paper shadow-lift">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                aria-label="Volver al inicio"
                className="rounded-sm border border-line bg-panel p-2 text-muted transition-all duration-150 hover:border-brand hover:bg-accent-soft hover:text-ink active:scale-90"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="font-display font-semibold leading-tight tracking-tight text-slate-900">
                  Pide antes de llegar
                </h1>
                <p className="text-xs text-slate-500">
                  {paso === "codigo"
                    ? "Estado de tu pedido"
                    : mesa
                      ? `Mesa ${mesa.codigo} · ${salon?.nombre ?? ""}`
                      : (salon?.nombre ?? "Café Demo")}
                </p>
              </div>
            </div>
            {paso !== "codigo" && (
              <div className="flex items-center gap-1" aria-label="Progreso">
                {(["mesa", "datos", "carta"] as const).map((p, i) => (
                  <span
                    key={p}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      paso === p ? "w-6 bg-brand" : "w-1.5 bg-slate-300",
                      i < ["mesa", "datos", "carta"].indexOf(paso) && "bg-brand/40",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Paso 1: elegir mesa en el plano */}
        {paso === "mesa" && (
          <main className="animate-fade-up px-4 py-5 pb-32">
            <h2 className="font-carta text-2xl font-semibold text-slate-900">Elige tu mesa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Así está el salón ahora mismo. Toca una mesa libre (verde) para reservar tu lugar.
            </p>
            {!salon ? (
              <Skeleton className="mt-4 aspect-[3/2] w-full rounded-2xl" />
            ) : salon.plano && salon.plano.pisos.length > 0 ? (
              <div className="mt-4 rounded-sm border border-line bg-panel p-3 shadow-soft">
                {salon.plano.pisos.length > 1 && (
                  <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                    {salon.plano.pisos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPisoSelId(p.id)}
                        className={cn(
                          "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95",
                          (pisoSelId ?? salon.plano!.pisos[0].id) === p.id
                            ? "bg-ink text-white shadow-sm"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300",
                        )}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {(() => {
                  const piso =
                    salon.plano.pisos.find((p) => p.id === pisoSelId) ?? salon.plano.pisos[0];
                  return (
                    <SalonMapa
                      piso={piso}
                      mesas={salon.mesas.filter((m) => pisoDeMesa(m, salon.plano!) === piso.id)}
                      seleccion={mesa ? [mesa.id] : []}
                      onMesaClick={(m) => {
                        if (m.estado === "LIBRE") setMesa(m);
                      }}
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
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {mesasLibres.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMesa(m)}
                    className={cn(
                      "rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-center text-emerald-700 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft active:scale-95",
                      mesa?.id === m.id && "ring-2 ring-ink ring-offset-2",
                    )}
                  >
                    <div className="text-lg font-bold tabular-nums">{m.codigo}</div>
                    <div className="text-[11px]">{m.capacidad} pers.</div>
                  </button>
                ))}
              </div>
            )}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            {mesa && (
                <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md animate-slide-up border-t border-line bg-paper/95 p-3 pb-safe shadow-top-soft backdrop-blur">
                <Button size="lg" className="w-full justify-between" onClick={() => setPaso("datos")}>
                  <span>
                    Mesa {mesa.codigo} · {mesa.capacidad} personas
                  </span>
                  <span>Continuar →</span>
                </Button>
              </div>
            )}
          </main>
        )}

        {/* Paso 2: datos del cliente */}
        {paso === "datos" && mesa && (
          <main className="animate-fade-up px-6 py-8">
            <button
              onClick={() => setPaso("mesa")}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar de mesa
            </button>
            <h2 className="font-carta text-2xl font-semibold text-slate-900">¿Cómo te llamas?</h2>
            <p className="mt-1 text-sm text-slate-500">
              El mozo confirmará tu pedido con este nombre cuando te comuniques o llegues al local.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (nombre.trim().length >= 2) setPaso("carta");
              }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={40}
                placeholder="Tu nombre"
                autoComplete="name"
                className="w-full rounded-sm border border-line bg-panel px-4 py-3 text-center font-carta text-lg shadow-sm transition-colors placeholder:text-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                maxLength={20}
                inputMode="tel"
                placeholder="Teléfono / WhatsApp (opcional)"
                autoComplete="tel"
                className="w-full rounded-sm border border-line bg-panel px-4 py-3 text-center text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
              <Button type="submit" size="lg" className="w-full" disabled={nombre.trim().length < 2}>
                Ver la carta
              </Button>
              <p className="text-center text-xs text-slate-400">
                Tu pedido pasa a cocina solo cuando el mozo lo confirme.
              </p>
            </form>
          </main>
        )}

        {/* Paso 3: la carta + carrito */}
        {paso === "carta" && (
          <main className="px-4 py-4 pb-32">
            {menu ? (
              <CartaView
                menu={menu}
                onSelect={(p) => setModalProducto(p)}
                onAddCombo={(c) => setCart((prev) => [...prev, comboToCart(c)])}
              />
            ) : (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md animate-slide-up border-t border-line bg-paper/95 p-3 pb-safe shadow-top-soft backdrop-blur">
                <div className="mb-2 max-h-28 space-y-1 overflow-y-auto">
                  {cart.map((it) => (
                    <div key={it.uid} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-slate-700">
                        <span className="tabular-nums">{it.cantidad}×</span> {it.nombre}
                        {it.opcionesLabel && <span className="text-slate-400"> · {it.opcionesLabel}</span>}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="tabular-nums text-slate-500">
                          {formatCents(it.precioUnitarioCents * it.cantidad)}
                        </span>
                        <button
                          onClick={() => setCart((c) => c.filter((x) => x.uid !== it.uid))}
                          aria-label="Quitar"
                          className="rounded-lg p-1 text-slate-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
                <Button size="lg" className="w-full" loading={enviando} onClick={enviar}>
                  <ShoppingBag className="h-5 w-5" />
                  {`Enviar pedido · ${count} ${count === 1 ? "ítem" : "ítems"} · ${formatCents(totalCents)}`}
                </Button>
              </div>
            )}
          </main>
        )}

        {/* Paso 4: código + estado en vivo */}
        {paso === "codigo" && (
          <main className="flex min-h-[80vh] animate-fade-up flex-col items-center justify-center px-8 py-10 text-center">
            {!estado ? (
              <Skeleton className="h-40 w-full max-w-xs rounded-2xl" />
            ) : estado.estado === "PENDIENTE" ? (
              <>
                <div className="flex h-16 w-16 animate-pulse-ring items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="mt-6 font-carta text-2xl font-semibold text-slate-900">
                  Esperando al mozo
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {estado.nombre}, tu pedido para la <b>mesa {estado.mesaCodigo}</b> aún no entra a
                  cocina. Llama al local o muestra este código al llegar para confirmarlo:
                </p>
                <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/30 bg-white px-10 py-5 shadow-sm">
                  <p className="font-display text-4xl font-bold tracking-[0.3em] text-ink">
                    {estado.codigo}
                  </p>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Total estimado: S/ {estado.total} · Si nadie lo confirma en 1 hora, expira solo.
                </p>
                <p className="mt-1 text-xs text-slate-400">☎ +51 999 999 999</p>
                <Button variant="ghost" className="mt-6" onClick={otroPedido}>
                  Cancelar y empezar de nuevo
                </Button>
              </>
            ) : estado.estado === "ACEPTADO" ? (
              <>
                <div className="flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="mt-6 font-carta text-2xl font-semibold text-slate-900">
                  ¡Pedido confirmado!
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  El mozo aceptó tu pedido y ya está en cocina. Te esperamos en la{" "}
                  <b>mesa {estado.mesaCodigo}</b>, {estado.nombre}.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  <ChefHat className="h-4 w-4" /> Preparando: {estado.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                </div>
                <Button className="mt-8" onClick={otroPedido}>
                  <Coffee className="h-4 w-4" /> Hacer otro pedido
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-slate-100">
                  <XCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="mt-6 font-carta text-2xl font-semibold text-slate-900">
                  {estado.estado === "RECHAZADO" ? "Pedido no aceptado" : "Tu pedido expiró"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {estado.estado === "RECHAZADO"
                    ? "El local no pudo tomar tu pedido esta vez. Llama para coordinar o inténtalo de nuevo."
                    : "Pasó más de una hora sin confirmación. Puedes hacer un pedido nuevo cuando quieras."}
                </p>
                <Button className="mt-8" onClick={otroPedido}>
                  Hacer otro pedido
                </Button>
              </>
            )}
          </main>
        )}

        {modalProducto && (
          <ModifierModal
            producto={modalProducto}
            onClose={() => setModalProducto(null)}
            onAdd={(item) => {
              setCart((c) => [...c, item]);
              setModalProducto(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function comboToCart(c: MenuCombo): CartItem {
  return {
    uid: crypto.randomUUID(),
    productoId: "",
    comboId: c.id,
    nombre: c.nombre,
    cantidad: 1,
    opcionesIds: [],
    opcionesLabel: c.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", "),
    notaLibre: null,
    precioUnitarioCents: centsFromPrecio(c.precio),
  };
}

function centsFromPrecio(s: string): number {
  const [a, b = "0"] = s.split(".");
  return parseInt(a || "0", 10) * 100 + parseInt((b + "00").slice(0, 2), 10);
}
