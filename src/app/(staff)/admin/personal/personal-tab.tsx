"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { api, ClientApiError } from "@/lib/client-api";
import { fmt } from "@/lib/money";
import type { RolCodigo } from "@/lib/roles";
import { inputCls } from "../finanzas/rango";

type Tipo = "FIJO_MENSUAL" | "POR_HORA" | "POR_TURNO";
export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  telefono: string | null;
  tipoRemuneracion: Tipo;
  sueldoMensual: string | null;
  tarifaHora: string | null;
  montoTurno: string | null;
  roles: RolCodigo[];
};

const ROLES: RolCodigo[] = ["MOZO", "BARISTA", "CAJERO", "ADMIN"];
const TIPO_LABEL: Record<Tipo, string> = {
  FIJO_MENSUAL: "Sueldo mensual",
  POR_HORA: "Por hora",
  POR_TURNO: "Por turno",
};
const TIPO_CAMPO: Record<Tipo, string> = {
  FIJO_MENSUAL: "Sueldo mensual (S/)",
  POR_HORA: "Tarifa por hora (S/)",
  POR_TURNO: "Monto por turno (S/)",
};
const ROL_TONE: Record<RolCodigo, "blue" | "amber" | "green" | "violet"> = {
  MOZO: "blue",
  BARISTA: "amber",
  CAJERO: "green",
  ADMIN: "violet",
};

function remuneracion(u: Usuario): string {
  if (u.tipoRemuneracion === "FIJO_MENSUAL") return u.sueldoMensual ? `${fmt(u.sueldoMensual)}/mes` : "Sueldo mensual";
  if (u.tipoRemuneracion === "POR_HORA") return u.tarifaHora ? `${fmt(u.tarifaHora)}/h` : "Por hora";
  return u.montoTurno ? `${fmt(u.montoTurno)}/turno` : "Por turno";
}

export function PersonalTab() {
  const [list, setList] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<{ user: Usuario | null } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setList(await api.get<Usuario[]>("/api/admin/usuarios"));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "No se pudo cargar");
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Operación fallida");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Personal</h1>
          <p className="text-sm text-slate-500">Staff del local, roles y remuneración.</p>
        </div>
        <Button onClick={() => setModal({ user: null })}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!list ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((u) => (
            <Card key={u.id} className={cn(!u.activo && "opacity-60")}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{u.nombre}</span>
                    {u.roles.map((r) => (
                      <Badge key={r} tone={ROL_TONE[r]}>
                        {r}
                      </Badge>
                    ))}
                    {!u.activo && <Badge tone="slate">inactivo</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {u.email} · {remuneracion(u)}
                    {u.telefono && ` · ${u.telefono}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === u.id}
                    onClick={() => run(u.id, () => api.patch(`/api/admin/usuarios/${u.id}`, { activo: !u.activo }))}
                  >
                    <Power className="h-4 w-4" /> {u.activo ? "Desactivar" : "Activar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModal({ user: u })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === u.id}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar a ${u.nombre}?`)) run(u.id, () => api.del(`/api/admin/usuarios/${u.id}`));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <UsuarioModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await cargar();
          }}
        />
      )}
    </div>
  );
}

function UsuarioModal({
  user,
  onClose,
  onSaved,
}: {
  user: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!user;
  const [email, setEmail] = useState(user?.email ?? "");
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [secret, setSecret] = useState("");
  const [telefono, setTelefono] = useState(user?.telefono ?? "");
  const [roles, setRoles] = useState<RolCodigo[]>(user?.roles ?? ["MOZO"]);
  const [tipo, setTipo] = useState<Tipo>(user?.tipoRemuneracion ?? "FIJO_MENSUAL");
  const [monto, setMonto] = useState(
    (user
      ? user.tipoRemuneracion === "FIJO_MENSUAL"
        ? user.sueldoMensual
        : user.tipoRemuneracion === "POR_HORA"
          ? user.tarifaHora
          : user.montoTurno
      : "") ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRol(r: RolCodigo) {
    setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (roles.length === 0) {
      setError("Asigna al menos un rol");
      return;
    }
    setSaving(true);
    setError(null);
    const m = monto.trim() ? (parseFloat(monto) || 0).toFixed(2) : null;
    const campo = tipo === "FIJO_MENSUAL" ? "sueldoMensual" : tipo === "POR_HORA" ? "tarifaHora" : "montoTurno";
    try {
      if (editing && user) {
        await api.patch(`/api/admin/usuarios/${user.id}`, {
          nombre,
          roles,
          telefono: telefono.trim() || null,
          tipoRemuneracion: tipo,
          sueldoMensual: tipo === "FIJO_MENSUAL" ? m : null,
          tarifaHora: tipo === "POR_HORA" ? m : null,
          montoTurno: tipo === "POR_TURNO" ? m : null,
          ...(secret.trim() ? { secret } : {}),
        });
      } else {
        await api.post("/api/admin/usuarios", {
          email,
          nombre,
          secret,
          roles,
          telefono: telefono.trim() || undefined,
          tipoRemuneracion: tipo,
          ...(m ? { [campo]: m } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-display font-semibold tracking-tight text-slate-900">
            {editing ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={guardar} className="flex-1 space-y-3 overflow-y-auto p-4">
          <Campo label="Nombre">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputCls + " w-full"} />
          </Campo>
          <Campo label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={editing}
              className={cn(inputCls, "w-full", editing && "bg-slate-50 text-slate-400")}
            />
          </Campo>
          <Campo label={editing ? "PIN/contraseña (dejar en blanco = sin cambio)" : "PIN o contraseña"}>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required={!editing}
              placeholder="••••••"
              className={inputCls + " w-full"}
            />
          </Campo>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Roles</span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRol(r)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      on ? "border-ink bg-ink text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Remuneración">
              <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className={inputCls + " w-full"}>
                {(Object.keys(TIPO_LABEL) as Tipo[]).map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label={TIPO_CAMPO[tipo]}>
              <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" placeholder="0.00" className={inputCls + " w-full"} />
            </Campo>
          </div>

          <Campo label="Teléfono (opcional)">
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls + " w-full"} />
          </Campo>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
