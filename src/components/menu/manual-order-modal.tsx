"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ClientApiError } from "@/lib/client-api";
import { centsFromStr, formatCents } from "@/lib/price";
import { MenuView } from "./menu-view";
import { ModifierModal } from "./modifier-modal";
import type { CartItem, Menu, MenuCombo, MenuProducto } from "./types";

/** Composer de pedido manual (mozo). Reusa el menú y el modal de modificadores del cliente. */
export function ManualOrderModal({
  sesionId,
  mesaLabel,
  onClose,
  onCreated,
}: {
  sesionId: string;
  mesaLabel: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProducto, setModalProducto] = useState<MenuProducto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Menu>("/api/menu")
      .then(setMenu)
      .catch(() => setError("No se pudo cargar el menú"));
  }, []);

  const totalCents = cart.reduce((a, it) => a + it.precioUnitarioCents * it.cantidad, 0);
  const count = cart.reduce((a, it) => a + it.cantidad, 0);

  async function confirmar() {
    if (cart.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await api.post(`/api/mozo/sesion/${sesionId}/pedido`, {
        items: cart.map((c) =>
          c.comboId
            ? { comboId: c.comboId, cantidad: c.cantidad, notaLibre: c.notaLibre }
            : {
                productoId: c.productoId,
                cantidad: c.cantidad,
                opcionesIds: c.opcionesIds,
                notaLibre: c.notaLibre,
              },
        ),
      });
      onCreated();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo enviar el pedido");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pedido manual · Mesa ${mesaLabel}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-md animate-slide-up flex-col rounded-t-3xl bg-slate-50 shadow-lift sm:h-[85vh] sm:animate-scale-in sm:rounded-3xl"
      >
        <div className="flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white p-4">
          <div>
            <h2 className="font-display font-semibold tracking-tight text-slate-900">
              Pedido manual
            </h2>
            <p className="text-xs text-slate-500">Mesa {mesaLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-200 hover:text-ink active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          {!menu ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full rounded-full" />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <MenuView
              menu={menu}
              onSelect={(p) => setModalProducto(p)}
              onAddCombo={(c) => setCart((prev) => [...prev, comboToCart(c)])}
              scrollMtClass="scroll-mt-14"
            />
          )}
        </div>

        {cart.length > 0 && (
          <div className="animate-slide-up border-t border-slate-200 bg-white p-3 pb-safe shadow-top-soft">
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
            <Button size="lg" className="w-full" loading={enviando} onClick={confirmar}>
              <ShoppingCart className="h-5 w-5" />
              {`Enviar a barra · ${count} ${count === 1 ? "ítem" : "ítems"} · ${formatCents(totalCents)}`}
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
    precioUnitarioCents: centsFromStr(c.precio),
  };
}
