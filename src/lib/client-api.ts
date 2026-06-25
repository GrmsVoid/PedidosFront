export type ApiErrorBody = { code: string; message: string; details?: unknown };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const STAFF_TOKEN_KEY = "cafe-staff-token";

export function getStaffToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(STAFF_TOKEN_KEY) : null;
}
export function setStaffToken(token: string): void {
  localStorage.setItem(STAFF_TOKEN_KEY, token);
}
export function clearStaffToken(): void {
  localStorage.removeItem(STAFF_TOKEN_KEY);
}

export class ClientApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

type RequestOpts = { token?: string | null; idempotencyKey?: string };

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOpts = {},
): Promise<T> {
  const headers = new Headers();
  // Token explícito (sesión de cliente) o, en su defecto, el JWT de staff guardado.
  const authToken = opts.token ?? getStaffToken();
  if (authToken) headers.set("authorization", `Bearer ${authToken}`);
  if (opts.idempotencyKey) headers.set("idempotency-key", opts.idempotencyKey);
  if (body !== undefined) headers.set("content-type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err: ApiErrorBody = json?.error ?? {
      code: "UNKNOWN",
      message: res.statusText || "Error",
    };
    throw new ClientApiError(err.code, err.message, res.status, err.details);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>("PATCH", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>("PUT", path, body, opts),
  del: <T>(path: string, opts?: RequestOpts) => request<T>("DELETE", path, undefined, opts),
};
