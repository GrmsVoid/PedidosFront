/**
 * Config central del sitio para SEO: una sola fuente de verdad que consumen
 * layout (metadata), robots.ts, sitemap.ts y el JSON-LD de la landing.
 *
 * NEXT_PUBLIC_SITE_URL debe apuntar al dominio público en producción
 * (p.ej. https://grimesos.com); sin él, canónicas/OG/sitemap salen con
 * localhost y Google las ignora.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Grimes/OS";

export const SITE_TITLE = "Grimes/OS — Sistema de pedidos para restaurantes en tiempo real";

export const SITE_DESCRIPTION =
  "Sistema de pedidos para restaurantes y cafeterías: carta digital con QR, " +
  "comandas a cocina (KDS), caja, plano del salón y reportes — todo conectado " +
  "en tiempo real. Diseñado por Grimes.";

export const SITE_KEYWORDS = [
  "sistema de pedidos para restaurantes",
  "carta digital QR",
  "pedidos por QR",
  "menú digital para restaurantes",
  "comandas digitales",
  "KDS pantalla de cocina",
  "software para restaurantes",
  "sistema para cafeterías",
  "pedidos en tiempo real",
  "punto de venta restaurante Perú",
];
