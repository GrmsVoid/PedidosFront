import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// Imagen OG (1200×630) generada en build/request: es la tarjeta que muestran
// WhatsApp, Instagram, X y Google Discover al compartir el enlace. Misma
// dirección visual que la landing (Swiss minimal sobre #f8f7f3).
// Next la inyecta como og:image y twitter:image automáticamente.

export const runtime = "edge";
export const alt = `${SITE_NAME} — Sistema de pedidos para restaurantes en tiempo real`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f7f3",
          color: "#181816",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#5e5d57",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 9999,
              background: "#059669",
            }}
          />
          Operación en tiempo real
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 128, fontWeight: 700, letterSpacing: "-0.05em" }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 40,
              lineHeight: 1.25,
              color: "#3f3e39",
              maxWidth: 980,
            }}
          >
            Carta QR, cocina, caja y salón conectados. Sistema de pedidos para
            restaurantes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #cbc9c0",
            paddingTop: 28,
            fontSize: 26,
            color: "#5e5d57",
          }}
        >
          <div>Cliente · Mozo · Cocina · Caja</div>
          <div>por Grimes</div>
        </div>
      </div>
    ),
    size,
  );
}
