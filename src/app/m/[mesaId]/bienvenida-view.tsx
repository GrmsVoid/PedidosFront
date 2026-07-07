"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

function saludoPorHora(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Portada de la carta: saluda según la hora, confirma la mesa, pide el nombre
 * del comensal (para diferenciarlo en el pedido grupal) y da paso al menú.
 * Se muestra una sola vez al llegar (no en recargas a mitad del pedido).
 */
export function BienvenidaView({
  mesaCodigo,
  onContinuar,
}: {
  mesaCodigo: string;
  onContinuar: (nombre: string) => Promise<void>;
}) {
  // Recuerda el nombre entre visitas (el mismo comensal no lo vuelve a tipear).
  const [nombre, setNombre] = useState<string>(() =>
    typeof window === "undefined" ? "" : (localStorage.getItem("cafe-nombre") ?? ""),
  );
  const [enviando, setEnviando] = useState(false);
  const valido = nombre.trim().length >= 2;

  async function continuar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      await onContinuar(nombre.trim().replace(/\s+/g, " "));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-10 text-center">
      {/* Emblema */}
      <div
        className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-full bg-ink text-white shadow-soft ring-8 ring-ink/5"
        aria-hidden
      >
        <Coffee className="h-9 w-9" />
      </div>

      {/* Saludo */}
      <p
        className="mt-8 animate-fade-up font-carta text-sm uppercase tracking-[0.3em] text-slate-500"
        style={{ animationDelay: "120ms" }}
      >
        {saludoPorHora()}
      </p>
      <h1
        className="mt-3 animate-fade-up font-carta text-4xl font-semibold text-slate-900"
        style={{ animationDelay: "220ms" }}
      >
        Bienvenido a
        <span className="mt-1 block italic">Café Demo</span>
      </h1>

      {/* Ornamento */}
      <div
        className="mt-6 flex animate-fade-up items-center gap-3 text-slate-300"
        style={{ animationDelay: "320ms" }}
        aria-hidden
      >
        <span className="h-px w-14 bg-slate-300" />
        <span className="font-carta text-lg leading-none">✦</span>
        <span className="h-px w-14 bg-slate-300" />
      </div>

      {/* Mesa */}
      <p
        className="mt-6 animate-fade-up font-carta text-lg text-slate-600"
        style={{ animationDelay: "420ms" }}
      >
        Estás en la <span className="font-semibold text-slate-900">mesa {mesaCodigo}</span>.
      </p>

      {/* Nombre del comensal */}
      <form
        onSubmit={continuar}
        className="mt-8 w-full max-w-xs animate-fade-up"
        style={{ animationDelay: "540ms" }}
      >
        <label htmlFor="nombre-comensal" className="block font-carta text-lg text-slate-700">
          ¿Cómo te llamas?
        </label>
        <input
          id="nombre-comensal"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={30}
          autoComplete="given-name"
          enterKeyHint="go"
          placeholder="Tu nombre"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-carta text-lg text-slate-900 shadow-sm transition-colors placeholder:text-slate-300 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <p className="mt-2 text-xs text-slate-400">
          Así te verá tu grupo al armar el pedido juntos.
        </p>

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={!valido} loading={enviando}>
          {valido ? `Ver la carta, ${nombre.trim().split(" ")[0]}` : "Ver la carta"}
        </Button>
        <p className="mt-3 text-xs text-slate-400">
          Pide desde tu celular · el mozo te lo trae a la mesa
        </p>
      </form>
    </div>
  );
}
