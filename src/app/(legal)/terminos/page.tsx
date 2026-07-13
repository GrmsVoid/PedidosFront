import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader, LegalList, LegalSection } from "@/components/legal/legal";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y Condiciones del servicio Grimes/OS: planes, pagos, suscripción, propiedad de los datos y soporte.",
  alternates: { canonical: "/terminos" },
};

// ⚠️ Plantilla de partida: los campos [ENTRE CORCHETES] deben completarse y el
// texto íntegro debe pasar por revisión de un abogado antes de vender online.
export default function TerminosPage() {
  return (
    <article>
      <LegalHeader
        eyebrow="Legal / 01"
        title="Términos y Condiciones"
        updated="12 de julio de 2026"
      />

      <LegalSection number="1" title="Identidad del proveedor">
        <p>
          Grimes/OS es un sistema de gestión de pedidos para restaurantes y cafeterías,
          desarrollado y operado por Grimes (&ldquo;el Proveedor&rdquo;), con RUC [RUC POR COMPLETAR]
          y domicilio en [CIUDAD], Perú. Canal de contacto oficial: WhatsApp
          +51 970 642 671.
        </p>
      </LegalSection>

      <LegalSection number="2" title="El servicio">
        <p>
          Grimes/OS conecta la operación de un restaurante — carta digital con código QR,
          toma de pedidos, pantalla de cocina (KDS), caja, salón y reportes — en tiempo
          real. Se ofrece en dos modalidades:
        </p>
        <LegalList
          items={[
            "Plan SaaS: acceso al sistema alojado en la nube, bajo suscripción mensual.",
            "Plan Personalizado: proyecto a medida con la identidad del cliente (logo, colores, dominio) y funcionalidades acordadas en la propuesta correspondiente.",
          ]}
        />
      </LegalSection>

      <LegalSection number="3" title="Precios y pago">
        <p>
          Los precios se comunican en la web o en la propuesta comercial, en soles (PEN),
          e incluyen IGV cuando corresponda. El pago se procesa a través de pasarelas de
          pago autorizadas; el Proveedor no almacena datos de tarjetas. Por cada cobro se
          emite el comprobante de pago electrónico correspondiente (boleta o factura).
        </p>
      </LegalSection>

      <LegalSection number="4" title="Suscripción, renovación y cancelación">
        <LegalList
          items={[
            "La suscripción del Plan SaaS se renueva automáticamente cada mes en la fecha de contratación.",
            "El cliente puede cancelar en cualquier momento por el canal de contacto oficial; la cancelación surte efecto al final del período ya pagado. No hay permanencia mínima.",
            "Si un cobro mensual falla, se reintenta durante un período de gracia. Agotados los reintentos, la cuenta pasa a modo de solo lectura (los datos no se borran).",
            "Tras 30 días de cancelada la suscripción, el cliente puede solicitar la exportación de sus datos antes del archivado definitivo.",
          ]}
        />
      </LegalSection>

      <LegalSection number="5" title="Propiedad intelectual y propiedad de los datos">
        <p>
          El software, su código, diseño y marca Grimes/OS son propiedad del Proveedor.
          La contratación otorga una licencia de uso, no una cesión.
        </p>
        <p>
          Los datos operativos del restaurante — su carta, precios, pedidos, ventas y
          reportes — son propiedad del cliente. El Proveedor los trata únicamente para
          prestar el servicio, conforme a la{" "}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-[#181816]">
            Política de Privacidad
          </Link>{" "}
          y en calidad de encargado de tratamiento respecto de los datos de los comensales
          del restaurante.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Disponibilidad y soporte">
        <p>
          El Proveedor procura una disponibilidad continua del servicio y comunica con
          anticipación las ventanas de mantenimiento programado. El soporte se brinda por
          WhatsApp en horario comercial de Perú (GMT-5). Los tiempos de respuesta
          comprometidos para cada plan se detallan en la propuesta o página de contratación.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Uso aceptable">
        <LegalList
          items={[
            "No usar el servicio para fines ilícitos ni para tratar datos de terceros sin base legal.",
            "No intentar vulnerar la seguridad, acceder a datos de otros clientes ni revender el servicio sin autorización escrita.",
            "Mantener la confidencialidad de las credenciales de acceso del personal.",
          ]}
        />
      </LegalSection>

      <LegalSection number="8" title="Limitación de responsabilidad">
        <p>
          El servicio se presta con diligencia profesional. El Proveedor no responde por
          daños indirectos ni por lucro cesante derivados de interrupciones ajenas a su
          control (cortes de internet o energía del local, fallas de terceros como
          pasarelas de pago u operadores de facturación). La responsabilidad total del
          Proveedor se limita al monto pagado por el cliente en los tres (3) meses
          anteriores al hecho que la origine.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Reclamos">
        <p>
          Ante cualquier disconformidad, el cliente y los consumidores disponen del{" "}
          <Link
            href="/libro-de-reclamaciones"
            className="underline underline-offset-2 hover:text-[#181816]"
          >
            Libro de Reclamaciones virtual
          </Link>
          , conforme a la Ley N.º 29571. Los reclamos se responden en un plazo máximo de
          quince (15) días hábiles.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Modificaciones, ley aplicable y jurisdicción">
        <p>
          El Proveedor puede actualizar estos términos; los cambios relevantes se
          comunican al cliente con anticipación razonable y rigen hacia adelante. Estos
          términos se rigen por las leyes de la República del Perú y cualquier
          controversia se somete a los jueces y tribunales de [CIUDAD], Perú.
        </p>
      </LegalSection>
    </article>
  );
}
