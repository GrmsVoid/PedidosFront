import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tinta casi negra para máximo contraste (look minimal).
        ink: "#0b0b0d",
        // Acento cálido (espresso/ámbar); uso puntual.
        accent: {
          DEFAULT: "#b45309",
          soft: "#fef3c7",
        },
        // Fondo cálido tipo papel para la PWA del cliente.
        paper: "#f7f5f0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        // Serif clásica de sistema para la carta del cliente (sin webfonts).
        carta: ["Georgia", "Palatino Linotype", "Book Antiqua", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,11,13,0.04), 0 12px 32px -16px rgba(11,11,13,0.18)",
        lift: "0 2px 4px rgba(11,11,13,0.05), 0 18px 40px -18px rgba(11,11,13,0.28)",
        fab: "0 8px 24px -6px rgba(11,11,13,0.35)",
        "top-soft": "0 -8px 30px -12px rgba(11,11,13,0.18)",
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
          "0%": { boxShadow: "0 0 0 0 rgba(245,158,11,0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(245,158,11,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "fade-up": "fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up": "slide-up 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.2s ease-out both",
        pop: "pop 0.35s cubic-bezier(0.22,1,0.36,1)",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "toast-in": "toast-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
