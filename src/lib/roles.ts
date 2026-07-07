export type RolCodigo = "MOZO" | "BARISTA" | "CAJERO" | "ADMIN";

/** Pantalla principal de cada rol. */
export const ROLE_HOME: Record<RolCodigo, string> = {
  MOZO: "/mozo",
  BARISTA: "/kds",
  CAJERO: "/caja",
  ADMIN: "/admin",
};

/**
 * A dónde llevar a un usuario según sus roles: directo a su pantalla si tiene
 * un solo rol; al hub si tiene varios (o a login si no tiene ninguno).
 */
export function homeForRoles(roles: RolCodigo[]): string {
  if (roles.length === 1) return ROLE_HOME[roles[0]];
  return "/staff";
}
