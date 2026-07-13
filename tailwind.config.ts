import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dirección "Blanco puro / Swiss minimal": todo el gris del sistema pasa
        // a neutral (gris puro, sin temperatura) SIN tocar las pantallas — las
        // clases text-slate-*/border-slate-* existentes resuelven a neutral.
        slate: colors.neutral,
        // Design system Grimes/OS: marfil, carbón y coral como acento de marca.
        ink: "#181816",
        brand: "#ff5733",
        panel: "#fcfbf7",
        line: "#d9d8d1",
        muted: "#66655f",
        accent: {
          DEFAULT: "#ff5733",
          soft: "#fff0eb",
        },
        paper: "#f8f7f3",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
        md: "3px",
        lg: "4px",
        xl: "5px",
        "2xl": "7px",
        "3xl": "12px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        // Display = misma familia; la jerarquía se hace con peso + tracking, no
        // con una segunda fuente (más minimal, una sola voz).
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        // La carta del cliente también en sans (fuera la serif decorativa).
        carta: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        // Tracking negativo para titulares grandes (look preciso, tipo Vercel).
        tightest: "-0.03em",
      },
      boxShadow: {
        // Sombras muy sutiles: en un sistema minimal manda el hairline, no la
        // sombra. Tinte neutro.
        soft: "0 1px 2px rgba(24,24,22,0.04), 0 8px 24px -16px rgba(24,24,22,0.12)",
        lift: "0 1px 2px rgba(24,24,22,0.05), 0 18px 42px -22px rgba(24,24,22,0.20)",
        fab: "0 6px 20px -6px rgba(24,24,22,0.25)",
        "top-soft": "0 -6px 24px -12px rgba(24,24,22,0.12)",
      },
      transitionTimingFunction: {
        // Curvas con carácter (ease-out fuerte y drawer iOS) — Emil Kowalski.
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.22)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(10,10,10,0.14)" },
          "70%": { boxShadow: "0 0 0 8px rgba(10,10,10,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(10,10,10,0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "fade-up": "fade-up 0.4s cubic-bezier(0.23,1,0.32,1) both",
        "slide-up": "slide-up 0.32s cubic-bezier(0.32,0.72,0,1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.23,1,0.32,1) both",
        pop: "pop 0.35s cubic-bezier(0.23,1,0.32,1)",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "toast-in": "toast-in 0.28s cubic-bezier(0.23,1,0.32,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
