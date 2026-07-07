"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatStr } from "@/lib/price";
import type { Menu, MenuCombo, MenuProducto } from "./types";

type Pagina =
  | { id: string; nombre: string; tipo: "categoria"; productos: MenuProducto[] }
  | { id: string; nombre: string; tipo: "combos"; combos: MenuCombo[] };

/**
 * La carta del negocio como un libro: cada sección (en el orden en que el admin
 * organizó su catálogo) es una página; se hojea con swipe, índice o flechas.
 */
export function CartaView({
  menu,
  onSelect,
  onAddCombo,
}: {
  menu: Menu;
  onSelect: (p: MenuProducto) => void;
  onAddCombo: (c: MenuCombo) => void;
}) {
  const paginas = useMemo<Pagina[]>(() => {
    const cats: Pagina[] = menu.categorias
      .filter((c) => c.productos.length > 0)
      .map((c) => ({ id: c.id, nombre: c.nombre, tipo: "categoria", productos: c.productos }));
    if (menu.combos.length > 0) {
      cats.push({ id: "__combos", nombre: "Combos", tipo: "combos", combos: menu.combos });
    }
    return cats;
  }, [menu]);

  const [activa, setActiva] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef<HTMLDivElement | null>(null);

  function irA(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const destino = Math.min(Math.max(idx, 0), paginas.length - 1);
    track.scrollTo({ left: destino * track.clientWidth, behavior: "smooth" });
  }

  function onTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== activa && idx >= 0 && idx < paginas.length) {
      setActiva(idx);
      // Mantén visible el nombre de la sección activa en el índice
      const chip = indexRef.current?.children[idx] as HTMLElement | undefined;
      chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  if (paginas.length === 0) {
    return (
      <p className="py-16 text-center font-carta italic text-slate-400">
        La carta está en preparación…
      </p>
    );
  }

  return (
    <div className="-mx-4 -my-4">
      {/* Índice de secciones */}
      <div className="border-b border-slate-200/70 bg-paper/95">
        <div
          ref={indexRef}
          className="no-scrollbar flex items-center gap-5 overflow-x-auto px-5 pt-2.5"
        >
          {paginas.map((p, i) => (
            <button
              key={p.id}
              onClick={() => irA(i)}
              className={cn(
                "shrink-0 border-b-2 pb-2 font-carta text-[15px] transition-all duration-200",
                i === activa
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent italic text-slate-400 hover:text-slate-600",
              )}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <p className="px-5 pb-1.5 pt-1 text-center text-[11px] text-slate-400">
          Toca un plato para pedirlo · desliza para cambiar de sección
        </p>
      </div>

      {/* Páginas del libro */}
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="no-scrollbar flex h-[calc(100dvh-190px)] snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {paginas.map((pag, i) => (
            <section
              key={pag.id}
              aria-label={pag.nombre}
              className={cn(
                "w-full shrink-0 snap-center overflow-y-auto px-6 pb-32 pt-7",
                // Lomo del libro: sombra sutil en el borde interior de cada página
                i > 0 && "shadow-[inset_10px_0_14px_-12px_rgba(11,11,13,0.25)]",
              )}
            >
              {/* Encabezado de sección */}
              <header className="mb-6 text-center">
                <p className="font-carta text-[11px] uppercase tracking-[0.35em] text-slate-400">
                  La carta
                </p>
                <h2 className="mt-1.5 font-carta text-3xl font-semibold text-slate-900">
                  {pag.nombre}
                </h2>
                <div className="mt-3 flex items-center justify-center gap-3 text-slate-300" aria-hidden>
                  <span className="h-px w-12 bg-slate-300" />
                  <span className="font-carta leading-none">✦</span>
                  <span className="h-px w-12 bg-slate-300" />
                </div>
              </header>

              {/* Platos */}
              <div className="mx-auto max-w-md divide-y divide-slate-200/50">
                {pag.tipo === "categoria" &&
                  pag.productos.map((p) => (
                    <PlatoRow key={p.id} producto={p} onSelect={onSelect} />
                  ))}
                {pag.tipo === "combos" &&
                  pag.combos.map((c) => <ComboRow key={c.id} combo={c} onAdd={onAddCombo} />)}
              </div>

              {/* Pie de página */}
              <footer className="mt-8 text-center">
                <span className="font-carta text-slate-300" aria-hidden>
                  ✦
                </span>
                {i < paginas.length - 1 ? (
                  <button
                    onClick={() => irA(i + 1)}
                    className="mx-auto mt-2 flex items-center gap-1 font-carta text-sm italic text-slate-400 transition-colors hover:text-ink"
                  >
                    {paginas[i + 1].nombre} <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <p className="mt-2 font-carta text-sm italic text-slate-400">
                    ¡Buen provecho!
                  </p>
                )}
              </footer>
            </section>
          ))}
        </div>

        {/* Flechas (pantallas con puntero) */}
        {activa > 0 && (
          <button
            onClick={() => irA(activa - 1)}
            aria-label="Sección anterior"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 shadow-soft backdrop-blur transition-all hover:text-ink active:scale-90 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {activa < paginas.length - 1 && (
          <button
            onClick={() => irA(activa + 1)}
            aria-label="Sección siguiente"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 shadow-soft backdrop-blur transition-all hover:text-ink active:scale-90 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Numeración de página */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="rounded-full bg-paper/90 px-3 py-1 font-carta text-xs italic text-slate-400 backdrop-blur">
            {activa + 1} de {paginas.length}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- filas ---------- */

function PlatoRow({
  producto: p,
  onSelect,
}: {
  producto: MenuProducto;
  onSelect: (p: MenuProducto) => void;
}) {
  return (
    <button
      disabled={!p.disponible}
      onClick={() => onSelect(p)}
      className={cn(
        "block w-full py-3.5 text-left transition-colors duration-150",
        p.disponible ? "active:bg-ink/[0.04]" : "opacity-50",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-carta text-[17px] leading-snug text-slate-900">{p.nombre}</span>
        <span
          aria-hidden
          className="mx-1 flex-1 -translate-y-0.5 border-b border-dotted border-slate-300"
        />
        {p.disponible ? (
          <span className="shrink-0 font-carta text-[16px] tabular-nums text-slate-900">
            {p.precioAntes && (
              <span className="mr-1.5 text-sm text-slate-400 line-through">
                {formatStr(p.precioAntes)}
              </span>
            )}
            {formatStr(p.precioBase)}
          </span>
        ) : (
          <span className="shrink-0 font-carta text-sm italic text-slate-400">agotado</span>
        )}
      </div>
      {p.descripcion && (
        <p className="mt-1 pr-12 font-carta text-sm italic leading-snug text-slate-500">
          {p.descripcion}
        </p>
      )}
      {(p.precioAntes || p.grupos.length > 0) && (
        <p className="mt-1 flex gap-2 text-[10px] uppercase tracking-[0.18em]">
          {p.precioAntes && <span className="font-semibold text-amber-600">Promo del día</span>}
          {p.grupos.length > 0 && <span className="text-slate-400">Personalizable</span>}
        </p>
      )}
    </button>
  );
}

function ComboRow({ combo: c, onAdd }: { combo: MenuCombo; onAdd: (c: MenuCombo) => void }) {
  return (
    <button
      onClick={() => onAdd(c)}
      className="block w-full py-3.5 text-left transition-colors duration-150 active:bg-ink/[0.04]"
    >
      <div className="flex items-baseline gap-2">
        <span className="font-carta text-[17px] leading-snug text-slate-900">{c.nombre}</span>
        <span
          aria-hidden
          className="mx-1 flex-1 -translate-y-0.5 border-b border-dotted border-slate-300"
        />
        <span className="shrink-0 font-carta text-[16px] tabular-nums text-slate-900">
          {formatStr(c.precio)}
        </span>
      </div>
      <p className="mt-1 pr-12 font-carta text-sm italic leading-snug text-slate-500">
        {c.items.map((it) => `${it.cantidad}× ${it.nombre}`).join(" · ")}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em]">
        <span className="font-semibold text-amber-600">Combo a precio fijo</span>
      </p>
    </button>
  );
}
