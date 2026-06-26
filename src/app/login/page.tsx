"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers";
import { ClientApiError } from "@/lib/client-api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = params.get("callbackUrl") ?? "/staff";
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, secret);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? "Credenciales inválidas." : "No se pudo conectar.");
    } finally {
      setLoading(false);
    }
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
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
          ☕
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Acceso staff
        </h1>
        <p className="mt-1 text-sm text-slate-500">Ingresa para gestionar el local.</p>
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
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">Demo · admin@cafe.demo / admin123</p>
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
