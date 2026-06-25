"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientApiError } from "@/lib/client-api";

type Mesa = {
  id: string;
  codigo: string;
  capacidad: number;
  estado: "LIBRE" | "OCUPADA" | "UNIDA";
  qrToken: string;
};

function QrImage({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let ok = true;
    QRCode.toDataURL(value, { width: 160, margin: 1 })
      .then((d) => ok && setSrc(d))
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [value]);
  if (!src) return <div className="h-40 w-40 animate-pulse rounded bg-slate-100" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR" className="h-40 w-40" />;
}

export function MesasTab() {
  const [mesas, setMesas] = useState<Mesa[] | null>(null);
  const [origin, setOrigin] = useState("");
  const [codigo, setCodigo] = useState("");
  const [capacidad, setCapacidad] = useState(4);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  async function cargar() {
    try {
      setMesas(await api.get<Mesa[]>("/api/admin/mesas"));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "Error al cargar mesas");
    }
  }
  useEffect(() => {
    cargar();
  }, []);

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

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    await run("crear", () => api.post("/api/admin/mesas", { codigo, capacidad }));
    setCodigo("");
    setCapacidad(4);
  }

  if (!mesas) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={crear} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Código</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="M11"
            className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Capacidad</label>
          <input
            type="number"
            min={1}
            max={20}
            value={capacidad}
            onChange={(e) => setCapacidad(Number(e.target.value))}
            className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <Button type="submit" disabled={busy === "crear"}>
          Agregar mesa
        </Button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mesas.map((m) => (
          <Card key={m.id}>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{m.codigo}</span>
                <Badge tone={m.estado === "LIBRE" ? "green" : "blue"}>{m.estado}</Badge>
              </div>
              {origin && <QrImage value={`${origin}/m/${m.id}?t=${m.qrToken}`} />}
              <p className="break-all text-[10px] text-slate-400">
                {origin}/m/{m.id}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === m.id}
                  onClick={() => run(m.id, () => api.post(`/api/admin/mesas/${m.id}/regenerar-qr`))}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === m.id || m.estado !== "LIBRE"}
                  onClick={() => run(m.id, () => api.del(`/api/admin/mesas/${m.id}`))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <QrCode className="h-4 w-4" /> Imprime cada QR y pégalo en su mesa. “Regenerar” invalida el
        anterior.
      </p>
    </div>
  );
}
