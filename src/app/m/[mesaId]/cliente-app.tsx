"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, ReceiptText, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { MenuView } from "@/components/menu/menu-view";
import { ModifierModal } from "@/components/menu/modifier-modal";
import { PedidosView } from "./pedidos-view";
import { EncuestaView } from "./encuesta-view";
import { formatCents } from "@/lib/price";
import type { CartItem, Menu, MenuProducto, SesionActual } from "./types";

type AbrirResp = { sesionId: string; sessionToken: string; cierreEstimadoIso: string };

export function ClienteApp({ mesaId, qrToken }: { mesaId: string; qrToken: string | null }) {
  const storageKey = `cafe-token:${mesaId}`;
  const [fase, setFase] = useState<"cargando" | "lista" | "error">("cargando");
  const [errorInit, setErrorInit] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [sesion, setSesion] = useState<SesionActual | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<"menu" | "pedido">("menu");
  const [modalProducto, setModalProducto] = useState<MenuProducto | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((tone: "ok" | "err", msg: string) => {
    setAviso({ tone, msg });
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  // Inicialización: abrir/recuperar sesión + cargar menú
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const menuData = await api.get<Menu>("/api/menu");
        if (cancelado) return;
        setMenu(menuData);

        let tk: string | null = null;
        if (qrToken) {
          const r = await api.post<AbrirResp>(`/api/sesion/mesa/${mesaId}`, { qrToken });
          tk = r.sessionToken;
          localStorage.setItem(storageKey, tk);
        } else {
          tk = localStorage.getItem(storageKey);
        }
        if (cancelado) return;
        if (!tk) {
          setErrorInit("Escanea el código QR de tu mesa para empezar.");
          setFase("error");
          return;
        }
        setToken(tk);
        setFase("lista");
      } catch (e) {
        if (cancelado) return;
        setErrorInit(
          e instanceof ClientApiError ? e.message : "No se pudo conectar. Reintenta.",
        );
        setFase("error");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [mesaId, qrToken, storageKey]);

  // Polling de la sesión actual
  const refrescarSesion = useCallback(async () => {
    if (!token) return;
    try {
      const s = await api.get<SesionActual>("/api/sesion/actual", { token });
      setSesion(s);
    } catch {
      // silencioso: reintenta en el siguiente tick
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refrescarSesion();
    const id = setInterval(refrescarSesion, 5000);
    return () => clearInterval(id);
  }, [token, refrescarSesion]);

  const cartTotalCents = cart.reduce((acc, it) => acc + it.precioUnitarioCents * it.cantidad, 0);
  const cartCount = cart.reduce((acc, it) => acc + it.cantidad, 0);

  async function confirmarPedido() {
    if (!token || cart.length === 0) return;
    setConfirmando(true);
    try {
      await api.post(
        "/api/pedidos",
        {
          items: cart.map((c) => ({
            productoId: c.productoId,
            cantidad: c.cantidad,
            opcionesIds: c.opcionesIds,
            notaLibre: c.notaLibre,
          })),
        },
        { token, idempotencyKey: crypto.randomUUID() },
      );
      setCart([]);
      setTab("pedido");
      flash("ok", "¡Pedido enviado a barra!");
      await refrescarSesion();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === "PRODUCT_UNAVAILABLE") {
        flash("err", "Un producto se agotó. Revisa tu pedido.");
        try {
          setMenu(await api.get<Menu>("/api/menu"));
        } catch {
          /* noop */
        }
      } else {
        flash("err", e instanceof ClientApiError ? e.message : "No se pudo enviar el pedido.");
      }
    } finally {
      setConfirmando(false);
    }
  }

  async function accion(path: string, okMsg: string) {
    if (!token) return;
    try {
      await api.post(path, undefined, { token });
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
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (fase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <p className="text-lg font-medium text-slate-800">Un momento…</p>
        <p className="mt-2 text-slate-500">{errorInit}</p>
      </div>
    );
  }

  // Sesión cerrada → encuesta
  if (sesion && (sesion.sesion.estado === "CERRADA" || sesion.sesion.estado === "FUGADA")) {
    if (sesion.sesion.estado === "FUGADA") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-medium text-slate-800">Esta sesión fue cerrada.</p>
          <p className="mt-2 text-slate-500">Escanea el QR de nuevo para un nuevo pedido.</p>
        </div>
      );
    }
    return <EncuestaView token={token!} yaEnviada={sesion.sesion.encuesta !== null} />;
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-semibold text-slate-900">Café Demo</h1>
            <p className="text-xs text-slate-500">Mesa {mesaId.replace("demo-mesa-", "")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => accion("/api/sesion/llamar-mozo", "Llamamos al mozo")}
            >
              <BellRing className="h-4 w-4" /> Mozo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => accion("/api/sesion/pedir-cuenta", "Pedimos tu cuenta")}
            >
              <ReceiptText className="h-4 w-4" /> Cuenta
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex">
          {(["menu", "pedido"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 border-b-2 py-2 text-sm font-medium transition-colors",
                tab === t
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400",
              )}
            >
              {t === "menu" ? "Menú" : "Mi pedido"}
              {t === "pedido" && sesion && sesion.sesion.pedidos.length > 0 && (
                <span className="ml-1 text-slate-400">({sesion.sesion.pedidos.length})</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Aviso flotante */}
      {aviso && (
        <div
          className={cn(
            "sticky top-[97px] z-10 px-4 py-2 text-center text-sm font-medium",
            aviso.tone === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700",
          )}
        >
          {aviso.msg}
        </div>
      )}

      <main className="px-4 py-4">
        {tab === "menu" && menu && (
          <MenuView menu={menu} onSelect={(p) => setModalProducto(p)} />
        )}
        {tab === "pedido" && (
          <div className="space-y-4">
            {sesion && (
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
                <span className="text-sm">Cuenta actual</span>
                <span className="text-lg font-bold">{formatCents(centsTotal(sesion.total))}</span>
              </div>
            )}
            <PedidosView sesion={sesion ?? emptySesion()} menu={menu} />
          </div>
        )}
      </main>

      {/* Carrito en construcción (solo en menú) */}
      {tab === "menu" && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="mb-2 max-h-32 space-y-1 overflow-y-auto">
            {cart.map((it) => (
              <div key={it.uid} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-slate-700">
                  {it.cantidad}× {it.nombre}
                  {it.opcionesLabel && (
                    <span className="text-slate-400"> · {it.opcionesLabel}</span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-slate-500">
                    {formatCents(it.precioUnitarioCents * it.cantidad)}
                  </span>
                  <button
                    onClick={() => setCart((c) => c.filter((x) => x.uid !== it.uid))}
                    aria-label="Quitar"
                    className="rounded p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" disabled={confirmando} onClick={confirmarPedido}>
            <ShoppingCart className="h-5 w-5" />
            {confirmando
              ? "Enviando…"
              : `Confirmar pedido · ${cartCount} ${cartCount === 1 ? "ítem" : "ítems"} · ${formatCents(cartTotalCents)}`}
          </Button>
        </div>
      )}

      {modalProducto && (
        <ModifierModal
          producto={modalProducto}
          onClose={() => setModalProducto(null)}
          onAdd={(item) => {
            setCart((c) => [...c, item]);
            setModalProducto(null);
            flash("ok", `${item.nombre} agregado`);
          }}
        />
      )}
    </div>
  );
}

function centsTotal(total: string): number {
  const [a, b = "0"] = total.split(".");
  return parseInt(a || "0", 10) * 100 + parseInt((b + "00").slice(0, 2), 10);
}

function emptySesion(): SesionActual {
  return { sesion: { id: "", estado: "ABIERTA", pedidos: [], encuesta: null }, total: "0.00" };
}
