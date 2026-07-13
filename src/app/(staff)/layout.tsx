import type { Metadata } from "next";
import { StaffShell } from "@/components/staff-shell";

// Paneles internos: fuera de los buscadores (robots.ts además los bloquea).
export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
