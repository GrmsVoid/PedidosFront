import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Café Demo — Pedidos",
    short_name: "Café Pedidos",
    description: "Pedidos por QR para cafetería",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "es",
  };
}
