import { ImageResponse } from "next/og";

// Favicon generado (el sitio no tiene carpeta public/): cuadrado negro con la
// "G" de Grimes/OS, coherente con la dirección Swiss minimal.

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#181816",
          color: "#f8f7f3",
          borderRadius: 7,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        G
      </div>
    ),
    size,
  );
}
