"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { centsFromStr, formatCents } from "@/lib/price";
import type { CartItem, MenuProducto } from "./types";

export function ModifierModal({
  producto,
  onClose,
  onAdd,
}: {
  producto: MenuProducto;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({});
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");

  function toggle(grupoId: string, opcionId: string, maxSeleccion: number) {
    setSeleccion((prev) => {
      const actual = prev[grupoId] ?? [];
      if (maxSeleccion === 1) {
        return { ...prev, [grupoId]: [opcionId] };
      }
      if (actual.includes(opcionId)) {
        return { ...prev, [grupoId]: actual.filter((x) => x !== opcionId) };
      }
      if (actual.length >= maxSeleccion) return prev;
      return { ...prev, [grupoId]: [...actual, opcionId] };
    });
  }

  const opcionesIds = useMemo(() => Object.values(seleccion).flat(), [seleccion]);

  const faltanObligatorios = producto.grupos.filter(
    (g) => g.obligatorio && (seleccion[g.id]?.length ?? 0) < g.minSeleccion,
  );

  const precioUnitarioCents = useMemo(() => {
    let cents = centsFromStr(producto.precioBase);
    for (const g of producto.grupos) {
      for (const o of g.opciones) {
        if (opcionesIds.includes(o.id)) cents += centsFromStr(o.deltaPrecio);
      }
    }
    return cents;
  }, [producto, opcionesIds]);

  function agregar() {
    if (faltanObligatorios.length > 0) return;
    const labels: string[] = [];
    for (const g of producto.grupos) {
      for (const o of g.opciones) {
        if (opcionesIds.includes(o.id)) labels.push(o.nombre);
      }
    }
    onAdd({
      uid: crypto.randomUUID(),
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad,
      opcionesIds,
      opcionesLabel: labels.join(", "),
      notaLibre: nota.trim() || null,
      precioUnitarioCents,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{producto.nombre}</h2>
            {producto.descripcion && (
              <p className="mt-0.5 text-sm text-slate-500">{producto.descripcion}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {producto.grupos.map((g) => {
            const sel = seleccion[g.id] ?? [];
            return (
              <div key={g.id}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-medium text-slate-800">{g.nombre}</h3>
                  {g.obligatorio ? (
                    <Badge tone="amber">Obligatorio</Badge>
                  ) : (
                    <Badge tone="slate">Opcional</Badge>
                  )}
                  {g.maxSeleccion > 1 && (
                    <span className="text-xs text-slate-400">máx {g.maxSeleccion}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {g.opciones.map((o) => {
                    const checked = sel.includes(o.id);
                    const deltaCents = centsFromStr(o.deltaPrecio);
                    return (
                      <button
                        key={o.id}
                        disabled={!o.disponible}
                        onClick={() => toggle(g.id, o.id, g.maxSeleccion)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          checked
                            ? "border-slate-900 bg-slate-900/5"
                            : "border-slate-200 hover:bg-slate-50",
                          !o.disponible && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center border",
                              g.maxSeleccion === 1 ? "rounded-full" : "rounded",
                              checked ? "border-slate-900 bg-slate-900" : "border-slate-300",
                            )}
                          >
                            {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          {o.nombre}
                          {!o.disponible && <span className="text-xs text-slate-400">(agotado)</span>}
                        </span>
                        {deltaCents > 0 && (
                          <span className="text-slate-500">+{formatCents(deltaCents)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="mb-2 font-medium text-slate-800">Nota (opcional)</h3>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Ej: sin azúcar, bien caliente…"
              className="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-2 py-1">
            <button
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              aria-label="Restar"
              className="rounded p-1 hover:bg-slate-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-medium">{cantidad}</span>
            <button
              onClick={() => setCantidad((c) => Math.min(50, c + 1))}
              aria-label="Sumar"
              className="rounded p-1 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="lg"
            className="flex-1"
            disabled={faltanObligatorios.length > 0}
            onClick={agregar}
          >
            {faltanObligatorios.length > 0
              ? `Elige ${faltanObligatorios[0].nombre}`
              : `Agregar · ${formatCents(precioUnitarioCents * cantidad)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
