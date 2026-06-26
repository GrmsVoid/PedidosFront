"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";
import { inputCls } from "../finanzas/rango";

type Turno = {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nota: string | null;
};
type UsuarioMin = { id: string; nombre: string; activo: boolean };

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mondayOf(base: Date): Date {
  const d = new Date(base);
  const off = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - off);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function TurnosTab() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [usuarios, setUsuarios] = useState<UsuarioMin[]>([]);
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [usuarioId, setUsuarioId] = useState("");
  const [fecha, setFecha] = useState(() => ymd(mondayOf(new Date())));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("17:00");

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { date: d, ymd: ymd(d) };
  });
  const rangoDesde = `${dias[0].ymd}T00:00:00.000Z`;
  const rangoHasta = `${dias[6].ymd}T23:59:59.999Z`;

  const cargarUsuarios = useCallback(async () => {
    try {
      const u = await api.get<UsuarioMin[]>("/api/admin/usuarios");
      const activos = u.filter((x) => x.activo);
      setUsuarios(activos);
      setUsuarioId((p) => p || activos[0]?.id || "");
    } catch {
      /* noop */
    }
  }, []);

  const cargarTurnos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `desde=${encodeURIComponent(rangoDesde)}&hasta=${encodeURIComponent(rangoHasta)}`;
      setTurnos(await api.get<Turno[]>(`/api/admin/turnos?${qs}`));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [rangoDesde, rangoHasta]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);
  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);
  useEffect(() => {
    setFecha(ymd(weekStart));
  }, [weekStart]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioId || !fecha) return;
    setBusy("add");
    setError(null);
    try {
      await api.post("/api/admin/turnos", { usuarioId, fecha, horaInicio, horaFin });
      await cargarTurnos();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo crear el turno");
    } finally {
      setBusy(null);
    }
  }

  async function eliminar(id: string) {
    setBusy(id);
    try {
      await api.del(`/api/admin/turnos/${id}`);
      await cargarTurnos();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo eliminar");
    } finally {
      setBusy(null);
    }
  }

  function shiftWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + delta * 7);
    setWeekStart(d);
  }

  const porDia = new Map<string, Turno[]>();
  for (const t of turnos ?? []) {
    const k = t.fecha.slice(0, 10);
    porDia.set(k, [...(porDia.get(k) ?? []), t]);
  }

  const rangoLabel = `${dias[0].date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })} – ${dias[6].date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}`;
  const hoyYmd = ymd(new Date());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Turnos</h1>
          <p className="text-sm text-slate-500">Agenda semanal del personal.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => shiftWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-medium text-slate-600">{rangoLabel}</span>
          <Button size="sm" variant="outline" onClick={() => shiftWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={agregar} className="grid gap-2 sm:grid-cols-[1.4fr_1.2fr_auto_auto_auto] sm:items-end">
            <Campo label="Persona">
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className={inputCls + " w-full"}>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Día">
              <select value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls + " w-full"}>
                {dias.map((d) => (
                  <option key={d.ymd} value={d.ymd}>
                    {d.date.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" })}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Inicio">
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Fin">
              <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={inputCls} />
            </Campo>
            <Button type="submit" disabled={busy === "add"}>
              <Plus className="h-4 w-4" /> Asignar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!turnos || loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dias.map((d) => {
            const ts = (porDia.get(d.ymd) ?? []).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
            return (
              <Card key={d.ymd} className={d.ymd === hoyYmd ? "ring-1 ring-ink" : ""}>
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-sm font-semibold capitalize text-slate-900">
                      {d.date.toLocaleDateString("es-PE", { weekday: "long" })}
                    </span>
                    <span className="text-xs text-slate-400">
                      {d.date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  {ts.length === 0 ? (
                    <p className="py-3 text-center text-xs text-slate-300">—</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {ts.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{t.usuarioNombre}</span>
                            <span className="text-xs text-slate-400">
                              {t.horaInicio}–{t.horaFin}
                            </span>
                          </span>
                          <button
                            disabled={busy === t.id}
                            onClick={() => eliminar(t.id)}
                            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
