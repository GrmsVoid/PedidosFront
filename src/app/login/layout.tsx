import type { Metadata } from "next";

// El login es "use client"; su metadata vive en este layout. Página privada:
// no debe aparecer en buscadores.
export const metadata: Metadata = {
  title: "Acceso del personal",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
