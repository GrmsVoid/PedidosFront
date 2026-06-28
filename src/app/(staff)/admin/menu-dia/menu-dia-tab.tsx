"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Power, Tag, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import { inputCls } from "../finanzas/rango";

export function MenuDiaTab() {
  const [sub, setSub] = useState<"precios" | "combos">("precios");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Menú del día</h1>
        <p className="text-sm text-slate-500">Promociones de hoy y combos a precio fijo.</p>
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {([
          ["precios", "Precios del día", Tag],
          ["combos", "Combos", UtensilsCrossed],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              sub === id ? "border-ink text-ink" : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {sub === "precios" ? <Precios /> : <Combos />}
    </div>
  );
}

/* ---------------- Precios del día ---------------- */

type ProdDia = {
  productoId: string;
  nombre: string;
  categoria: string;
  precioBase: string;
  precioEspecial: string | null;
  precioDiaId: string | null;
};

function hoyYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Precios() {
  const [fecha, setFecha] = useState(hoyYmd);
  const [list, setList] = useState<ProdDia[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const r = await api.get<{ productos: ProdDia[] }>(`/api/admin/menu-dia?fecha=${fecha}`);
      setList(r.productos);
      setEdits(Object.fromEntries(r.productos.map((p) => [p.productoId, p.precioEspecial ?? ""])));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar");
    }
  }, [fecha]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(p: ProdDia) {
    const raw = (edits[p.productoId] ?? "").trim();
    setBusy(p.productoId);
    setError(null);
    try {
      if (raw && parseFloat(raw) > 0) {
        await api.put("/api/admin/menu-dia", {
          productoId: p.productoId,
          fecha,
          precio: (parseFloat(raw) || 0).toFixed(2),
        });
      } else if (p.precioDiaId) {
        await api.del(`/api/admin/menu-dia/${p.precioDiaId}`);
      }
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block w-fit">
        <span className="mb-1 block text-xs font-medium text-slate-500">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!list ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <Card key={p.productoId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.nombre}</span>
                    <Badge tone="slate">{p.categoria}</Badge>
                    {p.precioEspecial && <Badge tone="amber">promo</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">Base {fmt(p.precioBase)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      S/
                    </span>
                    <input
                      value={edits[p.productoId] ?? ""}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.productoId]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && guardar(p)}
                      inputMode="decimal"
                      placeholder="precio hoy"
                      className={cn(inputCls, "w-32 pl-8")}
                    />
                  </div>
                  <button
                    onClick={() => guardar(p)}
                    disabled={busy === p.productoId}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-sm font-medium text-white transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Guardar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">
        Deja el precio en blanco y guarda para quitar la promo. Aplica solo a la fecha elegida.
      </p>
    </div>
  );
}

/* ---------------- Combos ---------------- */

type ComboItem = { productoId: string; nombre: string; cantidad: number };
type Combo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  estacionId: string;
  items: ComboItem[];
};
type ProductoMin = { id: string; nombre: string; precioBase: string };

function Combos() {
  const [list, setList] = useState<Combo[] | null>(null);
  const [productos, setProductos] = useState<ProductoMin[]>([]);
  const [modal, setModal] = useState<{ combo: Combo | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [c, p] = await Promise.all([
        api.get<Combo[]>("/api/admin/combos"),
        api.get<ProductoMin[]>("/api/admin/productos"),
      ]);
      setList(c);
      setProductos(p);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar");
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Operación fallida");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ combo: null })}>
          <Plus className="h-4 w-4" /> Nuevo combo
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!list ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-400">Aún no hay combos.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((c) => (
            <Card key={c.id} className={cn(!c.disponible && "opacity-60")}>
              <CardContent className="space-y-2 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{c.nombre}</span>
                      {!c.disponible && <Badge tone="slate">oculto</Badge>}
                    </div>
                    {c.descripcion && <p className="text-xs text-slate-400">{c.descripcion}</p>}
                  </div>
                  <span className="shrink-0 font-display font-semibold text-slate-900">{fmt(c.precio)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.items.map((i) => (
                    <span key={i.productoId} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {i.cantidad}× {i.nombre}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => run(c.id, () => api.patch(`/api/admin/combos/${c.id}`, { disponible: !c.disponible }))}>
                    <Power className="h-4 w-4" /> {c.disponible ? "Ocultar" : "Mostrar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModal({ combo: c })}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => { if (window.confirm(`¿Eliminar "${c.nombre}"?`)) run(c.id, () => api.del(`/api/admin/combos/${c.id}`)); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <ComboModal
          combo={modal.combo}
          productos={productos}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await cargar();
          }}
        />
      )}
    </div>
  );
}

function ComboModal({
  combo,
  productos,
  onClose,
  onSaved,
}: {
  combo: Combo | null;
  productos: ProductoMin[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!combo;
  const [nombre, setNombre] = useState(combo?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(combo?.descripcion ?? "");
  const [precio, setPrecio] = useState(combo?.precio ?? "");
  const [items, setItems] = useState<{ productoId: string; cantidad: number }[]>(
    combo?.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) ?? [],
  );
  const [sel, setSel] = useState(productos[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nombreById = new Map(productos.map((p) => [p.id, p.nombre]));

  function addItem() {
    if (!sel) return;
    setItems((it) => (it.some((x) => x.productoId === sel) ? it : [...it, { productoId: sel, cantidad: 1 }]));
  }

  async function guardar() {
    if (!nombre.trim() || !precio.trim() || items.length === 0) {
      setError("Completa nombre, precio y al menos un producto");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || (editing ? null : undefined),
      precio: (parseFloat(precio) || 0).toFixed(2),
      items,
    };
    try {
      if (editing && combo) await api.patch(`/api/admin/combos/${combo.id}`, payload);
      else await api.post("/api/admin/combos", payload);
      onSaved();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-display font-semibold tracking-tight text-slate-900">
            {editing ? "Editar combo" : "Nuevo combo"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del combo" className={inputCls + " w-full"} />
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" className={inputCls + " w-full"} />
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" placeholder="Precio del combo (S/)" className={inputCls + " w-full"} />

          <div className="rounded-lg border border-slate-200 p-3">
            <span className="mb-2 block text-sm font-medium text-slate-700">Productos del combo</span>
            <div className="mb-2 flex gap-2">
              <select value={sel} onChange={(e) => setSel(e.target.value)} className={inputCls + " w-full"}>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400">Agrega productos al combo.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((i, idx) => (
                  <li key={i.productoId} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-slate-700">{nombreById.get(i.productoId) ?? "—"}</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={i.cantidad}
                      onChange={(e) =>
                        setItems((arr) => arr.map((x, j) => (j === idx ? { ...x, cantidad: Number(e.target.value) } : x)))
                      }
                      className="w-16 rounded-md border border-slate-200 px-2 py-1"
                    />
                    <button onClick={() => setItems((arr) => arr.filter((_, j) => j !== idx))} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
