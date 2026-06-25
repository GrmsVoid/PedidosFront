"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";

export function EncuestaView({
  token,
  yaEnviada,
}: {
  token: string;
  yaEnviada: boolean;
}) {
  const [estrellas, setEstrellas] = useState(0);
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

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900">¡Gracias por tu visita! ☕</h1>
        {enviada ? (
          <p className="mt-3 text-slate-500">Tu opinión fue registrada. ¡Vuelve pronto!</p>
        ) : (
          <>
            <p className="mt-2 text-slate-500">¿Cómo estuvo todo?</p>
            <div className="mt-5 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEstrellas(n)}
                  aria-label={`${n} estrellas`}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      n <= estrellas
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300",
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Cuéntanos más (opcional)…"
              className="mt-4 w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-slate-400 focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={estrellas === 0 || enviando}
              onClick={enviar}
            >
              {enviando ? "Enviando…" : "Enviar opinión"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
