"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatStr } from "@/lib/price";
import type { Menu, MenuCombo, MenuProducto } from "./types";

const COMBOS_ID = "__combos";

export function MenuView({
  menu,
  onSelect,
  onAddCombo,
  stickyTopClass = "top-0",
  scrollMtClass = "scroll-mt-16",
}: {
  menu: Menu;
  onSelect: (p: MenuProducto) => void;
  onAddCombo?: (c: MenuCombo) => void;
  /** Offset del sticky de los chips (depende del header que tenga encima). */
  stickyTopClass?: string;
  /** scroll-margin-top de cada sección para que el título no quede tapado. */
  scrollMtClass?: string;
}) {
  const hayCombos = !!onAddCombo && menu.combos.length > 0;
  const secciones = useMemo(() => {
    const cats = menu.categorias.map((c) => ({ id: c.id, nombre: c.nombre }));
    return hayCombos ? [...cats, { id: COMBOS_ID, nombre: "Combos" }] : cats;
  }, [menu, hayCombos]);

  const [activa, setActiva] = useState<string | null>(secciones[0]?.id ?? null);
  const seccionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const barRef = useRef<HTMLDivElement | null>(null);
  const clickLock = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll-spy: resalta el chip de la sección visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (clickLock.current) return;
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visibles[0]?.target.getAttribute("data-seccion");
        if (id) setActiva(id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const s of secciones) {
      const el = seccionRefs.current[s.id];
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [secciones]);

  // Mantén el chip activo visible dentro de la barra
  useEffect(() => {
    if (!activa) return;
    const bar = barRef.current;
    const chip = chipRefs.current[activa];
    if (!bar || !chip) return;
    bar.scrollTo({
      left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activa]);

  function irA(id: string) {
    setActiva(id);
    // Evita que el observer pise la selección mientras dura el scroll suave
    if (clickLock.current) clearTimeout(clickLock.current);
    clickLock.current = setTimeout(() => (clickLock.current = null), 700);
    seccionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-7 pb-32">
      {/* Chips de categorías */}
      {secciones.length > 1 && (
        <div
          ref={barRef}
          className={cn(
            "no-scrollbar sticky z-[5] -mx-4 flex gap-2 overflow-x-auto border-b border-slate-200/60 bg-paper/90 px-4 py-2.5 backdrop-blur",
            stickyTopClass,
          )}
        >
          {secciones.map((s) => (
            <button
              key={s.id}
              ref={(el) => {
                chipRefs.current[s.id] = el;
              }}
              onClick={() => irA(s.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95",
                activa === s.id
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300",
              )}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {menu.categorias.map((cat) => (
        <section
          key={cat.id}
          data-seccion={cat.id}
          ref={(el) => {
            seccionRefs.current[cat.id] = el;
          }}
          className={scrollMtClass}
        >
          <h2 className="mb-2.5 px-1 font-display text-lg font-semibold tracking-tight text-slate-900">
            {cat.nombre}
          </h2>
          <div className="space-y-2">
            {cat.productos.map((p, i) => (
              <button
                key={p.id}
                disabled={!p.disponible}
                onClick={() => onSelect(p)}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className={cn(
                  "group flex w-full animate-fade-up items-center justify-between gap-3 rounded-sm border border-line bg-panel p-3.5 text-left shadow-soft transition-all duration-200",
                  p.disponible
                    ? "hover:-translate-y-0.5 hover:border-brand hover:bg-white hover:shadow-soft active:translate-y-0 active:scale-[0.99]"
                    : "opacity-55 grayscale",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.nombre}</span>
                    {!p.disponible && <Badge tone="red">Agotado</Badge>}
                  </div>
                  {p.descripcion && (
                    <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-slate-500">
                      {p.descripcion}
                    </p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                    {p.precioAntes && (
                      <span className="font-normal text-slate-400 line-through">
                        {formatStr(p.precioAntes)}
                      </span>
                    )}
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatStr(p.precioBase)}
                    </span>
                    {p.precioAntes && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <Sparkles className="h-3 w-3" /> promo
                      </span>
                    )}
                    {p.grupos.length > 0 && (
                      <span className="font-normal text-slate-400">· personalizable</span>
                    )}
                  </p>
                </div>
                {p.disponible && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-ink group-hover:text-white group-active:scale-90">
                    <Plus className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      {hayCombos && (
        <section
          data-seccion={COMBOS_ID}
          ref={(el) => {
            seccionRefs.current[COMBOS_ID] = el;
          }}
          className={scrollMtClass}
        >
          <h2 className="mb-2.5 px-1 font-display text-lg font-semibold tracking-tight text-slate-900">
            Combos
          </h2>
          <div className="space-y-2">
            {menu.combos.map((c, i) => (
              <button
                key={c.id}
                onClick={() => onAddCombo!(c)}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className="group flex w-full animate-fade-up items-center justify-between gap-3 rounded-sm border border-brand/25 bg-accent-soft p-3.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:bg-white hover:shadow-soft active:translate-y-0 active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{c.nombre}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <Sparkles className="h-3 w-3" /> combo
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">
                    {c.items.map((it) => `${it.cantidad}× ${it.nombre}`).join(" + ")}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-slate-900">
                    {formatStr(c.precio)}
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-all duration-200 group-hover:bg-amber-500 group-hover:text-white group-active:scale-90">
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
