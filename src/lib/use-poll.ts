"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Polling simple: ejecuta `fetcher` al montar y cada `intervalMs`. */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs = 4000) {
  const ref = useRef(fetcher);
  ref.current = fetcher;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await ref.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCargado(true);
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, intervalMs);
    return () => clearInterval(id);
  }, [reload, intervalMs]);

  return { data, error, cargado, reload };
}
