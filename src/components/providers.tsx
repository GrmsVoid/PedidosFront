"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getStaffToken, setStaffToken, clearStaffToken } from "@/lib/client-api";
import type { RolCodigo } from "@/lib/roles";

export type StaffUser = { id: string; name: string; email: string; roles: RolCodigo[] };

type AuthState = {
  user: StaffUser | null;
  loading: boolean;
  login: (email: string, secret: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function decodeToken(token: string): { user: StaffUser; exp: number } | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(part));
    return {
      user: { id: p.sub, name: p.name ?? "", email: "", roles: p.roles ?? [] },
      exp: typeof p.exp === "number" ? p.exp : 0,
    };
  } catch {
    return null;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getStaffToken();
    if (t) {
      const decoded = decodeToken(t);
      if (decoded && decoded.exp * 1000 > Date.now()) setUser(decoded.user);
      else clearStaffToken();
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, secret: string) => {
    const res = await api.post<{ token: string; user: StaffUser }>("/api/auth/login", {
      email,
      secret,
    });
    setStaffToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearStaffToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <Providers>");
  return ctx;
}
