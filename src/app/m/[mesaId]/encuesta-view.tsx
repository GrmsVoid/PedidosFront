"use client";

import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";

const ETIQUETAS = ["", "Muy mal", "Mal", "Regular", "Bien", "¡Excelente!"];

export function EncuestaView({
  token,
  yaEnviada,
}: {
  token: string;
  yaEnviada: boolean;
}) {
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(yaEnviada);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (estrellas === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await api.post(
        "/api/sesion/encuesta",
        { estrellas, comentario: comentario.trim() || undefined },
        { token },
      );
      setEnviada(true);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  }

  const activa = hover || estrellas;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm animate-fade-up">
        {enviada ? (
          <>
            <div className="mx-auto flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
              <Heart className="h-8 w-8 fill-emerald-500 text-emerald-500" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">
              ¡Gracias por tu visita! ☕
            </h1>
            <p className="mt-2 text-slate-500">Tu opinión fue registrada. ¡Vuelve pronto!</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              ¡Gracias por tu visita! ☕
            </h1>
            <p className="mt-2 text-slate-500">¿Cómo estuvo todo?</p>
            <div className="mt-6 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEstrellas(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} estrellas`}
                  className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors duration-150",
                      n <= activa ? "fill-amber-400 text-amber-400" : "text-slate-300",
                      n === estrellas && "animate-pop",
                    )}
                  />
                </button>
              ))}
            </div>
            <p
              className={cn(
                "mt-2 h-5 text-sm font-medium transition-opacity duration-200",
                activa > 0 ? "opacity-100" : "opacity-0",
                activa >= 4 ? "text-amber-600" : "text-slate-500",
              )}
            >
              {ETIQUETAS[activa]}
            </p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Cuéntanos más (opcional)…"
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm transition-colors placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={estrellas === 0}
              loading={enviando}
              onClick={enviar}
            >
              Enviar opinión
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
