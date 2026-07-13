import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { AntiInspect } from "@/components/anti-inspect";

// Dirección "Blanco puro / Swiss minimal": una sola familia (Geist, la de
// Vercel), auto-hosteada — cero fetch en runtime. Geist Mono da cifras
// tabulares nítidas para precios, totales y timers.

// Firma de autoría visible en "view-source:" (meta tags). El código minificado
// no se puede ocultar; esto deja constancia de quién lo hizo.
export const metadata: Metadata = {
  title: "Grimes/OS — Pedidos en tiempo real",
  description:
    "Sistema de pedidos para restaurantes diseñado por Grimes. Conecta cliente, mozo, cocina y caja en tiempo real.",
  authors: [{ name: "Grimes", url: "https://instagram.com/void_grms" }],
  creator: "Grimes (@Void_grms)",
  publisher: "Grimes (@Void_grms)",
  other: {
    "x-author": "Grimes",
    "x-instagram": "@Void_grms",
    "x-signature": "Hecho por Grimes · IG @Void_grms · buen intento 👀",
  },
};

// Banner en comentario HTML: aparece tal cual al hacer view-source:.
const FIRMA_HTML = `
<!--
  ┌───────────────────────────────────────────────┐
  │   Este código es obra de  G R I M E S          │
  │   Instagram: @Void_grms                        │
  │   ¿Husmeando el código? buen intento 👀        │
  └───────────────────────────────────────────────┘
-->`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: FIRMA_HTML }} />
        <AntiInspect />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
