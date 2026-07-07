"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
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
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.nombre}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md animate-slide-up flex-col rounded-t-3xl bg-white shadow-lift sm:animate-scale-in sm:rounded-3xl"
      >
        {/* Asa (móvil) */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 pt-3 sm:pt-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
              {producto.nombre}
            </h2>
            {producto.descripcion && (
              <p className="mt-0.5 text-sm text-slate-500">{producto.descripcion}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-200 hover:text-ink active:scale-90"
          >
            <X className="h-4 w-4" />
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
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150 active:scale-[0.99]",
                          checked
                            ? "border-ink bg-ink/[0.04] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                          !o.disponible && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-[18px] w-[18px] items-center justify-center border transition-all duration-150",
                              g.maxSeleccion === 1 ? "rounded-full" : "rounded-md",
                              checked
                                ? "scale-105 border-ink bg-ink text-white"
                                : "border-slate-300 bg-white",
                            )}
                          >
                            {checked &&
                              (g.maxSeleccion === 1 ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              ) : (
                                <Check className="h-3 w-3" strokeWidth={3} />
                              ))}
                          </span>
                          <span className={cn(checked && "font-medium text-slate-900")}>
                            {o.nombre}
                          </span>
                          {!o.disponible && <span className="text-xs text-slate-400">(agotado)</span>}
                        </span>
                        {deltaCents > 0 && (
                          <span
                            className={cn(
                              "tabular-nums",
                              checked ? "font-medium text-slate-700" : "text-slate-500",
                            )}
                          >
                            +{formatCents(deltaCents)}
                          </span>
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
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm transition-colors placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 p-4 pb-safe">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={cantidad <= 1}
              aria-label="Restar"
              className="rounded-lg p-2 text-slate-600 transition-all duration-150 hover:bg-slate-100 active:scale-90 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span key={cantidad} className="w-7 animate-pop text-center font-semibold tabular-nums">
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad((c) => Math.min(50, c + 1))}
              aria-label="Sumar"
              className="rounded-lg p-2 text-slate-600 transition-all duration-150 hover:bg-slate-100 active:scale-90"
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
