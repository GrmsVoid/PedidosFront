import { HomeView } from "@/components/landing/home-view";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Datos estructurados (schema.org) para resultados enriquecidos en Google:
// el producto (SoftwareApplication) y su autor. Se renderizan en el servidor,
// dentro del HTML inicial, donde el crawler los espera.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "PEN",
        offerCount: 2,
        offers: [
          {
            "@type": "Offer",
            name: "SaaS — listo para operar",
            description:
              "Sistema completo en la nube por suscripción mensual: carta QR, KDS, caja y admin, con hosting y soporte incluidos.",
          },
          {
            "@type": "Offer",
            name: "Personalizado — con tu marca",
            description:
              "Proyecto a medida con logo, colores, tipografía y dominio del restaurante, más funciones a medida (POS, ticketera, integraciones).",
          },
        ],
      },
      featureList: [
        "Carta digital con código QR",
        "Pedidos del cliente en tiempo real",
        "Pantalla de cocina (KDS)",
        "Caja y división de cuenta",
        "Plano del salón multi-piso",
        "Reportes y finanzas",
      ],
      author: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: "Grimes",
      url: "https://instagram.com/void_grms",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <HomeView />
    </>
  );
}
