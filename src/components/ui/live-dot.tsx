import { cn } from "@/lib/cn";

/** Indicador de conexión en tiempo real para las pantallas de staff. */
export function LiveDot({ conectado }: { conectado: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ring-1 ring-inset",
        conectado
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
          : "bg-panel text-muted ring-slate-600/10",
      )}
    >
      <span className="relative flex h-2 w-2">
        {conectado && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            conectado ? "bg-emerald-500" : "bg-slate-400",
          )}
        />
      </span>
      {conectado ? "En vivo" : "Reconectando…"}
    </span>
  );
}
