"use client";

import { MovimientosTab } from "./movimientos-tab";

export function EgresosTab() {
  return (
    <MovimientosTab
      titulo="Egresos"
      subtitulo="Gastos del negocio: insumos, servicios, alquiler, mantenimiento…"
      listEndpoint="/api/admin/finanzas/egresos"
      catEndpoint="/api/admin/finanzas/categorias-gasto"
    />
  );
}
