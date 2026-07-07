"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Check, Layers, Move, PenLine, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import {
  centroide,
  mesaTamano,
  pisoDeMesa,
  type Plano,
  type PlanoMesa,
  type PlanoPiso,
  type PlanoPunto,
  type PlanoZona,
} from "@/components/plano/types";

type PlanoResp = { plano: Plano | null; mesas: PlanoMesa[] };
type Modo = "mesas" | "zona";

const SNAP = 5; // cm
const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const mToCm = (m: number) => Math.round(m * 100);

const NOMBRES_PISO = ["1er piso", "2do piso", "3er piso", "4to piso", "5to piso"];

export function SalonTab() {
  const [cargado, setCargado] = useState(false);
  const [mesas, setMesas] = useState<PlanoMesa[]>([]);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [pisoActivoId, setPisoActivoId] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, PlanoPunto>>({});
  const [modo, setModo] = useState<Modo>("mesas");
  const [dibujo, setDibujo] = useState<PlanoPunto[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aviso, setAviso] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  // Form de creación (si aún no hay plano)
  const [anchoM, setAnchoM] = useState("10");
  const [altoM, setAltoM] = useState("8");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((tone: "ok" | "err", msg: string) => {
    setAviso({ tone, msg });
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  /** Carga (o recarga para descartar cambios) el plano y las mesas del servidor. */
  const cargar = useCallback(async () => {
    try {
      const r = await api.get<PlanoResp>("/api/admin/plano");
      setMesas(r.mesas);
      setPlano(r.plano);
      setPisoActivoId((prev) => {
        const pisos = r.plano?.pisos ?? [];
        return pisos.some((p) => p.id === prev) ? prev : (pisos[0]?.id ?? null);
      });
      // Posiciones iniciales; las mesas apiladas en un mismo punto se abren en abanico
      const vistos = new Map<string, number>();
      const p: Record<string, PlanoPunto> = {};
      for (const m of r.mesas) {
        const key = `${m.posicionX},${m.posicionY}`;
        const rep = vistos.get(key) ?? 0;
        vistos.set(key, rep + 1);
        p[m.id] = {
          x: Math.max(60, m.posicionX + rep * 100),
          y: Math.max(60, m.posicionY + (rep > 0 ? 60 : 0)),
        };
      }
      setPos(p);
      if (r.plano?.pisos[0]) {
        setAnchoM(String(r.plano.pisos[0].ancho / 100));
        setAltoM(String(r.plano.pisos[0].alto / 100));
      }
      setDibujo([]);
      setModo("mesas");
      setDirty(false);
    } catch (e) {
      flash("err", e instanceof ClientApiError ? e.message : "No se pudo cargar el plano");
    } finally {
      setCargado(true);
    }
  }, [flash]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const piso = plano?.pisos.find((p) => p.id === pisoActivoId) ?? plano?.pisos[0] ?? null;
  const mesasDelPiso = plano && piso ? mesas.filter((m) => pisoDeMesa(m, plano) === piso.id) : [];
  const mesasOtrosPisos = plano && piso ? mesas.filter((m) => pisoDeMesa(m, plano) !== piso.id) : [];

  function actualizarPiso(cambios: Partial<PlanoPiso>) {
    if (!plano || !piso) return;
    setPlano({
      ...plano,
      pisos: plano.pisos.map((p) => (p.id === piso.id ? { ...p, ...cambios } : p)),
    });
    setDirty(true);
  }

  function toSvg(e: React.PointerEvent | React.MouseEvent): PlanoPunto | null {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  }

  function clampMesa(m: PlanoMesa, p: PlanoPunto): PlanoPunto {
    if (!piso) return p;
    const { w, h } = mesaTamano(m.capacidad);
    return {
      x: Math.min(Math.max(p.x, w / 2), piso.ancho - w / 2),
      y: Math.min(Math.max(p.y, h / 2), piso.alto - h / 2),
    };
  }

  /* ---------- interacción ---------- */

  function onMesaPointerDown(e: React.PointerEvent, m: PlanoMesa) {
    if (modo !== "mesas") return;
    const pt = toSvg(e);
    if (!pt) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const actual = pos[m.id] ?? { x: m.posicionX, y: m.posicionY };
    dragRef.current = { id: m.id, dx: pt.x - actual.x, dy: pt.y - actual.y };
  }

  function onSvgPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = toSvg(e);
    const mesa = mesas.find((m) => m.id === drag.id);
    if (!pt || !mesa) return;
    const destino = clampMesa(mesa, { x: snap(pt.x - drag.dx), y: snap(pt.y - drag.dy) });
    setPos((prev) => ({ ...prev, [drag.id]: destino }));
    setDirty(true);
  }

  function onSvgPointerUp() {
    dragRef.current = null;
  }

  function onSvgClick(e: React.MouseEvent) {
    if (modo !== "zona" || !piso) return;
    const pt = toSvg(e);
    if (!pt) return;
    const p = {
      x: snap(Math.min(Math.max(pt.x, 0), piso.ancho)),
      y: snap(Math.min(Math.max(pt.y, 0), piso.alto)),
    };
    setDibujo((d) => [...d, p]);
  }

  function cerrarZona() {
    if (!piso || dibujo.length < 3) return;
    const zona: PlanoZona = {
      id: crypto.randomUUID(),
      nombre: `Zona ${piso.zonas.length + 1}`,
      puntos: dibujo,
    };
    actualizarPiso({ zonas: [...piso.zonas, zona] });
    setDibujo([]);
    setModo("mesas");
  }

  function cancelarDibujo() {
    setDibujo([]);
    setModo("mesas");
  }

  function renombrarZona(id: string, nombre: string) {
    if (!piso) return;
    actualizarPiso({ zonas: piso.zonas.map((z) => (z.id === id ? { ...z, nombre } : z)) });
  }

  function quitarZona(id: string) {
    if (!piso) return;
    actualizarPiso({ zonas: piso.zonas.filter((z) => z.id !== id) });
  }

  /* ---------- pisos ---------- */

  function agregarPiso() {
    if (!plano || plano.pisos.length >= 5) return;
    const base = plano.pisos[plano.pisos.length - 1];
    const nuevo: PlanoPiso = {
      id: crypto.randomUUID(),
      nombre: NOMBRES_PISO[plano.pisos.length] ?? `Piso ${plano.pisos.length + 1}`,
      ancho: base.ancho,
      alto: base.alto,
      zonas: [],
    };
    setPlano({ ...plano, pisos: [...plano.pisos, nuevo] });
    setPisoActivoId(nuevo.id);
    setAnchoM(String(nuevo.ancho / 100));
    setAltoM(String(nuevo.alto / 100));
    setDirty(true);
  }

  function renombrarPiso(id: string, nombre: string) {
    if (!plano) return;
    setPlano({ ...plano, pisos: plano.pisos.map((p) => (p.id === id ? { ...p, nombre } : p)) });
    setDirty(true);
  }

  function quitarPiso(id: string) {
    if (!plano || plano.pisos.length <= 1) return;
    const conMesas = mesas.some((m) => pisoDeMesa(m, plano) === id);
    if (conMesas) {
      flash("err", "Ese piso tiene mesas: muévelas a otro piso antes de eliminarlo.");
      return;
    }
    const pisos = plano.pisos.filter((p) => p.id !== id);
    setPlano({ ...plano, pisos });
    if (pisoActivoId === id) setPisoActivoId(pisos[0].id);
    setDirty(true);
  }

  function cambiarDePiso(pisoId: string) {
    const p = plano?.pisos.find((x) => x.id === pisoId);
    if (!p) return;
    setPisoActivoId(pisoId);
    setAnchoM(String(p.ancho / 100));
    setAltoM(String(p.alto / 100));
    setDibujo([]);
  }

  /** Trae una mesa de otro piso al piso activo (queda al centro para arrastrarla). */
  function traerMesa(m: PlanoMesa) {
    if (!piso) return;
    setMesas((prev) => prev.map((x) => (x.id === m.id ? { ...x, pisoId: piso.id } : x)));
    setPos((prev) => ({
      ...prev,
      [m.id]: clampMesa(m, { x: snap(piso.ancho / 2), y: snap(piso.alto / 2) }),
    }));
    setDirty(true);
  }

  /* ---------- dimensiones / guardar ---------- */

  function aplicarDimensiones(anchoStr: string, altoStr: string) {
    const a = parseFloat(anchoStr.replace(",", "."));
    const h = parseFloat(altoStr.replace(",", "."));
    if (!piso || !Number.isFinite(a) || !Number.isFinite(h)) return;
    actualizarPiso({
      ancho: mToCm(Math.min(Math.max(a, 2), 200)),
      alto: mToCm(Math.min(Math.max(h, 2), 200)),
    });
  }

  function crearPlano() {
    const a = parseFloat(anchoM.replace(",", "."));
    const h = parseFloat(altoM.replace(",", "."));
    if (!Number.isFinite(a) || !Number.isFinite(h) || a < 2 || h < 2) {
      flash("err", "Ingresa medidas válidas (mínimo 2 m por lado).");
      return;
    }
    const primero: PlanoPiso = {
      id: crypto.randomUUID(),
      nombre: "1er piso",
      ancho: mToCm(a),
      alto: mToCm(h),
      zonas: [],
    };
    setPlano({ pisos: [primero] });
    setPisoActivoId(primero.id);
    setDirty(true);
  }

  async function guardar() {
    if (!plano) return;
    setSaving(true);
    try {
      await api.put("/api/admin/plano", plano);
      if (mesas.length > 0) {
        await api.put("/api/admin/plano/posiciones", {
          posiciones: mesas.map((m) => {
            const p = pos[m.id] ?? { x: m.posicionX, y: m.posicionY };
            return {
              id: m.id,
              posicionX: Math.round(p.x),
              posicionY: Math.round(p.y),
              pisoId: pisoDeMesa(m, plano),
            };
          }),
        });
      }
      setDirty(false);
      flash("ok", "Plano guardado. El mozo ya ve el salón así.");
    } catch (e) {
      flash("err", e instanceof ClientApiError ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- render ---------- */

  if (!cargado) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  // Onboarding: aún no hay plano
  if (!plano || !piso) {
    return (
      <Card className="max-w-lg animate-fade-up">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
              Crea el plano de tu local
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa las medidas reales de tu salón. Después podrás dibujar zonas (terraza,
              barra…), agregar más pisos y arrastrar cada mesa a donde está en físico.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Ancho (m)</span>
              <input
                value={anchoM}
                onChange={(e) => setAnchoM(e.target.value)}
                inputMode="decimal"
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Largo (m)</span>
              <input
                value={altoM}
                onChange={(e) => setAltoM(e.target.value)}
                inputMode="decimal"
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </label>
            <Button onClick={crearPlano}>
              <Plus className="h-4 w-4" /> Crear plano
            </Button>
          </div>
          {aviso && (
            <p className={cn("text-sm", aviso.tone === "ok" ? "text-emerald-600" : "text-red-500")}>
              {aviso.msg}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
            Salón
          </h2>
          <p className="text-sm text-slate-500">
            Replica tu local: pisos, zonas y mesas donde están en físico.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => {
                setModo("mesas");
                setDibujo([]);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                modo === "mesas" ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:text-ink",
              )}
            >
              <Move className="h-4 w-4" /> Mover mesas
            </button>
            <button
              onClick={() => setModo("zona")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                modo === "zona" ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:text-ink",
              )}
            >
              <PenLine className="h-4 w-4" /> Dibujar zona
            </button>
          </div>
          {dirty && (
            <Button variant="outline" disabled={saving} onClick={cargar}>
              <RotateCcw className="h-4 w-4" /> Descartar
            </Button>
          )}
          <Button onClick={guardar} loading={saving} disabled={!dirty}>
            <Check className="h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>

      {/* Pisos */}
      <div className="flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-slate-400" />
        {plano.pisos.map((p) => {
          const n = mesas.filter((m) => pisoDeMesa(m, plano) === p.id).length;
          return (
            <button
              key={p.id}
              onClick={() => cambiarDePiso(p.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95",
                p.id === piso.id
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300",
              )}
            >
              {p.nombre}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold",
                  p.id === piso.id ? "bg-white/20" : "bg-slate-100 text-slate-500",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
        {plano.pisos.length < 5 && (
          <button
            onClick={agregarPiso}
            className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 transition-all duration-150 hover:border-ink hover:text-ink active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Piso
          </button>
        )}
      </div>

      {/* Dimensiones del piso activo */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">{piso.nombre}:</span>
        <input
          value={anchoM}
          onChange={(e) => {
            setAnchoM(e.target.value);
            aplicarDimensiones(e.target.value, altoM);
          }}
          inputMode="decimal"
          className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 tabular-nums focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <span className="text-slate-400">m ×</span>
        <input
          value={altoM}
          onChange={(e) => {
            setAltoM(e.target.value);
            aplicarDimensiones(anchoM, e.target.value);
          }}
          inputMode="decimal"
          className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 tabular-nums focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <span className="text-slate-400">m · cuadrícula: 1 m · las mesas se ajustan cada 5 cm</span>
      </div>

      {/* Aviso */}
      {aviso && (
        <div
          className={cn(
            "animate-fade-in rounded-xl border px-3 py-2 text-sm",
            aviso.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600",
          )}
        >
          {aviso.msg}
        </div>
      )}

      {/* Modo dibujo: acciones */}
      {modo === "zona" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <PenLine className="h-4 w-4" />
          Toca el plano para marcar los vértices de la zona ({dibujo.length} puntos).
          <span className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancelarDibujo}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button size="sm" variant="outline" disabled={dibujo.length === 0} onClick={() => setDibujo((d) => d.slice(0, -1))}>
              <Undo2 className="h-3.5 w-3.5" /> Deshacer punto
            </Button>
            <Button size="sm" disabled={dibujo.length < 3} onClick={cerrarZona}>
              <Check className="h-3.5 w-3.5" /> Cerrar zona
            </Button>
          </span>
        </div>
      )}

      {/* Mesas en otros pisos → traer al piso activo */}
      {mesasOtrosPisos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Mesas en otros pisos:</span>
          {mesasOtrosPisos.map((m) => {
            const nombrePiso = plano.pisos.find((p) => p.id === pisoDeMesa(m, plano))?.nombre ?? "?";
            return (
              <button
                key={m.id}
                onClick={() => traerMesa(m)}
                title={`Traer ${m.codigo} a ${piso.nombre}`}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium transition-all duration-150 hover:border-ink hover:text-ink active:scale-95"
              >
                <ArrowDownToLine className="h-3 w-3" />
                {m.codigo} · {nombrePiso}
              </button>
            );
          })}
        </div>
      )}

      {/* Lienzo del piso activo */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <svg
            ref={svgRef}
            viewBox={`-10 -10 ${piso.ancho + 20} ${piso.alto + 20}`}
            className={cn(
              "h-auto w-full select-none rounded-xl",
              modo === "zona" ? "cursor-crosshair" : "cursor-default",
            )}
            style={{ touchAction: "none", maxHeight: "70vh" }}
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerLeave={onSvgPointerUp}
            onClick={onSvgClick}
          >
            <defs>
              <pattern id="grid-editor" width={100} height={100} patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
              </pattern>
            </defs>
            <rect x={0} y={0} width={piso.ancho} height={piso.alto} rx={12} fill="#fbfaf8" />
            <rect x={0} y={0} width={piso.ancho} height={piso.alto} rx={12} fill="url(#grid-editor)" />

            {/* Zonas existentes */}
            {piso.zonas.map((z) => {
              const c = centroide(z.puntos);
              return (
                <g key={z.id}>
                  <polygon
                    points={z.puntos.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="#0b0b0d"
                    fillOpacity={0.04}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="8 6"
                    strokeLinejoin="round"
                  />
                  <text x={c.x} y={c.y} textAnchor="middle" fontSize={26} fontWeight={600} fill="#94a3b8">
                    {z.nombre}
                  </text>
                </g>
              );
            })}

            {/* Zona en dibujo */}
            {dibujo.length > 0 && (
              <g>
                <polyline
                  points={dibujo.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#b45309"
                  strokeWidth={3}
                  strokeDasharray="6 5"
                />
                {dibujo.length >= 3 && (
                  <line
                    x1={dibujo[dibujo.length - 1].x}
                    y1={dibujo[dibujo.length - 1].y}
                    x2={dibujo[0].x}
                    y2={dibujo[0].y}
                    stroke="#b45309"
                    strokeWidth={2}
                    strokeDasharray="3 6"
                    opacity={0.5}
                  />
                )}
                {dibujo.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={8} fill="#b45309" />
                ))}
              </g>
            )}

            {/* Contorno */}
            <rect
              x={0}
              y={0}
              width={piso.ancho}
              height={piso.alto}
              rx={12}
              fill="none"
              stroke="#0b0b0d"
              strokeWidth={4}
            />

            {/* Mesas del piso activo */}
            {mesasDelPiso.map((m) => {
              const { w, h } = mesaTamano(m.capacidad);
              const p = pos[m.id] ?? { x: m.posicionX, y: m.posicionY };
              const arrastrando = dragRef.current?.id === m.id;
              return (
                <g
                  key={m.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  onPointerDown={(e) => onMesaPointerDown(e, m)}
                  className={modo === "mesas" ? "cursor-grab active:cursor-grabbing" : undefined}
                >
                  <rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={14}
                    fill="#ffffff"
                    stroke={arrastrando ? "#0b0b0d" : "#cbd5e1"}
                    strokeWidth={arrastrando ? 4 : 3}
                  />
                  <text x={0} y={-2} textAnchor="middle" fontSize={26} fontWeight={700} fill="#0f172a">
                    {m.codigo}
                  </text>
                  <text x={0} y={24} textAnchor="middle" fontSize={17} fill="#64748b">
                    {m.capacidad} pers.
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>

      {/* Zonas y pisos: renombrar / quitar */}
      {(piso.zonas.length > 0 || plano.pisos.length > 1) && (
        <Card>
          <CardContent className="space-y-4 pt-4">
            {piso.zonas.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  Zonas de {piso.nombre}
                </h3>
                <div className="space-y-2">
                  {piso.zonas.map((z) => (
                    <div key={z.id} className="flex items-center gap-2">
                      <input
                        value={z.nombre}
                        maxLength={40}
                        onChange={(e) => renombrarZona(z.id, e.target.value)}
                        className="w-56 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <span className="text-xs text-slate-400">{z.puntos.length} vértices</span>
                      <button
                        onClick={() => quitarZona(z.id)}
                        aria-label={`Quitar ${z.nombre}`}
                        className="ml-auto rounded-lg p-1.5 text-slate-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plano.pisos.length > 1 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Pisos del local</h3>
                <div className="space-y-2">
                  {plano.pisos.map((p) => {
                    const n = mesas.filter((m) => pisoDeMesa(m, plano) === p.id).length;
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <input
                          value={p.nombre}
                          maxLength={30}
                          onChange={(e) => renombrarPiso(p.id, e.target.value)}
                          className="w-56 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                        />
                        <span className="text-xs text-slate-400">
                          {n} {n === 1 ? "mesa" : "mesas"}
                        </span>
                        <button
                          onClick={() => quitarPiso(p.id)}
                          disabled={n > 0}
                          title={n > 0 ? "Mueve sus mesas a otro piso antes de eliminarlo" : `Eliminar ${p.nombre}`}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="ml-auto rounded-lg p-1.5 text-slate-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-slate-400">
        Las mesas nuevas (creadas en “Mesas y QR”) aparecen en el primer piso, esquina superior
        izquierda. Para moverlas de piso: abre el piso destino y usa “Mesas en otros pisos →
        traer aquí”. Los cambios se aplican al Guardar.
      </p>
    </div>
  );
}
