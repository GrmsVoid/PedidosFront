"use client";

import { Check, Crown, ShoppingBag, Trash2, UserMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/price";
import type { GrupoEstado } from "./types";

function strCents(s: string): number {
  const [a, b = "0"] = s.split(".");
  return parseInt(a || "0", 10) * 100 + parseInt((b + "00").slice(0, 2), 10);
}

const AVATAR_TONES = [
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function Avatar({ nombre, dim }: { nombre: string; dim?: boolean }) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) | 0;
  const tone = AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        tone,
        dim && "opacity-50",
      )}
    >
      {nombre.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function GrupoView({
  grupo,
  onAceptar,
  onQuitarItem,
  onQuitarParticipante,
  onForzar,
  busy,
}: {
  grupo: GrupoEstado;
  onAceptar: () => void;
  onQuitarItem: (id: string) => void;
  onQuitarParticipante: (id: string) => void;
  onForzar: () => void;
  busy: boolean;
}) {
  const yo = grupo.participantes.find((p) => p.soyYo);
  const yaAcepte = yo?.acepto ?? false;
  const cartVacio = grupo.carrito.length === 0;
  const activos = grupo.participantes.filter((p) => p.activo);

  return (
    <div className="space-y-4">
      {/* Participantes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(11,11,13,0.03)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users className="h-4 w-4" /> En la mesa
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
            {activos.length}
          </span>
        </div>
        <div className="space-y-1">
          {grupo.participantes.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors",
                p.soyYo && "bg-slate-50",
                !p.activo && "opacity-40",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5 text-slate-700">
                <Avatar nombre={p.nombre} dim={!p.activo} />
                <span className="truncate font-medium">
                  {p.nombre}
                  {p.soyYo && <span className="ml-1 text-xs font-normal text-slate-400">(tú)</span>}
                </span>
                {p.esAnfitrion && (
                  <span title="Anfitrión">
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {p.activo && p.acepto && (
                  <span className="flex animate-scale-in items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-600/15">
                    <Check className="h-3 w-3" strokeWidth={3} /> aceptó
                  </span>
                )}
                {p.activo && !p.acepto && (
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-400 ring-1 ring-inset ring-slate-200">
                    pendiente
                  </span>
                )}
                {/* El anfitrión puede quitar a un comensal activo que bloquea */}
                {grupo.soyAnfitrion && p.activo && !p.soyYo && !p.acepto && !cartVacio && (
                  <button
                    onClick={() => onQuitarParticipante(p.id)}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                  >
                    <UserMinus className="h-3 w-3" /> quitar
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Carrito compartido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(11,11,13,0.03)]">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pedido del grupo</h3>
        {cartVacio ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </span>
            <p className="text-sm text-slate-400">Aún no hay ítems. Agrega desde el menú.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {grupo.carrito.map((it) => (
              <div
                key={it.id}
                className="flex animate-fade-up items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    <span className="tabular-nums">{it.cantidad}×</span> {it.nombre}
                    {it.esCombo && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        combo
                      </span>
                    )}
                  </p>
                  {it.opcionesLabel && (
                    <p className="mt-0.5 text-xs text-slate-400">{it.opcionesLabel}</p>
                  )}
                  {it.notaLibre && (
                    <p className="mt-0.5 text-xs italic text-slate-400">“{it.notaLibre}”</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">por {it.participanteNombre}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="tabular-nums text-slate-600">
                    {formatCents(strCents(it.subtotal))}
                  </span>
                  {(it.esMio || grupo.soyAnfitrion) && (
                    <button
                      onClick={() => onQuitarItem(it.id)}
                      disabled={busy}
                      aria-label="Quitar"
                      className="rounded-lg p-1.5 text-slate-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{formatCents(strCents(grupo.total))}</span>
            </div>
          </div>
        )}
      </section>

      {/* Aceptación */}
      {!cartVacio && (
        <section className="space-y-2">
          {grupo.pendientes.length > 0 && (
            <p className="text-center text-sm text-slate-500">
              Esperando que acepten: <b>{grupo.pendientes.join(", ")}</b>
            </p>
          )}
          {!yaAcepte ? (
            <Button size="lg" className="w-full" loading={busy} onClick={onAceptar}>
              <Check className="h-5 w-5" /> Acepto el pedido
            </Button>
          ) : grupo.pendientes.length > 0 ? (
            <Button size="lg" variant="outline" className="w-full" disabled>
              <Check className="h-5 w-5 text-emerald-500" /> Ya aceptaste · faltan{" "}
              {grupo.pendientes.length}
            </Button>
          ) : null}

          {/* El anfitrión puede enviar de todas formas */}
          {grupo.soyAnfitrion && grupo.pendientes.length > 0 && (
            <Button variant="ghost" className="w-full" disabled={busy} onClick={onForzar}>
              Enviar de todas formas (soy el anfitrión)
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
