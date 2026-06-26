import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Café Demo — Pide desde tu mesa",
  description:
    "Escanea el QR de tu mesa, arma tu pedido a tu gusto y te lo llevamos. Café de especialidad, sin filas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
