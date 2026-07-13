"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers";
import { ClientApiError } from "@/lib/client-api";
import { homeForRoles } from "@/lib/roles";

const DEMOS: Array<{ rol: string; email: string; secret: string }> = [
  { rol: "Admin", email: "admin@cafe.demo", secret: "admin123" },
  { rol: "Mozo", email: "mozo@cafe.demo", secret: "demo123" },
  { rol: "Cocina", email: "barista@cafe.demo", secret: "demo123" },
  { rol: "Caja", email: "cajero@cafe.demo", secret: "demo123" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = params.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ingresar(mail: string, pass: string) {
    setLoading(true);
    setError(null);
    try {
      // Cada rol entra directo a su pantalla; el callback solo si venía de una.
      const u = await login(mail, pass);
      router.push(callbackUrl ?? homeForRoles(u.roles ?? []));
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? "Credenciales inválidas." : "No se pudo conectar.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await ingresar(email, secret);
  }

  return (
    <div className="w-full max-w-md animate-fade-up">
      <Link
        href="/"
        className="mb-10 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <div className="mb-9 border-b border-line pb-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink text-sm font-bold text-white">
            G
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Grimes<span className="text-brand">/OS</span>
          </span>
        </div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Área operativa</p>
        <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.045em] text-ink sm:text-5xl">
          Acceso staff
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Cada perfil entra directo a su pantalla de trabajo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-line bg-panel px-4 py-3 text-sm text-ink transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            placeholder="admin@cafe.demo"
          />
        </Field>
        <Field label="PIN o contraseña">
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-sm border border-line bg-panel px-4 py-3 text-sm text-ink transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            placeholder="••••••"
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Ingresar
        </Button>
      </form>

      <div className="mt-8 rounded-sm border border-line bg-panel p-4">
        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Cuentas demo · un toque
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              type="button"
              disabled={loading}
              onClick={() => {
                setEmail(d.email);
                setSecret(d.secret);
                ingresar(d.email, d.secret);
              }}
              className="rounded-sm border border-line bg-paper px-3 py-2.5 text-left transition-all duration-150 hover:border-brand hover:bg-accent-soft active:scale-[0.98] disabled:opacity-50"
            >
              <span className="block text-sm font-semibold text-ink">{d.rol}</span>
              <span className="block truncate font-mono text-[10px] text-muted">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-brand" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-xs font-bold text-ink">
            G
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Grimes<span className="text-brand">/OS</span>
          </span>
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Restaurant operating system
          </p>
          <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white xl:text-6xl">
            Todo tu salón,
            <br />
            en un mismo pulso<span className="text-brand">.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-400">
            Mesas, comandas, cocina y caja sincronizadas en tiempo real.
          </p>
          <div className="mt-9 grid max-w-lg grid-cols-3 border border-neutral-800">
            {[["01", "Salón"], ["02", "Cocina"], ["03", "Caja"]].map(([number, label]) => (
              <div key={number} className="border-r border-neutral-800 p-4 last:border-r-0">
                <span className="font-mono text-[9px] text-neutral-600">{number}</span>
                <p className="mt-5 text-sm font-semibold text-neutral-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600">
          Diseñado y desarrollado por Grimes · @Void_grms
        </p>
      </aside>

      <div className="flex items-center justify-center bg-paper px-5 py-10 sm:px-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
