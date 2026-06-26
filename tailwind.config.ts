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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,11,13,0.04), 0 12px 32px -16px rgba(11,11,13,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
