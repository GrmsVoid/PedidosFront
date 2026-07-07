"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getStaffToken } from "./client-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type RealtimeAuth = {
  /** Token de sesión de mesa (cliente). */
  sessionToken?: string | null;
  /** Usa el JWT de staff guardado (pantallas de mozo/kds/caja/admin). */
  staff?: boolean;
};

/**
 * Se conecta al Socket.IO del backend, se une a las rooms indicadas y entrega
 * cada evento a `onEvent`. El polling existente queda como respaldo: aquí solo
 * "empujamos" recargas instantáneas. Devuelve si hay conexión en vivo.
 */
export function useRealtime(
  rooms: string[],
  auth: RealtimeAuth,
  onEvent: (evento: string, payload: unknown) => void,
  enabled = true,
): { conectado: boolean } {
  const [conectado, setConectado] = useState(false);
  // Ref para no reconectar cuando cambia la identidad del callback
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const roomsKey = rooms.join("|");
  const sessionToken = auth.sessionToken ?? null;
  const staff = auth.staff ?? false;

  useEffect(() => {
    if (!enabled || rooms.length === 0) return;
    const staffToken = staff ? getStaffToken() : null;
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      auth: {
        ...(sessionToken ? { sessionToken } : {}),
        ...(staffToken ? { staffToken } : {}),
      },
    });

    const join = () => {
      for (const r of roomsKey.split("|")) socket.emit("join", r);
    };
    socket.on("connect", () => {
      setConectado(true);
      join(); // también tras cada reconexión
    });
    socket.on("disconnect", () => setConectado(false));
    socket.onAny((evento: string, payload: unknown) => onEventRef.current(evento, payload));

    return () => {
      socket.disconnect();
      setConectado(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomsKey, sessionToken, staff]);

  return { conectado };
}
