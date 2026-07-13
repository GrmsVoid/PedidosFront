import type { Metadata } from "next";
import { LegalHeader } from "@/components/legal/legal";
import { ReclamoForm } from "./reclamo-form";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual de Grimes/OS conforme a la Ley N.º 29571 y el D.S. 011-2011-PCM. Registra tu reclamo o queja; respuesta en máximo 15 días hábiles.",
  alternates: { canonical: "/libro-de-reclamaciones" },
};

export default function LibroReclamacionesPage() {
  return (
    <article>
      <LegalHeader
        eyebrow="Legal / 03"
        title="Libro de Reclamaciones"
        updated="12 de julio de 2026"
      />

      <div className="space-y-3 py-8 text-[15px] leading-relaxed text-[#3f3e39]">
        <p>
          Conforme a la Ley N.º 29571 — Código de Protección y Defensa del Consumidor —
          y al D.S. 011-2011-PCM, ponemos a tu disposición esta Hoja de Reclamación
          virtual del servicio Grimes/OS, operado por Grimes, RUC [RUC POR COMPLETAR].
        </p>
        <p>
          <strong>Reclamo</strong>: disconformidad relacionada con el servicio
          contratado. <strong>Queja</strong>: malestar respecto de la atención,
          no relacionado directamente con el servicio. La formulación del reclamo no
          impide acudir a otras vías de solución de controversias ni es requisito previo
          para presentar una denuncia ante INDECOPI.
        </p>
      </div>

      <ReclamoForm />
    </article>
  );
}
