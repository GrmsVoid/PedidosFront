import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { AntiInspect } from "@/components/anti-inspect";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

// Dirección "Blanco puro / Swiss minimal": una sola familia (Geist, la de
// Vercel), auto-hosteada — cero fetch en runtime. Geist Mono da cifras
// tabulares nítidas para precios, totales y timers.

// SEO base del sitio. Las rutas privadas (staff, login, /m/[mesaId]) declaran
// su propio `robots: noindex`; robots.ts además las bloquea al crawler.
// La firma de autoría (authors/creator/other) se mantiene: es branding visible
// en view-source.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  formatDetection: { telephone: false },
  authors: [{ name: "Grimes", url: "https://instagram.com/void_grms" }],
  creator: "Grimes (@Void_grms)",
  publisher: "Grimes (@Void_grms)",
  other: {
    "x-author": "Grimes",
    "x-instagram": "@Void_grms",
    "x-signature": "Hecho por Grimes · IG @Void_grms · buen intento 👀",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7f3",
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
