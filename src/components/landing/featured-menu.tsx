"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import { Spinner } from "@/components/ui/spinner";
import type { Menu } from "@/components/menu/types";

/** Carta pública (lectura) para la landing. Lee /api/menu sin sesión. */
export function FeaturedMenu() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<Menu>("/api/menu")
      .then(setMenu)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="mt-10 text-slate-400">La carta no está disponible en este momento.</p>;
  }

  if (!menu) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const categorias = menu.categorias.filter((c) => c.productos.length > 0);

  if (categorias.length === 0) {
    return <p className="mt-10 text-slate-400">Pronto publicaremos nuestra carta.</p>;
  }

  return (
    <div className="mt-12 space-y-12">
      {categorias.map((c) => (
        <div key={c.id}>
          <h3 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
            {c.nombre}
          </h3>
          <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {c.productos.map((p) => (
              <div
                key={p.id}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-200 pb-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {p.nombre}
                    {!p.disponible && (
                      <span className="ml-2 align-middle text-xs font-normal text-slate-400">
                        · agotado
                      </span>
                    )}
                  </p>
                  {p.descripcion && (
                    <p className="mt-0.5 text-sm leading-snug text-slate-500">{p.descripcion}</p>
                  )}
                </div>
                <span className="shrink-0 font-display font-semibold tabular-nums text-slate-900">
                  {fmt(p.precioBase)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
