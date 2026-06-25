/** Utilidades de dinero para el frontend (céntimos enteros, sin floats). */
export function strToCents(s: string): number {
  const [a, b = "0"] = s.split(".");
  return parseInt(a || "0", 10) * 100 + parseInt((b + "00").slice(0, 2), 10);
}

export function centsToStr(c: number): string {
  return (c / 100).toFixed(2);
}

export function fmt(s: string): string {
  return `S/ ${(strToCents(s) / 100).toFixed(2)}`;
}

export function fmtCents(c: number): string {
  return `S/ ${(c / 100).toFixed(2)}`;
}
