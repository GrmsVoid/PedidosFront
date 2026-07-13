"use client";

import { Button } from "@/components/ui/button";

/** Convierte un Date a valor para <input type="datetime-local"> (hora local). */
export function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function localToIso(local: string): string {
  return new Date(local).toISOString();
}

export function startOfMonthLocal(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return toLocalInput(d);
}

export function nowLocal(): string {
  return toLocalInput(new Date());
}

export const inputCls =
  "rounded-sm border border-line bg-panel px-3 py-2 text-sm text-ink transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

export function RangoBar({
  desde,
  hasta,
  setDesde,
  setHasta,
  onApply,
  loading,
}: {
  desde: string;
  hasta: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  onApply: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Desde</span>
        <input type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Hasta</span>
        <input type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
      </label>
      <Button variant="outline" onClick={onApply} disabled={loading}>
        {loading ? "Cargando…" : "Aplicar"}
      </Button>
    </div>
  );
}
