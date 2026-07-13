import type { Metadata } from "next";
import { LegalHeader, LegalList, LegalSection } from "@/components/legal/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad y protección de datos personales de Grimes/OS conforme a la Ley N.º 29733 del Perú: finalidades, derechos ARCO y canales de ejercicio.",
  alternates: { canonical: "/privacidad" },
};

// ⚠️ Plantilla de partida: los campos [ENTRE CORCHETES] deben completarse y el
// texto íntegro debe pasar por revisión de un abogado antes de vender online.
export default function PrivacidadPage() {
  return (
    <article>
      <LegalHeader
        eyebrow="Legal / 02"
        title="Política de Privacidad y Protección de Datos"
        updated="12 de julio de 2026"
      />

      <LegalSection number="1" title="Responsable del tratamiento">
        <p>
          Grimes, con RUC [RUC POR COMPLETAR] y domicilio en [CIUDAD], Perú, es el
          responsable del tratamiento de los datos personales recogidos a través de este
          sitio y del servicio Grimes/OS, conforme a la Ley N.º 29733 — Ley de Protección
          de Datos Personales — y su Reglamento.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Qué datos tratamos y para qué">
        <p>De los clientes del servicio (restaurantes y su personal autorizado):</p>
        <LegalList
          items={[
            "Datos de contacto y facturación (nombre, correo, WhatsApp, DNI o RUC y razón social): para gestionar la contratación, el cobro y la emisión de comprobantes.",
            "Credenciales de acceso del personal (correo y contraseña cifrada): para autenticar y autorizar el uso del sistema según roles.",
            "Datos de uso y registros técnicos: para la seguridad, el soporte y la mejora del servicio.",
          ]}
        />
        <p>
          De los comensales de cada restaurante (por ejemplo, nombre o teléfono en un
          pre-pedido, respuestas de encuestas): el restaurante es el titular del banco de
          datos y Grimes actúa como <strong>encargado de tratamiento</strong>, procesando
          esos datos únicamente por cuenta del restaurante y para operar el servicio.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Base legal y consentimiento">
        <p>
          Tratamos los datos con base en la ejecución de la relación contractual, el
          cumplimiento de obligaciones legales (tributarias y de protección al
          consumidor) y, cuando corresponde, el consentimiento libre, previo, expreso e
          informado del titular. Los formularios del sitio señalan qué campos son
          obligatorios y con qué finalidad.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Encargados y transferencias">
        <p>
          Para prestar el servicio nos apoyamos en proveedores que tratan datos por
          nuestra cuenta y bajo contrato: alojamiento e infraestructura en la nube,
          pasarelas de pago (que procesan los datos de tarjeta directamente, sin que
          pasen por nuestros servidores), operadores de facturación electrónica
          autorizados por SUNAT y servicios de correo transaccional. Algunos de estos
          proveedores pueden estar ubicados fuera del Perú; en tal caso se aplican las
          reglas de transferencia de la Ley N.º 29733.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Plazo de conservación">
        <LegalList
          items={[
            "Datos de facturación: el plazo exigido por la normativa tributaria.",
            "Datos operativos del restaurante: mientras la cuenta esté activa; tras la cancelación, exportables durante 30 días antes del archivado.",
            "Registros técnicos de seguridad: hasta 12 meses.",
          ]}
        />
      </LegalSection>

      <LegalSection number="6" title="Medidas de seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito
          (HTTPS), contraseñas almacenadas con hash, control de acceso por roles,
          aislamiento de la información por cliente y copias de seguridad periódicas.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Tus derechos (ARCO)">
        <p>
          Todo titular puede ejercer sus derechos de <strong>acceso, rectificación,
          cancelación y oposición</strong>, así como revocar su consentimiento, de forma
          gratuita, escribiendo al canal oficial: WhatsApp +51 970 642 671 o al correo
          [CORREO DE CONTACTO]. Atendemos las solicitudes en los plazos que fija la ley.
          Si consideras que tu solicitud no fue atendida, puedes acudir a la Autoridad
          Nacional de Protección de Datos Personales (MINJUSDH).
        </p>
      </LegalSection>

      <LegalSection number="8" title="Cookies y tecnologías similares">
        <p>
          El sitio utiliza únicamente el almacenamiento estrictamente necesario para su
          funcionamiento (por ejemplo, mantener la sesión iniciada del personal). No
          usamos cookies publicitarias de terceros. Si esto cambia, esta política se
          actualizará y se solicitará el consentimiento correspondiente.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Cambios en esta política">
        <p>
          Publicaremos aquí cualquier actualización, indicando la fecha de vigencia. Los
          cambios sustanciales se comunicarán a los clientes por los canales de contacto
          registrados.
        </p>
      </LegalSection>
    </article>
  );
}
