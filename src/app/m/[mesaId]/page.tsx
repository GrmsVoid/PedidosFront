import type { Viewport } from "next";
import { ClienteApp } from "./cliente-app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7f3",
};

export default function MesaPage({
  params,
  searchParams,
}: {
  params: { mesaId: string };
  searchParams: { t?: string };
}) {
  return <ClienteApp mesaId={params.mesaId} qrToken={searchParams.t ?? null} />;
}
