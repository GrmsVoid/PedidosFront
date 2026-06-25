"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { formatCents } from "@/lib/price";
import { MenuView } from "./menu-view";
import { ModifierModal } from "./modifier-modal";
import type { CartItem, Menu, MenuProducto } from "./types";

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
        items: cart.map((c) => ({
          productoId: c.productoId,
          cantidad: c.cantidad,
          opcionesIds: c.opcionesIds,
          notaLibre: c.notaLibre,
        })),
      });
      onCreated();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo enviar el pedido");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex h-[92vh] w-full max-w-md flex-col rounded-t-2xl bg-slate-50 sm:h-[85vh] sm:rounded-2xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white p-4">
          <div>
            <h2 className="font-semibold text-slate-900">Pedido manual</h2>
            <p className="text-xs text-slate-500">Mesa {mesaLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          {!menu ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <MenuView menu={menu} onSelect={(p) => setModalProducto(p)} />
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 max-h-28 space-y-1 overflow-y-auto">
              {cart.map((it) => (
                <div key={it.uid} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-700">
                    {it.cantidad}× {it.nombre}
                    {it.opcionesLabel && <span className="text-slate-400"> · {it.opcionesLabel}</span>}
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
            <Button size="lg" className="w-full" disabled={enviando} onClick={confirmar}>
              <ShoppingCart className="h-5 w-5" />
              {enviando
                ? "Enviando…"
                : `Enviar a barra · ${count} ${count === 1 ? "ítem" : "ítems"} · ${formatCents(totalCents)}`}
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
