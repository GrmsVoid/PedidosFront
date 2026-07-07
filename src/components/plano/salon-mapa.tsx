"use client";

import { cn } from "@/lib/cn";
import { centroide, mesaTamano, type MesaEstado, type PlanoMesa, type PlanoPiso } from "./types";

const ESTADO_FILL: Record<MesaEstado, { fill: string; stroke: string; text: string }> = {
  LIBRE: { fill: "#ecfdf5", stroke: "#34d399", text: "#047857" },
  OCUPADA: { fill: "#eff6ff", stroke: "#60a5fa", text: "#1d4ed8" },
  UNIDA: { fill: "#f5f3ff", stroke: "#a78bfa", text: "#6d28d9" },
};

/**
 * Mapa de un piso del salón (solo lectura + click por mesa). Réplica a escala
 * del local: contorno, zonas dibujadas por el admin y mesas donde están en físico.
 */
export function SalonMapa({
  piso,
  mesas,
  seleccion = [],
  onMesaClick,
  className,
}: {
  piso: PlanoPiso;
  mesas: PlanoMesa[];
  seleccion?: string[];
  onMesaClick?: (mesa: PlanoMesa) => void;
  className?: string;
}) {
  const { ancho, alto } = piso;
  return (
    <svg
      viewBox={`-10 -10 ${ancho + 20} ${alto + 20}`}
      className={cn("h-auto w-full select-none", className)}
      role="img"
      aria-label="Plano del salón"
    >
      {/* Piso + cuadrícula de 1 m */}
      <defs>
        <pattern id="grid-1m" width={100} height={100} patternUnits="userSpaceOnUse">
          <path d={`M ${100} 0 L 0 0 0 ${100}`} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={ancho} height={alto} rx={12} fill="#fbfaf8" />
      <rect x={0} y={0} width={ancho} height={alto} rx={12} fill="url(#grid-1m)" />

      {/* Zonas */}
      {piso.zonas.map((z) => {
        const c = centroide(z.puntos);
        return (
          <g key={z.id}>
            <polygon
              points={z.puntos.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="#0b0b0d"
              fillOpacity={0.03}
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="8 6"
              strokeLinejoin="round"
            />
            <text
              x={c.x}
              y={c.y}
              textAnchor="middle"
              fontSize={26}
              fontWeight={600}
              fill="#94a3b8"
              opacity={0.8}
            >
              {z.nombre}
            </text>
          </g>
        );
      })}

      {/* Contorno del local */}
      <rect
        x={0}
        y={0}
        width={ancho}
        height={alto}
        rx={12}
        fill="none"
        stroke="#0b0b0d"
        strokeWidth={4}
      />

      {/* Mesas */}
      {mesas.map((m) => {
        const { w, h } = mesaTamano(m.capacidad);
        const st = ESTADO_FILL[m.estado];
        const sel = seleccion.includes(m.id);
        return (
          <g
            key={m.id}
            transform={`translate(${m.posicionX}, ${m.posicionY})`}
            onClick={() => onMesaClick?.(m)}
            className={cn(onMesaClick && "cursor-pointer")}
            style={{ transition: "transform 0.3s ease" }}
          >
            {sel && (
              <rect
                x={-w / 2 - 10}
                y={-h / 2 - 10}
                width={w + 20}
                height={h + 20}
                rx={18}
                fill="none"
                stroke="#0b0b0d"
                strokeWidth={4}
              />
            )}
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={14}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth={3}
            />
            <text
              x={0}
              y={-2}
              textAnchor="middle"
              fontSize={26}
              fontWeight={700}
              fill={st.text}
            >
              {m.codigo}
            </text>
            <text x={0} y={24} textAnchor="middle" fontSize={17} fill={st.text} opacity={0.75}>
              {m.capacidad} pers.
            </text>
          </g>
        );
      })}
    </svg>
  );
}
