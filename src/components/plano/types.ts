/** Plano del salón. Todas las medidas en centímetros; la posición de una mesa es su centro. */

export type PlanoPunto = { x: number; y: number };

export type PlanoZona = {
  id: string;
  nombre: string;
  puntos: PlanoPunto[];
};

/** Un piso del local, con sus dimensiones y zonas dibujadas. */
export type PlanoPiso = {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  zonas: PlanoZona[];
};

export type Plano = { pisos: PlanoPiso[] };

export type MesaEstado = "LIBRE" | "OCUPADA" | "UNIDA";

export type PlanoMesa = {
  id: string;
  codigo: string;
  capacidad: number;
  estado: MesaEstado;
  posicionX: number;
  posicionY: number;
  /** Piso al que pertenece; null = primer piso. */
  pisoId: string | null;
};

/** Piso efectivo de una mesa (las antiguas sin pisoId viven en el primero). */
export function pisoDeMesa(mesa: { pisoId: string | null }, plano: Plano): string {
  return mesa.pisoId ?? plano.pisos[0]?.id ?? "piso-1";
}

/** Tamaño visual de la mesa según capacidad (cm). */
export function mesaTamano(capacidad: number): { w: number; h: number } {
  if (capacidad <= 2) return { w: 70, h: 70 };
  if (capacidad <= 4) return { w: 90, h: 90 };
  return { w: 150, h: 90 };
}

export function centroide(puntos: PlanoPunto[]): PlanoPunto {
  const n = puntos.length || 1;
  return {
    x: puntos.reduce((a, p) => a + p.x, 0) / n,
    y: puntos.reduce((a, p) => a + p.y, 0) / n,
  };
}
