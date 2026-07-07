import Link from "next/link";
import { FeaturedMenu } from "@/components/landing/featured-menu";

const NAV = [
  { href: "#menu", label: "Menú" },
  { href: "#como", label: "Cómo pedir" },
  { href: "#anticipa", label: "Pide antes" },
  { href: "#visita", label: "Visítanos" },
];

const PASOS = [
  {
    n: "01",
    t: "Escanea el QR",
    d: "Cada mesa tiene su código. Apúntale con la cámara y abre tu mesa al instante, sin apps ni registros.",
  },
  {
    n: "02",
    t: "Arma tu pedido",
    d: "Explora la carta, personaliza con modificadores y envíalo directo a barra desde tu teléfono.",
  },
  {
    n: "03",
    t: "Disfruta",
    d: "Sigue el estado en vivo, llama al mozo o pide la cuenta cuando quieras. Tú solo relájate.",
  },
];

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm text-white">
              ☕
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Café Demo</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 sm:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-ink"
          >
            Staff →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Café de especialidad · Pedidos por QR
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
          Pide desde tu mesa.
          <br />
          <span className="text-slate-300">Sin filas, sin esperas.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          Escanea el código de tu mesa, arma tu pedido a tu gusto y nosotros te lo llevamos. Tú solo
          relájate y disfruta tu café.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#menu"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-[15px] font-medium tracking-tight text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
          >
            Ver la carta
          </a>
          <Link
            href="/pedir"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-[15px] font-medium tracking-tight text-ink transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            Pide antes de llegar →
          </Link>
        </div>

        <div className="mt-16 grid max-w-lg grid-cols-3 gap-8 border-t border-slate-100 pt-8">
          <Stat k="< 30s" v="Abrir tu mesa" />
          <Stat k="En vivo" v="Estado del pedido" />
          <Stat k="Split" v="Divide la cuenta" />
        </div>
      </section>

      {/* Cómo pedir */}
      <section id="como" className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle eyebrow="Cómo pedir" title="Tres pasos y listo" />
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {PASOS.map((p) => (
              <div key={p.n}>
                <span className="font-display text-sm font-semibold text-accent">{p.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{p.t}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pide antes de llegar */}
      <section id="anticipa" className="border-t border-slate-100">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:grid-cols-2">
          <div>
            <SectionTitle eyebrow="¿Vienes en camino?" title="Pide antes de llegar" />
            <p className="mt-5 max-w-md leading-relaxed text-slate-600">
              Mira el salón <b>tal como está ahora</b>, elige la mesa que más te guste y deja tu
              pedido listo. Cuando el mozo lo confirme, entra a cocina — llegas y tu café te
              espera.
            </p>
            <Link
              href="/pedir"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-[15px] font-medium tracking-tight text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
            >
              Elegir mi mesa →
            </Link>
            <p className="mt-4 text-xs text-slate-400">
              Recibirás un código para confirmar tu pedido con el mozo, por teléfono o al llegar.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              ["01", "Elige tu mesa", "Ve la distribución real del local y toca una mesa libre."],
              ["02", "Arma tu pedido", "La misma carta del local, con personalizaciones y combos."],
              ["03", "El mozo confirma", "Te damos un código; al confirmarlo, tu pedido entra a cocina."],
            ].map(([n, t, d]) => (
              <li
                key={n}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,11,13,0.03)]"
              >
                <span className="font-display text-sm font-semibold text-accent">{n}</span>
                <div>
                  <h3 className="font-display font-semibold tracking-tight">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Menú destacado */}
      <section id="menu" className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle eyebrow="Carta" title="Lo que servimos hoy" />
          <FeaturedMenu />
        </div>
      </section>

      {/* Visítanos */}
      <section id="visita" className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Visítanos
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-slate-300">
              Te esperamos con el mejor café de la ciudad. Trae a alguien que te caiga bien.
            </p>
            <a
              href="#menu"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium tracking-tight text-ink transition-all hover:bg-slate-100 active:scale-[0.98]"
            >
              Ver la carta
            </a>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-7 text-sm">
            <Info t="Horario" l1="Lun–Vie · 7:00–21:00" l2="Sáb–Dom · 8:00–22:00" />
            <Info t="Dónde" l1="Av. Siempre Viva 123" l2="Lima, Perú" />
            <Info t="Contacto" l1="hola@cafe.demo" l2="+51 999 999 999" />
            <Info t="Redes" l1="@cafedemo" l2="Instagram · TikTok" />
          </dl>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <span>☕</span>
            <span className="font-display font-semibold text-slate-600">Café Demo</span>
          </div>
          <p>© {year} Café Demo. Hecho con cariño.</p>
          <Link href="/login" className="transition-colors hover:text-ink">
            Acceso staff
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tracking-tight text-ink">{k}</div>
      <div className="mt-1 text-sm text-slate-500">{v}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

function Info({ t, l1, l2 }: { t: string; l1: string; l2: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t}</dt>
      <dd className="mt-2 text-slate-200">{l1}</dd>
      <dd className="text-slate-400">{l2}</dd>
    </div>
  );
}
