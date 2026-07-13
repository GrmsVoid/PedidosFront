"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hoja de Reclamación virtual (D.S. 011-2011-PCM). Modo interino: la hoja se
 * envía por WhatsApp con formato estructurado y el consumidor conserva ese
 * mismo hilo como constancia; la numeración correlativa y la constancia por
 * correo se emiten al registrar la hoja (respuesta en máx. 15 días hábiles).
 */

const WHATSAPP_NUMBER = "51970642671";

const FIELD_CLASS =
  "w-full border border-[#cbc9c0] bg-white px-3.5 py-3 text-sm text-[#181816] placeholder:text-[#9a998f] focus:border-[#181816] focus:outline-none";

const LABEL_CLASS = "block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5e5d57]";

type Tipo = "RECLAMO" | "QUEJA";

export function ReclamoForm() {
  const [tipo, setTipo] = useState<Tipo>("RECLAMO");
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState("Plan SaaS");
  const [detalle, setDetalle] = useState("");
  const [pedido, setPedido] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    if (!nombre.trim() || !documento.trim() || !detalle.trim() || !pedido.trim()) {
      setError("Completa los campos obligatorios: nombre, documento, detalle y pedido.");
      return;
    }
    if (!acepta) {
      setError("Debes aceptar la Política de Privacidad para enviar la hoja.");
      return;
    }
    setError(null);

    const hoja = [
      "HOJA DE RECLAMACIÓN — Grimes/OS",
      `Fecha: ${new Date().toLocaleDateString("es-PE", { timeZone: "America/Lima" })}`,
      `Tipo: ${tipo}`,
      `Nombre: ${nombre.trim()}`,
      `Documento (DNI/CE): ${documento.trim()}`,
      `Correo: ${email.trim() || "—"}`,
      `Teléfono: ${telefono.trim() || "—"}`,
      `Servicio contratado: ${servicio}`,
      `Detalle: ${detalle.trim()}`,
      `Pedido del consumidor: ${pedido.trim()}`,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(hoja)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <div className="border border-[#d3d2ca] bg-[#fcfbf7] p-6 sm:p-8">
      <fieldset>
        <legend className={LABEL_CLASS}>Tipo *</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["RECLAMO", "Disconformidad con el servicio contratado"],
              ["QUEJA", "Malestar con la atención, no referido al servicio"],
            ] as const
          ).map(([value, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${
                tipo === value ? "border-[#181816] bg-white" : "border-[#cbc9c0]"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={value}
                checked={tipo === value}
                onChange={() => setTipo(value)}
                className="mt-0.5 accent-[#181816]"
              />
              <span>
                <span className="block text-sm font-semibold">{value}</span>
                <span className="mt-0.5 block text-xs text-[#77766f]">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rec-nombre" className={LABEL_CLASS}>
            Nombre completo *
          </label>
          <input
            id="rec-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`mt-2 ${FIELD_CLASS}`}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="rec-doc" className={LABEL_CLASS}>
            DNI / CE *
          </label>
          <input
            id="rec-doc"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className={`mt-2 ${FIELD_CLASS}`}
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor="rec-email" className={LABEL_CLASS}>
            Correo
          </label>
          <input
            id="rec-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-2 ${FIELD_CLASS}`}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="rec-tel" className={LABEL_CLASS}>
            Teléfono
          </label>
          <input
            id="rec-tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={`mt-2 ${FIELD_CLASS}`}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="rec-servicio" className={LABEL_CLASS}>
          Servicio contratado *
        </label>
        <select
          id="rec-servicio"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className={`mt-2 ${FIELD_CLASS}`}
        >
          <option>Plan SaaS</option>
          <option>Plan Personalizado</option>
          <option>Demo / otro</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="rec-detalle" className={LABEL_CLASS}>
          Detalle del {tipo === "RECLAMO" ? "reclamo" : "malestar"} *
        </label>
        <textarea
          id="rec-detalle"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          rows={4}
          className={`mt-2 ${FIELD_CLASS}`}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="rec-pedido" className={LABEL_CLASS}>
          ¿Qué solicitas? *
        </label>
        <textarea
          id="rec-pedido"
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          rows={2}
          className={`mt-2 ${FIELD_CLASS}`}
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-[#3f3e39]">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-1 accent-[#181816]"
        />
        <span>
          Autorizo el tratamiento de estos datos para atender mi hoja de reclamación,
          conforme a la{" "}
          <Link href="/privacidad" className="underline underline-offset-2">
            Política de Privacidad
          </Link>
          . *
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 border border-[#e4b6ab] bg-[#fdf1ee] px-3.5 py-2.5 text-sm text-[#9a3820]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        className="group mt-6 inline-flex min-h-12 items-center gap-2.5 bg-[#181816] px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#ff5733]"
      >
        Enviar hoja por WhatsApp
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
      </button>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] leading-relaxed text-[#77766f]">
        Recibirás la constancia con tu número de hoja por el mismo medio ·
        Respuesta en máx. 15 días hábiles
      </p>
    </div>
  );
}
