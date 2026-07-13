"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ArrowRight,
  ClipboardList,
  CookingPot,
  LayoutDashboard,
  QrCode,
  Radio,
  Wallet,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const loadMotionFeatures = () => import("./motion-features").then((module) => module.default);

const MODULES = [
  {
    icon: QrCode,
    key: "cliente",
    title: "Cliente",
    description:
      "Escanea el QR de la mesa, arma el pedido con modificadores y combos, y sigue el estado en vivo. Sin apps.",
    grid: "lg:col-span-5",
  },
  {
    icon: CookingPot,
    key: "cocina",
    title: "Cocina · KDS",
    description:
      "Comandas ordenadas por estación, con tiempos de preparación y cambios de estado sin fricción.",
    grid: "lg:col-span-7",
  },
  {
    icon: ClipboardList,
    key: "mozo",
    title: "Mozo",
    description:
      "El salón en tiempo real: abrir, unir y separar mesas, tomar pedidos y atender avisos al instante.",
    grid: "lg:col-span-4",
  },
  {
    icon: Wallet,
    key: "caja",
    title: "Caja",
    description:
      "Cuenta consolidada, pagos parciales, dividir por comensal y cierre con arqueo.",
    grid: "lg:col-span-4",
  },
  {
    icon: Radio,
    key: "tiempo-real",
    title: "Tiempo real",
    description:
      "Cada cambio se sincroniza entre mozo, cocina y caja en milisegundos vía Socket.IO.",
    grid: "lg:col-span-4",
  },
  {
    icon: LayoutDashboard,
    key: "admin",
    title: "Admin",
    description:
      "Carta y precios del día, combos, personal, turnos, planilla y reportes del negocio.",
    grid: "lg:col-span-12",
  },
] as const;

const FLOW_STEPS = [
  { number: "01", title: "Escanea", description: "El QR de la mesa" },
  { number: "02", title: "Pide", description: "Arma y envía a barra" },
  { number: "03", title: "Cocina", description: "Entra al KDS" },
  { number: "04", title: "Listo", description: "Estado en vivo" },
  { number: "05", title: "Paga", description: "Divide y cierra" },
] as const;

const LIVE_EVENTS = [
  ["Pedido recibido", "Mesa 07"],
  ["Cocina preparando", "#1042"],
  ["Mesa avisada", "Ahora"],
  ["Pago registrado", "S/ 86.00"],
] as const;

export function HomeView() {
  const root = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    if (!root.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context((self) => {
        const select = self.selector!;
        const hero = gsap.timeline({ defaults: { ease: "power3.out" } });

        hero
          .fromTo(
            select(".hero-word"),
            { yPercent: 115 },
            { yPercent: 0, duration: 0.85, stagger: 0.08 },
          )
          .fromTo(
            select(".hero-reveal"),
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08 },
            "-=0.5",
          )
          .fromTo(
            select(".scene-panel"),
            { autoAlpha: 0, y: 24, scale: 0.985 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.09 },
            "-=0.55",
          );

        gsap.to(select(".scene-ticket"), {
          y: -7,
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(select(".ticker-track"), {
          xPercent: -50,
          duration: 24,
          ease: "none",
          repeat: -1,
        });

        select("[data-reveal]").forEach((element: Element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                once: true,
              },
            },
          );
        });

        gsap.fromTo(
          select(".module-card"),
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: select(".module-grid")[0],
              start: "top 78%",
              once: true,
            },
          },
        );

        gsap.fromTo(
          select(".flow-step"),
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: select(".flow-steps")[0],
              start: "top 78%",
              once: true,
            },
          },
        );
      }, root);

      return () => context.revert();
    });

    media.add(
      {
        desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const conditions = context.conditions as { desktop?: boolean; mobile?: boolean };
        const animation = gsap.to(
          conditions.desktop ? ".flow-line-fill-desktop" : ".flow-line-fill-mobile",
          {
            [conditions.desktop ? "scaleX" : "scaleY"]: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "#flujo",
              start: "top 68%",
              end: "bottom 62%",
              scrub: 0.8,
            },
          },
        );

        return () => animation.revert();
      },
    );

    return () => media.revert();
  }, []);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
      >
        <div ref={root} className="min-h-screen overflow-hidden bg-[#f8f7f3] text-[#181816]">
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 bg-[#181816] px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-50 border-b border-[#d9d8d1] bg-[#f8f7f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Wordmark />

          <nav aria-label="Navegación principal" className="hidden items-center gap-8 text-sm font-medium text-[#66655f] md:flex">
            <a href="#modulos" className="transition-colors duration-200 hover:text-[#181816]">
              Qué incluye
            </a>
            <a href="#flujo" className="transition-colors duration-200 hover:text-[#181816]">
              Cómo funciona
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-2.5 text-sm font-medium text-[#66655f] transition-colors hover:text-[#181816] sm:px-4"
            >
              <span className="sm:hidden">Staff</span>
              <span className="hidden sm:inline">Acceso staff</span>
            </Link>
            <m.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/pedir"
                className="group inline-flex min-h-11 items-center justify-center gap-2 bg-[#181816] px-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#ff5733] sm:px-5"
              >
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Ver la demo</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            </m.div>
          </div>
        </div>
      </header>

      <main id="contenido">
        <section className="relative border-b border-[#d9d8d1]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(24,24,22,.055) 1px, transparent 1px)",
              backgroundSize: "calc((100% - 2.5rem) / 4) 100%",
            }}
          />

          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:min-h-[760px] lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-24">
            <div className="lg:col-span-7 lg:pr-6">
              <h1 className="text-[3.6rem] font-semibold leading-[0.88] tracking-[-0.072em] text-[#181816] max-[360px]:text-[3.45rem] sm:text-[clamp(4.1rem,7.8vw,7.8rem)]">
                <span className="block overflow-hidden pb-[0.07em]">
                  <span className="hero-word block">Toma, prepara</span>
                </span>
                <span className="block overflow-hidden pb-[0.07em]">
                  <span className="hero-word block">y cobra pedidos</span>
                </span>
                <span className="block overflow-hidden pb-[0.07em]">
                  <span className="hero-word block">
                    en un solo lugar<span className="text-[#ff5733]">.</span>
                  </span>
                </span>
              </h1>

              <div className="mt-8 grid gap-7 border-t border-[#cbc9c0] pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="hero-reveal max-w-xl text-base leading-relaxed text-[#5f5e58] sm:text-lg">
                  Un flujo que conecta al cliente, al mozo, a la cocina y a la caja.
                  Sin apps que instalar, sin comandas en papel.
                </p>
                <span className="hero-reveal hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#77766f] sm:block">
                  QR → KDS → Pago
                </span>
              </div>

              <div className="hero-reveal mt-8 flex flex-wrap gap-3">
                <m.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/pedir"
                    className="group inline-flex min-h-12 items-center justify-center gap-2.5 bg-[#181816] px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#ff5733]"
                  >
                    Ver la demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                  </Link>
                </m.div>
                <m.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center justify-center border border-[#181816] bg-transparent px-6 text-[15px] font-semibold text-[#181816] transition-colors duration-200 hover:bg-white"
                  >
                    Acceso staff
                  </Link>
                </m.div>
              </div>

              <div className="hero-reveal mt-10 flex items-center gap-3 text-xs font-medium text-[#66655f]">
                <span className="h-px w-8 bg-[#b8b7b0]" />
                Cliente · Mozo · Cocina · Caja · Admin
              </div>
            </div>

            <div className="lg:col-span-5">
              <OperationalScene />
            </div>
          </div>
        </section>

        <StatusTicker />

        <section id="modulos" className="scroll-mt-20 border-b border-[#d9d8d1]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div data-reveal className="grid gap-8 border-b border-[#cbc9c0] pb-9 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77766f]">01 / Qué incluye</p>
                <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                  Seis piezas.
                  <br />
                  Un mismo pulso.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-[#5f5e58] lg:col-span-4 lg:col-start-9">
                Cada rol ve exactamente lo que necesita. Todo cambia al instante, sin perder el hilo de la operación.
              </p>
            </div>

            <div className="module-grid mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-12">
              {MODULES.map((module, index) => {
                const Icon = module.icon;
                return (
                  <article
                    key={module.key}
                    className={`module-card group flex min-h-[340px] flex-col border border-[#d3d2ca] bg-[#fcfbf7] p-5 transition-[border-color,background-color] duration-200 hover:border-[#181816] hover:bg-white sm:p-6 ${module.grid}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <m.div
                        whileHover={{ y: -3, rotate: -4 }}
                        whileTap={{ scale: 0.94 }}
                        className="flex h-10 w-10 items-center justify-center border border-[#cbc9c0] bg-[#f8f7f3] transition-colors group-hover:border-[#ff5733] group-hover:text-[#ff5733]"
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      </m.div>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-[#77766f]">0{index + 1}</span>
                    </div>

                    <ModulePreview type={module.key} />

                    <div className="mt-auto border-t border-[#deddd6] pt-5">
                      <h3 className="text-xl font-semibold tracking-[-0.025em]">{module.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#62615b]">{module.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="flujo" className="scroll-mt-20 border-b border-[#d9d8d1] bg-[#efeee8]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div data-reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a6962]">02 / Cómo funciona</p>
                <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                  Del QR al cierre,
                  <br />
                  sin fricción.
                </h2>
              </div>
              <p className="max-w-sm text-base leading-relaxed text-[#5f5e58] lg:col-span-4 lg:col-start-9">
                Un pedido. Cinco momentos. Todas las pantallas sincronizadas.
              </p>
            </div>

            <div className="flow-steps relative mt-16 lg:mt-24">
              <div aria-hidden="true" className="absolute bottom-4 left-4 top-4 w-px bg-[#c8c7bf] lg:hidden">
                <span className="flow-line-fill-mobile block h-full w-px origin-top scale-y-0 bg-[#ff5733]" />
              </div>
              <div aria-hidden="true" className="absolute left-0 right-0 top-4 hidden h-px bg-[#c8c7bf] lg:block">
                <span className="flow-line-fill-desktop block h-px w-full origin-left scale-x-0 bg-[#ff5733]" />
              </div>

              <ol className="relative grid gap-10 pl-12 lg:grid-cols-5 lg:gap-5 lg:pl-0">
                {FLOW_STEPS.map((step) => (
                  <li key={step.number} className="flow-step relative lg:pt-14">
                    <span className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center border border-[#181816] bg-[#efeee8] font-mono text-[10px] font-semibold lg:left-0">
                      {step.number}
                    </span>
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-[#62615b]">{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div data-reveal className="relative mx-auto max-w-[1240px] overflow-hidden bg-[#181816] px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16">
            <div aria-hidden="true" className="absolute right-0 top-0 h-2 w-1/3 bg-[#ff5733]" />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#aaa9a2]">Empieza por la mesa 07</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                  Pruébalo en
                  <br />
                  30 segundos<span className="text-[#ff5733]">.</span>
                </h2>
              </div>
              <div className="lg:col-span-4">
                <p className="max-w-sm text-base leading-relaxed text-[#bbb9b0]">
                  Entra al flujo del cliente o accede como staff. Es una demo: rómpela sin miedo.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <m.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/pedir"
                      className="group inline-flex min-h-12 items-center gap-2 bg-[#ff5733] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#ff6b49]"
                    >
                      Ver la demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                    </Link>
                  </m.div>
                  <m.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center border border-[#5c5b56] px-5 text-sm font-semibold text-white transition-colors hover:border-white"
                    >
                      Acceso staff
                    </Link>
                  </m.div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d9d8d1]">
        <div className="mx-auto grid max-w-[1240px] gap-7 px-5 py-9 text-sm text-[#66655f] sm:px-8 md:grid-cols-3 md:items-center">
          <Wordmark muted />
          <p className="md:text-center">Sistema de pedidos · Diseñado y desarrollado por Grimes</p>
          <a
            href="https://instagram.com/void_grms"
            target="_blank"
            rel="noreferrer"
            className="w-fit transition-colors hover:text-[#181816] md:justify-self-end"
          >
            Grimes · @Void_grms
          </a>
        </div>
      </footer>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

function Wordmark({ muted = false }: { muted?: boolean }) {
  return (
    <Link href="/" aria-label="Grimes OS, inicio" className="group flex min-h-11 items-center gap-2.5">
      <m.span
        whileHover={{ rotate: -6, scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`flex h-7 w-7 items-center justify-center text-[11px] font-bold text-white ${muted ? "bg-[#51504b]" : "bg-[#181816]"}`}
      >
        G
      </m.span>
      <span className={`text-[15px] font-semibold tracking-[-0.025em] ${muted ? "text-[#51504b]" : "text-[#181816]"}`}>
        Grimes<span className="text-[#ff5733]">/OS</span>
      </span>
    </Link>
  );
}

function OperationalScene() {
  return (
    <div className="scene-panel relative border border-[#c9c8c0] bg-[#fcfbf7] p-3 sm:p-4" aria-label="Vista del flujo operativo de un pedido">
      <div className="flex items-center justify-between border-b border-[#d7d6cf] px-1 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6e6d66]">Live operation / 12:46</span>
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Sincronizado
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[0.72fr_1.28fr] gap-3 sm:gap-4">
        <div className="space-y-2.5" aria-hidden="true">
          {[
            ["01", "Cliente", "Pedido enviado"],
            ["02", "Mozo", "Mesa confirmada"],
            ["03", "KDS", "Preparando"],
            ["04", "Caja", "Pendiente"],
          ].map(([number, role, status], index) => (
            <div key={role} className="scene-panel relative border border-[#d7d6cf] bg-white p-2.5 sm:p-3">
              {index < 3 && <span className="absolute -bottom-3 left-4 h-3 w-px bg-[#bdbcb5]" />}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] text-[#8a8982]">{number}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${index < 3 ? "bg-[#ff5733]" : "bg-[#b8b7b0]"}`} />
              </div>
              <p className="mt-2 text-xs font-semibold sm:text-sm">{role}</p>
              <p className="mt-0.5 truncate text-[9px] text-[#77766f] sm:text-[10px]">{status}</p>
            </div>
          ))}
        </div>

        <div className="scene-ticket scene-panel border border-[#181816] bg-white">
          <div className="flex items-center justify-between bg-[#181816] px-3 py-2.5 text-white">
            <span className="text-xs font-semibold">Mesa 07</span>
            <span className="font-mono text-[9px] tracking-[0.1em] text-[#d3d2cb]">#1042</span>
          </div>
          <div className="border-b border-[#deddd6] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#73726b]">En preparación</span>
              <span className="border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] text-amber-800">08:21</span>
            </div>
          </div>
          <div className="space-y-0 px-3 py-2">
            {[
              ["2×", "Lomo saltado", "sin ají"],
              ["1×", "Chicha morada", "1 L"],
              ["1×", "Cheesecake", "llevar"],
            ].map(([quantity, name, modifier]) => (
              <div key={name} className="grid grid-cols-[auto_1fr] gap-x-2 border-b border-[#ebeae5] py-2 last:border-0">
                <span className="font-mono text-[10px] font-semibold">{quantity}</span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium sm:text-xs">{name}</p>
                  <p className="text-[9px] text-[#85847d]">{modifier}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#deddd6] px-3 py-2.5">
            <span className="text-[9px] uppercase tracking-[0.1em] text-[#77766f]">ETA</span>
            <span className="font-mono text-xs font-semibold">8 min</span>
          </div>
        </div>
      </div>

      <div className="scene-panel mt-3 flex items-center justify-between border border-[#d7d6cf] bg-[#f3f2ed] px-3 py-2.5 text-[10px]">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Último evento
        </span>
        <span className="font-mono text-[#66655f]">KDS actualizó · 4s</span>
      </div>
    </div>
  );
}

function StatusTicker() {
  return (
    <div className="border-b border-[#d9d8d1] bg-[#181816] text-white">
      <p className="sr-only">Estados en vivo: pedido recibido, cocina preparando, mesa avisada y pago registrado.</p>
      <div aria-hidden="true" className="overflow-hidden py-3.5">
        <div className="ticker-track flex w-max will-change-transform">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {LIVE_EVENTS.map(([event, detail]) => (
                <div key={`${copy}-${event}`} className="flex items-center gap-3 px-8 sm:px-12">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff5733]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.13em]">{event}</span>
                  <span className="font-mono text-[10px] text-[#9f9e97]">{detail}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModulePreview({ type }: { type: (typeof MODULES)[number]["key"] }) {
  if (type === "cliente") {
    return (
      <div aria-hidden="true" className="my-7 grid flex-1 grid-cols-[0.85fr_1.15fr] gap-2.5">
        <div className="border border-[#deddd6] bg-[#f3f2ed] p-3">
          <span className="font-mono text-[9px] text-[#85847d]">MESA 07</span>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.05em]">Carta</p>
          <div className="mt-5 h-1 w-9 bg-[#ff5733]" />
        </div>
        <div className="border border-[#deddd6] bg-white p-3">
          {["Lomo saltado", "Chicha morada", "Cheesecake"].map((item, index) => (
            <div key={item} className="flex items-center justify-between border-b border-[#ebeae5] py-2.5 last:border-0">
              <div>
                <p className="text-[10px] font-medium">{item}</p>
                <p className="mt-0.5 font-mono text-[9px] text-[#85847d]">S/ {index === 0 ? "34" : index === 1 ? "12" : "16"}</p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center border border-[#181816] text-[12px]">+</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "cocina") {
    return (
      <div aria-hidden="true" className="my-7 grid flex-1 grid-cols-3 gap-2">
        {[
          ["#1042", "08:21", "2 platos", "border-t-[#ff5733]"],
          ["#1043", "04:48", "1 bebida", "border-t-amber-500"],
          ["#1044", "01:12", "3 platos", "border-t-[#181816]"],
        ].map(([order, time, items, accent]) => (
          <div key={order} className={`border border-[#deddd6] border-t-2 ${accent} bg-white p-2.5 sm:p-3`}>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[9px] text-[#77766f]">{order}</span>
              <span className="font-mono text-[9px] font-semibold">{time}</span>
            </div>
            <p className="mt-5 text-[10px] font-semibold sm:text-xs">Mesa {Number(order.slice(-1)) + 3}</p>
            <p className="mt-1 text-[9px] text-[#85847d]">{items}</p>
            <div className="mt-4 h-1 w-full bg-[#ebeae5]">
              <div className="h-1 bg-[#181816]" style={{ width: order === "#1042" ? "74%" : order === "#1043" ? "48%" : "22%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "mozo") {
    return (
      <div aria-hidden="true" className="my-7 flex flex-1 items-center justify-center">
        <div className="grid w-full grid-cols-3 gap-2">
          {["M04", "M07", "M12", "M15", "M18", "M21"].map((table, index) => (
            <div key={table} className={`border p-2.5 ${index === 1 ? "border-[#ff5733] bg-[#fff2ed]" : "border-[#deddd6] bg-white"}`}>
              <span className="font-mono text-[9px] text-[#77766f]">{table}</span>
              <span className={`mt-4 block h-1.5 w-1.5 rounded-full ${index % 3 === 0 ? "bg-emerald-600" : index === 1 ? "bg-[#ff5733]" : "bg-[#b8b7b0]"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "caja") {
    return (
      <div aria-hidden="true" className="my-7 flex flex-1 items-center justify-center">
        <div className="w-full max-w-[240px] border border-[#deddd6] bg-white p-3">
          <div className="flex justify-between border-b border-dashed border-[#cbc9c0] pb-3 font-mono text-[9px]">
            <span>CUENTA / M07</span>
            <span>03 ITEMS</span>
          </div>
          <div className="space-y-2 py-3 text-[10px]">
            <div className="flex justify-between"><span>Consumo</span><span>S/ 76.00</span></div>
            <div className="flex justify-between text-[#77766f]"><span>Servicio</span><span>S/ 10.00</span></div>
          </div>
          <div className="flex justify-between border-t border-[#181816] pt-3 text-sm font-semibold">
            <span>Total</span><span>S/ 86.00</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "tiempo-real") {
    return (
      <div aria-hidden="true" className="my-7 flex flex-1 flex-col justify-center">
        <div className="relative h-20 border-b border-l border-[#cbc9c0]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 80" preserveAspectRatio="none">
            <polyline points="0,62 34,58 56,60 78,28 98,49 128,44 154,16 180,38 212,33 244,12 280,21" fill="none" stroke="#181816" strokeWidth="1.5" />
            <circle cx="244" cy="12" r="3" fill="#ff5733" />
          </svg>
        </div>
        <div className="mt-3 flex justify-between font-mono text-[9px] text-[#77766f]"><span>-60s</span><span>Ahora</span></div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="my-7 grid flex-1 gap-3 md:grid-cols-[1.4fr_1fr]">
      <div className="border border-[#deddd6] bg-white p-4">
        <div className="flex items-end justify-between gap-4">
          <div><span className="font-mono text-[9px] text-[#77766f]">VENTAS / HOY</span><p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">S/ 4,280</p></div>
          <span className="text-[10px] font-semibold text-emerald-700">+12.4%</span>
        </div>
        <div className="mt-7 flex h-16 items-end gap-2">
          {[36, 58, 42, 74, 52, 88, 68, 96, 76, 100, 84, 92].map((height, index) => (
            <span key={index} className={`flex-1 ${index === 9 ? "bg-[#ff5733]" : "bg-[#c9c8c0]"}`} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["48", "pedidos"], ["18m", "ticket medio"], ["12", "mesas"], ["94%", "ocupación"]].map(([value, label]) => (
          <div key={label} className="border border-[#deddd6] bg-[#f3f2ed] p-3">
            <p className="text-xl font-semibold tracking-[-0.04em]">{value}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[#77766f]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
