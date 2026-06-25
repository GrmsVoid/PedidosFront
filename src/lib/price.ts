/** Convierte "12.34" a céntimos (1234) para hacer aritmética de dinero sin floats. */
export function centsFromStr(s: string): number {
  const neg = s.trim().startsWith("-");
  const clean = s.trim().replace("-", "");
  const [entero, dec = "0"] = clean.split(".");
  const cents = parseInt(entero || "0", 10) * 100 + parseInt((dec + "00").slice(0, 2), 10);
  return neg ? -cents : cents;
}

export function formatCents(c: number): string {
  return `S/ ${(c / 100).toFixed(2)}`;
}

export function formatStr(s: string): string {
  return formatCents(centsFromStr(s));
}
