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
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <div className="mb-8">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
          ☕
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Acceso staff
        </h1>
        <p className="mt-1 text-sm text-slate-500">
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
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            placeholder="admin@cafe.demo"
          />
        </Field>
        <Field label="PIN o contraseña">
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            placeholder="••••••"
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Ingresar
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
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
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-left transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="block text-sm font-medium text-slate-800">{d.rol}</span>
              <span className="block truncate text-[11px] text-slate-400">{d.email}</span>
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
