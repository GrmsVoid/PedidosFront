import type { ReactNode } from "react";

/**
 * Piezas de maquetación para las páginas legales (/terminos, /privacidad,
 * /libro-de-reclamaciones). Server components: texto estático, editorial,
 * misma dirección visual que la landing.
 */

export function LegalHeader({
  eyebrow,
  title,
  updated,
}: {
  eyebrow: string;
  title: string;
  updated: string;
}) {
  return (
    <header className="border-b border-[#cbc9c0] pb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77766f]">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#77766f]">
        Última actualización: {updated}
      </p>
    </header>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#deddd6] py-8 last:border-0">
      <div className="grid gap-4 sm:grid-cols-[72px_1fr]">
        <span className="font-mono text-[11px] tracking-[0.12em] text-[#9a998f]">{number}</span>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#3f3e39]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-baseline gap-3">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-[#b8b7b0]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
