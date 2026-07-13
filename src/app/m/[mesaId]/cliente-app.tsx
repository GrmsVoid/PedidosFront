"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Coffee,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { useRealtime } from "@/lib/realtime";
import { ModifierModal } from "@/components/menu/modifier-modal";
import { BienvenidaView } from "./bienvenida-view";
import { CartaView } from "./carta-view";
import { PedidosView } from "./pedidos-view";
import { EncuestaView } from "./encuesta-view";
import { GrupoView } from "./grupo-view";
import { formatCents } from "@/lib/price";
import type { CartItem, GrupoEstado, Menu, MenuCombo, MenuProducto, SesionActual } from "./types";

type ScanResp =
  | { estado: "NUEVO"; sesionId: string; mesaCodigo: string; sessionToken: string; participanteToken: string; holdExpiraEn: string | null }
  | { estado: "OCUPADA"; sesionId: string; mesaCodigo: string; grupoActivos: number; holdExpiraEn: string | null };
type UnirmeResp = { estado: "UNIDO"; sesionId: string; sessionToken: string; participanteToken: string };
type AceptarResp = { pedidoCreado: boolean; pedidoId?: string; estado: GrupoEstado };

export function ClienteApp({ mesaId, qrToken }: { mesaId: string; qrToken: string | null }) {
  const partKey = `cafe-part:${mesaId}`;
  const sesKey = `cafe-ses:${mesaId}`;
  const codigoKey = `cafe-codigo:${mesaId}`;
  const bienvenidaKey = `cafe-bienvenida:${mesaId}`;

  const [fase, setFase] = useState<"cargando" | "prompt" | "grupo" | "error">("cargando");
  // Código real de la mesa (M06…): llega al escanear y se recuerda para recargas.
  const [mesaCodigo, setMesaCodigo] = useState<string>(() =>
    typeof window === "undefined"
      ? mesaId
      : (localStorage.getItem(codigoKey) ?? mesaId.replace("demo-mesa-", "")),
  );
  // Portada de bienvenida: solo la primera vez que llega a la mesa (por pestaña).
  const [bienvenida, setBienvenida] = useState<boolean>(() =>
    typeof window === "undefined" ? true : sessionStorage.getItem(bienvenidaKey) === null,
  );
  const [errorInit, setErrorInit] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<{ mesaCodigo: string; grupoActivos: number } | null>(null);
  const [partToken, setPartToken] = useState<string | null>(null);
  const [sesToken, setSesToken] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [grupo, setGrupo] = useState<GrupoEstado | null>(null);
  const [sesion, setSesion] = useState<SesionActual | null>(null);
  const [tab, setTab] = useState<"menu" | "grupo">("menu");
  const [modalProducto, setModalProducto] = useState<MenuProducto | null>(null);
  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState<{ id: number; tone: "ok" | "err"; msg: string } | null>(null);
  const [, setNow] = useState(Date.now());
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisoSeq = useRef(0);

  const flash = useCallback((tone: "ok" | "err", msg: string) => {
    avisoSeq.current += 1;
    setAviso({ id: avisoSeq.current, tone, msg });
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 3200);
  }, []);

  // Inicialización: cargar menú + (recuperar token | escanear)
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const menuData = await api.get<Menu>("/api/menu");
        if (cancelado) return;
        setMenu(menuData);

        const savedPart = localStorage.getItem(partKey);
        const savedSes = localStorage.getItem(sesKey);
        if (savedPart) {
          setPartToken(savedPart);
          setSesToken(savedSes);
          setFase("grupo");
          return;
        }
        if (qrToken) {
          const r = await api.post<ScanResp>(`/api/sesion/mesa/${mesaId}`, { qrToken });
          if (cancelado) return;
          localStorage.setItem(codigoKey, r.mesaCodigo);
          setMesaCodigo(r.mesaCodigo);
          if (r.estado === "OCUPADA") {
            setPrompt({ mesaCodigo: r.mesaCodigo, grupoActivos: r.grupoActivos });
            setFase("prompt");
            return;
          }
          localStorage.setItem(partKey, r.participanteToken);
          localStorage.setItem(sesKey, r.sessionToken);
          setPartToken(r.participanteToken);
          setSesToken(r.sessionToken);
          setFase("grupo");
          return;
        }
        setErrorInit("Escanea el código QR de tu mesa para empezar.");
        setFase("error");
      } catch (e) {
        if (cancelado) return;
        setErrorInit(e instanceof ClientApiError ? e.message : "No se pudo conectar. Reintenta.");
        setFase("error");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [mesaId, qrToken, partKey, sesKey, codigoKey]);

  // Sumarse al grupo (tras confirmar "soy del mismo grupo")
  async function unirme() {
    if (!qrToken) return;
    setBusy(true);
    try {
      const r = await api.post<UnirmeResp>(`/api/sesion/mesa/${mesaId}/unirme`, { qrToken });
      localStorage.setItem(partKey, r.participanteToken);
      localStorage.setItem(sesKey, r.sessionToken);
      setPartToken(r.participanteToken);
      setSesToken(r.sessionToken);
      setFase("grupo");
    } catch (e) {
      flash("err", e instanceof ClientApiError ? e.message : "No se pudo unir al grupo.");
    } finally {
      setBusy(false);
    }
  }

  // Polling del estado del grupo
  const refrescarGrupo = useCallback(async () => {
    if (!partToken) return;
    try {
      setGrupo(await api.get<GrupoEstado>("/api/grupo/estado", { token: partToken }));
    } catch {
      /* reintenta */
    }
  }, [partToken]);

  useEffect(() => {
    if (fase !== "grupo" || !partToken) return;
    refrescarGrupo();
    const id = setInterval(refrescarGrupo, 2500);
    return () => clearInterval(id);
  }, [fase, partToken, refrescarGrupo]);

  // Polling de la sesión (pedidos ya confirmados / cierre)
  const refrescarSesion = useCallback(async () => {
    if (!sesToken) return;
    try {
      setSesion(await api.get<SesionActual>("/api/sesion/actual", { token: sesToken }));
    } catch {
      /* reintenta */
    }
  }, [sesToken]);

  useEffect(() => {
    if (fase !== "grupo" || !sesToken) return;
    refrescarSesion();
    // Respaldo: el socket empuja los cambios al instante.
    const id = setInterval(refrescarSesion, 12000);
    return () => clearInterval(id);
  }, [fase, sesToken, refrescarSesion]);

  // Tick del contador (1s)
  useEffect(() => {
    if (fase !== "grupo") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [fase]);

  // Tiempo real: el estado del pedido avanza solo (sin esperar el polling).
  const sesionIdRt = grupo?.sesionId ?? null;
  useRealtime(
    sesionIdRt ? [`sesion:${sesionIdRt}`] : [],
    { sessionToken: sesToken },
    (ev, payload) => {
      if (ev === "pedido:estado") {
        refrescarSesion();
        const p = payload as { estado?: string };
        if (p?.estado === "LISTO") {
          flash("ok", "¡Tu pedido está listo! 🛎️");
          try {
            navigator.vibrate?.([120, 60, 120]);
          } catch {
            /* sin soporte */
          }
        }
      } else if (
        ev === "pedido:creado" ||
        ev === "pedido:cancelado" ||
        ev === "pago:registrado" ||
        ev === "sesion:cerrada"
      ) {
        refrescarSesion();
      }
    },
    fase === "grupo" && !!sesToken && !!sesionIdRt,
  );

  function limpiarYReiniciar(msg: string) {
    localStorage.removeItem(partKey);
    localStorage.removeItem(sesKey);
    setErrorInit(msg);
    setFase("error");
  }

  async function runGrupo(fn: () => Promise<AceptarResp | GrupoEstado | void>, okMsg?: string) {
    setBusy(true);
    try {
      const r = await fn();
      if (r && "carrito" in r) setGrupo(r);
      else if (r && "estado" in r) {
        setGrupo(r.estado);
        if (r.pedidoCreado) {
          flash("ok", "¡Pedido enviado a barra! 🎉");
          await refrescarSesion();
          setTab("grupo");
        }
      }
      if (okMsg) flash("ok", okMsg);
    } catch (e) {
      flash("err", e instanceof ClientApiError ? e.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  }

  async function addProducto(item: CartItem) {
    await runGrupo(
      () =>
        api.post<GrupoEstado>(
          "/api/grupo/carrito",
          { productoId: item.productoId, cantidad: item.cantidad, opcionesIds: item.opcionesIds, notaLibre: item.notaLibre },
          { token: partToken },
        ),
      `${item.nombre} agregado`,
    );
  }
  async function addCombo(c: MenuCombo) {
    await runGrupo(
      () =>
        api.post<GrupoEstado>(
          "/api/grupo/carrito",
          { comboId: c.id, cantidad: 1, opcionesIds: [], notaLibre: null },
          { token: partToken },
        ),
      `${c.nombre} agregado`,
    );
  }

  async function accion(path: string, okMsg: string) {
    if (!sesToken) return;
    try {
      await api.post(path, undefined, { token: sesToken });
      flash("ok", okMsg);
      await refrescarSesion();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === "THROTTLED") {
        flash("ok", "Ya enviamos tu solicitud. ¡En camino!");
      } else {
        flash("err", e instanceof ClientApiError ? e.message : "No se pudo completar.");
      }
    }
  }

  if (fase === "cargando") {
    return (
      <Frame>
        <div className="animate-fade-in space-y-5 px-4 pt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </Frame>
    );
  }

  if (fase === "error") {
    return (
      <Frame>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
          <div className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white shadow-soft">
            <Coffee className="h-8 w-8" />
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-900">Un momento…</p>
          <p className="mt-2 text-slate-500">{errorInit}</p>
        </div>
      </Frame>
    );
  }

  // Mesa ocupada por otro grupo → confirmar pertenencia
  if (fase === "prompt" && prompt) {
    return (
      <Frame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 ring-8 ring-amber-50">
            <Users className="h-8 w-8 text-amber-600" />
          </div>
          <div className="animate-fade-up">
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900">
              Mesa {prompt.mesaCodigo} ocupada
            </h1>
            <p className="mt-2 text-slate-500">
              Ya hay {prompt.grupoActivos} {prompt.grupoActivos === 1 ? "persona" : "personas"} en esta
              mesa. ¿Tú también integras el mismo grupo?
            </p>
          </div>
          <div className="flex w-full max-w-xs animate-fade-up flex-col gap-2">
            <Button size="lg" loading={busy} onClick={unirme}>
              <Users className="h-5 w-5" /> Sí, somos el mismo grupo
            </Button>
            <Button
              variant="ghost"
              onClick={() => limpiarYReiniciar("Pide al personal que te asigne una mesa libre.")}
            >
              No, me equivoqué de mesa
            </Button>
          </div>
        </div>
      </Frame>
    );
  }

  // Sesión cerrada / expirada
  const estadoSesion = sesion?.sesion.estado;
  if (estadoSesion === "CERRADA") {
    return (
      <Frame>
        <EncuestaView token={sesToken!} yaEnviada={sesion!.sesion.encuesta !== null} />
      </Frame>
    );
  }
  if (estadoSesion === "FUGADA" || estadoSesion === "EXPIRADA") {
    return (
      <Frame>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
          <div className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-900">Esta sesión se cerró.</p>
          <p className="mt-2 text-slate-500">Escanea el QR de nuevo para empezar otro pedido.</p>
          <Button className="mt-5" onClick={() => limpiarYReiniciar("Escanea el QR de tu mesa.")}>
            Entendido
          </Button>
        </div>
      </Frame>
    );
  }

  // Portada: saludo por hora + mesa + nombre del comensal, una sola vez al llegar.
  if (bienvenida) {
    return (
      <Frame>
        <BienvenidaView
          mesaCodigo={mesaCodigo}
          onContinuar={async (nombre) => {
            try {
              // Reemplaza el "Comensal N" por el nombre real; el grupo lo ve al instante.
              const estado = await api.patch<GrupoEstado>(
                "/api/grupo/nombre",
                { nombre },
                { token: partToken },
              );
              setGrupo(estado);
              localStorage.setItem("cafe-nombre", nombre);
            } catch {
              /* sin red o token viejo: sigue con el nombre por defecto */
            }
            sessionStorage.setItem(bienvenidaKey, "1");
            setBienvenida(false);
            flash("ok", `¡Bienvenido, ${nombre.split(" ")[0]}! ☕`);
          }}
        />
      </Frame>
    );
  }

  const pedidos = sesion?.sesion.pedidos ?? [];
  const cartCount = grupo?.carrito.reduce((a, it) => a + it.cantidad, 0) ?? 0;
  const restanteMs = grupo?.holdExpiraEn ? new Date(grupo.holdExpiraEn).getTime() - Date.now() : 0;
  const mostrarContador = !!grupo?.holdExpiraEn && !grupo.tienePedidos && pedidos.length === 0;

  return (
    <Frame>
      <div className="pb-28">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
                <Coffee className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div>
                <h1 className="text-[16px] font-semibold leading-tight tracking-tight text-slate-900">
                  Café Demo
                </h1>
                <p className="text-xs font-medium text-slate-500">Mesa {mesaCodigo}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => accion("/api/sesion/llamar-mozo", "Llamamos al mozo")}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                <BellRing className="h-3.5 w-3.5" /> Mozo
              </button>
              <button
                onClick={() => accion("/api/sesion/pedir-cuenta", "Pedimos tu cuenta")}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                <ReceiptText className="h-3.5 w-3.5" /> Cuenta
              </button>
            </div>
          </div>

          {/* Tabs con indicador deslizante */}
          <div className="relative flex">
            {(["menu", "grupo"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative z-[1] flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors duration-200",
                  tab === t ? "text-ink" : "text-slate-400 hover:text-slate-600",
                )}
              >
                {t === "menu" ? "La carta" : "Mi pedido"}
                {t === "grupo" && cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            ))}
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 w-1/2 rounded-full bg-ink transition-transform duration-300 ease-out"
              style={{ transform: tab === "menu" ? "translateX(0)" : "translateX(100%)" }}
            />
          </div>
        </header>

        {/* Contador de reserva */}
        {mostrarContador && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            <Clock className="h-4 w-4 animate-pulse" />
            Mesa reservada · quedan{" "}
            <span className="tabular-nums">{fmtRestante(restanteMs)}</span>
          </div>
        )}

        <main className="px-4 py-4">
          {tab === "menu" && menu && (
            <CartaView menu={menu} onSelect={(p) => setModalProducto(p)} onAddCombo={addCombo} />
          )}
          {tab === "grupo" && (
            <div className="animate-fade-up space-y-4">
              {pedidos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3.5 text-white shadow-soft">
                    <span className="text-sm text-white/80">Cuenta actual</span>
                    <span className="text-lg font-bold tabular-nums">
                      {formatCents(centsTotal(sesion?.total ?? "0"))}
                    </span>
                  </div>
                  <PedidosView sesion={sesion!} menu={menu} />
                </div>
              )}
              {grupo ? (
                <GrupoView
                  grupo={grupo}
                  busy={busy}
                  onAceptar={() => runGrupo(() => api.post<AceptarResp>("/api/grupo/aceptar", undefined, { token: partToken }))}
                  onQuitarItem={(id) => runGrupo(() => api.del<GrupoEstado>(`/api/grupo/carrito/${id}`, { token: partToken }))}
                  onQuitarParticipante={(id) =>
                    runGrupo(() => api.post<AceptarResp>(`/api/grupo/anfitrion/quitar/${id}`, undefined, { token: partToken }))
                  }
                  onForzar={() => runGrupo(() => api.post<AceptarResp>("/api/grupo/anfitrion/forzar", undefined, { token: partToken }))}
                />
              ) : (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Toast flotante */}
        {aviso && (
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
            <div
              key={aviso.id}
              role="status"
              className={cn(
                "flex max-w-full animate-toast-in items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lift",
                aviso.tone === "ok" ? "bg-ink" : "bg-red-600",
              )}
            >
              {aviso.tone === "ok" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{aviso.msg}</span>
            </div>
          </div>
        )}

        {/* Barra flotante: ir al pedido del grupo (desde el menú) */}
        {tab === "menu" && cartCount > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md animate-slide-up border-t border-line bg-paper/95 p-3 pb-safe shadow-top-soft backdrop-blur">
            <Button size="lg" className="w-full justify-between" onClick={() => setTab("grupo")}>
              <span className="flex items-center gap-2">
                <span className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <span
                    key={cartCount}
                    className="absolute -right-2 -top-2 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-ink"
                  >
                    {cartCount}
                  </span>
                </span>
                Ver pedido del grupo
              </span>
              {grupo && <span className="tabular-nums">{formatCents(centsTotal(grupo.total))}</span>}
            </Button>
          </div>
        )}

        {modalProducto && (
          <ModifierModal
            producto={modalProducto}
            onClose={() => setModalProducto(null)}
            onAdd={(item) => {
              setModalProducto(null);
              addProducto(item);
            }}
          />
        )}
      </div>
    </Frame>
  );
}

/** Marco de la app: columna móvil centrada que en desktop se ve como un “teléfono” elevado. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e9e8e1]">
      <div className="mx-auto min-h-screen w-full max-w-md border-x border-line bg-paper shadow-lift">
        {children}
      </div>
    </div>
  );
}

function centsTotal(total: string): number {
  const [a, b = "0"] = total.split(".");
  return parseInt(a || "0", 10) * 100 + parseInt((b + "00").slice(0, 2), 10);
}

function fmtRestante(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
