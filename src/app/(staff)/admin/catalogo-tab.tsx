"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";

const ESTACION_DEMO = "demo-barra";

type Categoria = { id: string; nombre: string; orden: number; activa: boolean };
type Opcion = { id?: string; nombre: string; deltaPrecio: string; disponible: boolean; orden: number };
type Grupo = {
  id?: string;
  nombre: string;
  obligatorio: boolean;
  minSeleccion: number;
  maxSeleccion: number;
  orden: number;
  opciones: Opcion[];
};
type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioBase: string;
  prepTimeMinutes: number;
  disponible: boolean;
  orden: number;
  categoriaId: string;
  grupos: Grupo[];
};

export function CatalogoTab() {
  const [cats, setCats] = useState<Categoria[] | null>(null);
  const [prods, setProds] = useState<Producto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editandoMods, setEditandoMods] = useState<Producto | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        api.get<Categoria[]>("/api/admin/categorias"),
        api.get<Producto[]>("/api/admin/productos"),
      ]);
      setCats(c);
      setProds(p);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Error al cargar catálogo");
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

  if (!cats || !prods) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const nombreCat = new Map(cats.map((c) => [c.id, c.nombre]));

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Categorías */}
      <div>
        <h2 className="mb-2 font-semibold text-slate-900">Categorías</h2>
        <div className="mb-3 space-y-1">
          {cats.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <span>{c.nombre}</span>
              <button
                disabled={busy === c.id}
                onClick={() => run(c.id, () => api.del(`/api/admin/categorias/${c.id}`))}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <CategoriaForm
          orden={cats.length + 1}
          onCreate={(nombre, orden) =>
            run("nueva-cat", () => api.post("/api/admin/categorias", { nombre, orden }))
          }
        />
      </div>

      {/* Productos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Productos</h2>
        </div>
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        <div className="mb-4 space-y-2">
          {prods.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.nombre}</span>
                    <Badge tone="slate">{nombreCat.get(p.categoriaId) ?? "—"}</Badge>
                    {!p.disponible && <Badge tone="red">agotado</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">
                    {fmt(p.precioBase)} · {p.grupos.length} grupos mod.
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditandoMods(p)}
                  >
                    <Settings2 className="h-4 w-4" /> Modif.
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={() =>
                      run(p.id, () =>
                        api.patch(`/api/admin/productos/${p.id}`, { disponible: !p.disponible }),
                      )
                    }
                  >
                    {p.disponible ? "Agotar" : "Activar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={() => run(p.id, () => api.del(`/api/admin/productos/${p.id}`))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ProductoForm
          categorias={cats}
          onCreate={(body) =>
            run("nuevo-prod", () =>
              api.post("/api/admin/productos", { ...body, estacionId: ESTACION_DEMO, grupos: [] }),
            )
          }
        />
      </div>

      {editandoMods && (
        <ModificadoresModal
          producto={editandoMods}
          onClose={() => setEditandoMods(null)}
          onSaved={async () => {
            setEditandoMods(null);
            await cargar();
          }}
        />
      )}
    </div>
  );
}

function CategoriaForm({
  orden,
  onCreate,
}: {
  orden: number;
  onCreate: (nombre: string, orden: number) => void;
}) {
  const [nombre, setNombre] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        onCreate(nombre.trim(), orden);
        setNombre("");
      }}
      className="flex gap-2"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nueva categoría"
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <Button type="submit" size="sm">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

function ProductoForm({
  categorias,
  onCreate,
}: {
  categorias: Categoria[];
  onCreate: (body: {
    categoriaId: string;
    nombre: string;
    descripcion?: string;
    precioBase: string;
    prepTimeMinutes: number;
  }) => void;
}) {
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [prep, setPrep] = useState(5);

  return (
    <Card>
      <CardContent className="pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Nuevo producto</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const precioBase = (parseFloat(precio || "0") || 0).toFixed(2);
            if (!nombre.trim() || !categoriaId) return;
            onCreate({
              categoriaId,
              nombre: nombre.trim(),
              descripcion: descripcion.trim() || undefined,
              precioBase,
              prepTimeMinutes: prep,
            });
            setNombre("");
            setDescripcion("");
            setPrecio("");
            setPrep(5);
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            inputMode="decimal"
            placeholder="Precio (10.00)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            max={60}
            value={prep}
            onChange={(e) => setPrep(Number(e.target.value))}
            placeholder="Prep (min)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
          />
          <Button type="submit" className="sm:col-span-2">
            Crear producto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ModificadoresModal({
  producto,
  onClose,
  onSaved,
}: {
  producto: Producto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [grupos, setGrupos] = useState<Grupo[]>(
    producto.grupos.map((g) => ({
      nombre: g.nombre,
      obligatorio: g.obligatorio,
      minSeleccion: g.minSeleccion,
      maxSeleccion: g.maxSeleccion,
      orden: g.orden,
      opciones: g.opciones.map((o) => ({
        nombre: o.nombre,
        deltaPrecio: o.deltaPrecio,
        disponible: o.disponible,
        orden: o.orden,
      })),
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Grupo>) {
    setGrupos((gs) => gs.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function updateOpcion(gi: number, oi: number, patch: Partial<Opcion>) {
    setGrupos((gs) =>
      gs.map((g, i) =>
        i === gi ? { ...g, opciones: g.opciones.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g,
      ),
    );
  }

  async function guardar() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        grupos: grupos.map((g, gi) => ({
          nombre: g.nombre.trim(),
          obligatorio: g.obligatorio,
          minSeleccion: g.minSeleccion,
          maxSeleccion: g.maxSeleccion,
          orden: gi,
          opciones: g.opciones.map((o, oi) => ({
            nombre: o.nombre.trim(),
            deltaPrecio: (parseFloat(o.deltaPrecio || "0") || 0).toFixed(2),
            disponible: o.disponible,
            orden: oi,
          })),
        })),
      };
      await api.put(`/api/admin/productos/${producto.id}/modificadores`, payload);
      onSaved();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-900">Modificadores · {producto.nombre}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {grupos.map((g, gi) => (
            <div key={gi} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={g.nombre}
                  onChange={(e) => update(gi, { nombre: e.target.value })}
                  placeholder="Nombre del grupo"
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  onClick={() => setGrupos((gs) => gs.filter((_, i) => i !== gi))}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={g.obligatorio}
                    onChange={(e) => update(gi, { obligatorio: e.target.checked })}
                  />
                  obligatorio
                </label>
                <label className="flex items-center gap-1">
                  min
                  <input
                    type="number"
                    min={0}
                    value={g.minSeleccion}
                    onChange={(e) => update(gi, { minSeleccion: Number(e.target.value) })}
                    className="w-14 rounded border border-slate-300 px-1 py-0.5"
                  />
                </label>
                <label className="flex items-center gap-1">
                  max
                  <input
                    type="number"
                    min={1}
                    value={g.maxSeleccion}
                    onChange={(e) => update(gi, { maxSeleccion: Number(e.target.value) })}
                    className="w-14 rounded border border-slate-300 px-1 py-0.5"
                  />
                </label>
              </div>
              <div className="space-y-1.5">
                {g.opciones.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={o.nombre}
                      onChange={(e) => updateOpcion(gi, oi, { nombre: e.target.value })}
                      placeholder="Opción"
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      value={o.deltaPrecio}
                      onChange={(e) => updateOpcion(gi, oi, { deltaPrecio: e.target.value })}
                      inputMode="decimal"
                      placeholder="+0.00"
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() =>
                        setGrupos((gs) =>
                          gs.map((gg, i) =>
                            i === gi
                              ? { ...gg, opciones: gg.opciones.filter((_, j) => j !== oi) }
                              : gg,
                          ),
                        )
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    update(gi, {
                      opciones: [
                        ...g.opciones,
                        { nombre: "", deltaPrecio: "0.00", disponible: true, orden: g.opciones.length },
                      ],
                    })
                  }
                  className="text-xs text-slate-500 underline"
                >
                  + opción
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setGrupos((gs) => [
                ...gs,
                {
                  nombre: "",
                  obligatorio: false,
                  minSeleccion: 0,
                  maxSeleccion: 1,
                  orden: gs.length,
                  opciones: [{ nombre: "", deltaPrecio: "0.00", disponible: true, orden: 0 }],
                },
              ])
            }
            className="flex items-center gap-1 text-sm font-medium text-slate-700"
          >
            <Plus className="h-4 w-4" /> Agregar grupo
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={guardar}>
            {busy ? "Guardando…" : "Guardar modificadores"}
          </Button>
        </div>
      </div>
    </div>
  );
}
