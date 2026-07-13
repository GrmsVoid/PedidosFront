import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Solo la landing y /pedir son públicas e indexables. Los paneles de staff,
// el login y las sesiones de mesa por QR no aportan SEO y no deben aparecer
// en resultados de búsqueda.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/caja", "/kds", "/mozo", "/staff", "/login", "/m/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
