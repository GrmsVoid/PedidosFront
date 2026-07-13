import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Cascarón compartido de las páginas legales: header con retorno al inicio,
// contenedor angosto de lectura y pie sobrio. URLs limpias (/terminos, etc.)
// gracias al route group.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#181816]">
      <header className="sticky top-0 z-50 border-b border-[#d9d8d1] bg-[#f8f7f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[840px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Grimes OS, inicio" className="flex min-h-11 items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center bg-[#181816] text-[11px] font-bold text-white">
              G
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.025em]">
              Grimes<span className="text-[#ff5733]">/OS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#66655f] transition-colors hover:text-[#181816]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-5 py-14 sm:px-8 sm:py-20">{children}</main>

      <footer className="border-t border-[#d9d8d1]">
        <div className="mx-auto flex max-w-[840px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-[#66655f] sm:px-8">
          <span>Grimes/OS · Sistema de pedidos</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terminos" className="transition-colors hover:text-[#181816]">
              Términos
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-[#181816]">
              Privacidad
            </Link>
            <Link href="/libro-de-reclamaciones" className="transition-colors hover:text-[#181816]">
              Libro de Reclamaciones
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
