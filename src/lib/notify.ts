"use client";

/**
 * Notificaciones locales para el staff: campanita (WebAudio, sin assets) y
 * parpadeo del título cuando la pestaña está en segundo plano.
 */

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// El navegador exige un gesto del usuario antes de sonar: "desbloqueamos" el
// AudioContext con la primera interacción de la página.
if (typeof window !== "undefined") {
  const prime = () => ensureCtx();
  window.addEventListener("pointerdown", prime, { once: true });
  window.addEventListener("keydown", prime, { once: true });
}

/** Campanita de dos tonos, corta y agradable. */
export function ding(): void {
  const c = ensureCtx();
  if (!c || c.state !== "running") return;
  const now = c.currentTime;
  const notas: Array<[number, number]> = [
    [880, 0], // La5
    [1318.5, 0.12], // Mi6
  ];
  for (const [freq, t] of notas) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.55);
    osc.connect(gain).connect(c.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.6);
  }
}

let flashTimer: ReturnType<typeof setInterval> | null = null;
let tituloBase: string | null = null;

function pararFlash(): void {
  if (flashTimer) clearInterval(flashTimer);
  flashTimer = null;
  if (tituloBase !== null) document.title = tituloBase;
  tituloBase = null;
}

/** Alterna el título de la pestaña ("🔔 msg") hasta que el usuario vuelva. */
export function flashTitle(msg: string): void {
  if (typeof document === "undefined" || !document.hidden) return;
  if (tituloBase === null) tituloBase = document.title;
  pararFlashSoloTimer();
  let visible = false;
  flashTimer = setInterval(() => {
    document.title = visible ? (tituloBase ?? document.title) : `🔔 ${msg}`;
    visible = !visible;
  }, 1000);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) pararFlash();
    },
    { once: true },
  );
}

function pararFlashSoloTimer(): void {
  if (flashTimer) clearInterval(flashTimer);
  flashTimer = null;
}

/** Sonido + parpadeo del título (si la pestaña está oculta). */
export function notify(msg: string): void {
  ding();
  flashTitle(msg);
}
