"use client";

import { MovimientosTab } from "./movimientos-tab";

export function IngresosTab() {
  return (
    <MovimientosTab
      titulo="Ingresos extra"
      subtitulo="Ingresos fuera de caja: delivery, eventos, propinas…"
      listEndpoint="/api/admin/finanzas/ingresos"
      catEndpoint="/api/admin/finanzas/categorias-ingreso"
    />
  );
}
