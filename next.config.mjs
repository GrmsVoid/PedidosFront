/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Oculta que el stack es Next.js.
  poweredByHeader: false,
  // No publicar sourcemaps del navegador: sin ellos, el bundle minificado no se
  // puede "des-minificar" a código legible. (Es el default, explícito a propósito.)
  productionBrowserSourceMaps: false,
  // La app no se debe poder embeber en iframes de terceros (clickjacking sobre
  // caja/admin) ni permitir sniffing de tipos. Permissions-Policy corta APIs
  // sensibles que el sistema no usa.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
