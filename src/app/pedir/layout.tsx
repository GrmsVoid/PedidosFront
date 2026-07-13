import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

// /pedir es pública e indexable: es la puerta de entrada de clientes que
// llegan desde Google buscando ordenar. La página es "use client", así que la
// metadata vive en este layout.
export const metadata: Metadata = {
  title: `Ordena en línea — carta digital`,
  description:
    `Mira la carta y haz tu pedido en línea con ${SITE_NAME}: elige tus platos, ` +
    "personalízalos y el restaurante lo confirma al instante. Sin descargar apps.",
  alternates: { canonical: "/pedir" },
  openGraph: {
    title: `Ordena en línea — carta digital · ${SITE_NAME}`,
    description:
      "Mira la carta y haz tu pedido en línea: elige tus platos y el restaurante lo confirma al instante.",
    url: "/pedir",
  },
};

export default function PedirLayout({ children }: { children: React.ReactNode }) {
  return children;
}
