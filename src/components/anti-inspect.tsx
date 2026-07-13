"use client";

import { useEffect, useState } from "react";

/**
 * Disuasión + firma de autoría en el cliente.
 *
 * IMPORTANTE — expectativas reales: nada de esto "protege" el código. Todo lo
 * que llega al navegador se puede leer (deshabilitando JS, con view-source:,
 * curl, la pestaña Network o el menú del navegador). Esto es BRANDING y una
 * barrera psicológica, no seguridad. La seguridad real vive en el backend.
 *
 * Por eso el overlay es DESCARTABLE (evita "brickear" la UI de un cliente por
 * un falso positivo de detección) y el bloqueo de teclas/clic-derecho es
 * OPCIONAL (molesta a clientes que solo quieren ordenar).
 */

const FIRMA = {
  nombre: "Grimes",
  instagram: "@Voidl.grms_",
  instagramUrl: "https://instagram.com/void.grms_",
} as const;

const CONFIG = {
  // Banner en consola: inofensivo, se muestra siempre.
  bannerConsola: true,
  // Detección de DevTools abierto → overlay con la firma. Solo en producción.
  detectarDevtools: true,
  // Interceptar F12 / Ctrl+U / Ctrl+Shift+I·J·C → aviso con la firma.
  bloquearAtajos: true,
  // Interceptar clic derecho. Ojo: molesta a clientes (copiar texto, abrir en
  // pestaña nueva). Por eso viene DESACTIVADO por defecto.
  bloquearClicDerecho: false,
  // Umbral (px) para heurística de tamaño de ventana con DevTools acoplado.
  umbralDevtools: 165,
} as const;

function bannerConsola() {
  const titulo =
    "background:#0f0f10;color:#22d3ee;font-size:20px;font-weight:800;padding:10px 16px;border-radius:8px 8px 0 0;";
  const cuerpo =
    "background:#0f0f10;color:#e5e7eb;font-size:13px;line-height:1.6;padding:8px 16px 12px;border-radius:0 0 8px 8px;";
  const guino = "color:#f59e0b;font-weight:700;";

  /* eslint-disable no-console -- el banner de firma es intencional */
  console.log(`%c🛑 Que fue, hermano?`, titulo);
  console.log(
    `%cEste sitio y su código son obra de %c${FIRMA.nombre}%c.\n` +
      `Ya que estas aquì  saludame 👋\n` +
      `Instagram: ${FIRMA.instagram}  ·  ${FIRMA.instagramUrl}`,
    cuerpo,
    `${cuerpo}${guino}`,
    cuerpo,
  );
  /* eslint-enable no-console */
}

export function AntiInspect() {
  const [mostrarOverlay, setMostrarOverlay] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const esProd = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (CONFIG.bannerConsola) bannerConsola();

    // El bloqueo agresivo y la detección solo corren en producción, para no
    // pelear con las DevTools durante el desarrollo.
    if (!esProd) return;

    const dispararAviso = (texto: string) => {
      setAviso(texto);
      window.clearTimeout((dispararAviso as unknown as { _t?: number })._t);
      (dispararAviso as unknown as { _t?: number })._t = window.setTimeout(
        () => setAviso(null),
        2600,
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!CONFIG.bloquearAtajos) return;
      const k = e.key.toLowerCase();
      const esF12 = e.key === "F12";
      const esVerFuente = e.ctrlKey && !e.shiftKey && !e.altKey && k === "u";
      const esInspeccionar = e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c");
      if (esF12 || esVerFuente || esInspeccionar) {
        e.preventDefault();
        dispararAviso(`👀 ${FIRMA.nombre} te vio · IG ${FIRMA.instagram}`);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!CONFIG.bloquearClicDerecho) return;
      e.preventDefault();
      dispararAviso(`✋ Hecho por ${FIRMA.nombre} · IG ${FIRMA.instagram}`);
    };

    let intervalo: number | undefined;
    if (CONFIG.detectarDevtools) {
      // Heurística por tamaño: cuando las DevTools se acoplan, crece la
      // diferencia entre la ventana externa y el viewport. No detecta DevTools
      // desacopladas en otra ventana (limitación conocida y aceptada).
      intervalo = window.setInterval(() => {
        const anchoSospechoso = window.outerWidth - window.innerWidth > CONFIG.umbralDevtools;
        const altoSospechoso = window.outerHeight - window.innerHeight > CONFIG.umbralDevtools;
        setMostrarOverlay(anchoSospechoso || altoSospechoso);
      }, 900);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
      if (intervalo) window.clearInterval(intervalo);
    };
  }, [esProd]);

  return (
    <>
      {aviso && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2147483646,
            background: "#0f0f10",
            color: "#f9fafb",
            padding: "10px 18px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 30px rgba(0,0,0,.35)",
            border: "1px solid #22d3ee55",
            pointerEvents: "none",
          }}
        >
          {aviso}
        </div>
      )}

      {mostrarOverlay && (
        <div
          role="dialog"
          aria-label="Código protegido"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            textAlign: "center",
            padding: 24,
            background: "rgba(9,9,11,.92)",
            backdropFilter: "blur(6px)",
            color: "#f9fafb",
          }}
        >
          <div style={{ fontSize: 56, lineHeight: 1 }}>🔒</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Código firmado por {FIRMA.nombre}</div>
          <div style={{ fontSize: 16, opacity: 0.85 }}>
            Buen intento 👀 — Instagram{" "}
            <a
              href={FIRMA.instagramUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#22d3ee", fontWeight: 700 }}
            >
              {FIRMA.instagram}
            </a>
          </div>
          <button
            onClick={() => setMostrarOverlay(false)}
            style={{
              marginTop: 14,
              padding: "10px 22px",
              borderRadius: 10,
              border: "1px solid #ffffff22",
              background: "#22d3ee",
              color: "#0f0f10",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
