/**
 * The only HTTP client in the app. Access token lives in memory (never localStorage);
 * the refresh token is an httpOnly cookie the browser sends to /auth/* only.
 * A 401 triggers one shared refresh, then the request is retried once.
 */
import type { ListParams, Session } from "./types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1";

export interface FieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail?: string,
    readonly errors: FieldError[] = [],
    readonly body?: Record<string, unknown>,
  ) {
    super(detail ?? title);
  }
  /** Human sentence for toasts. */
  get userMessage() {
    return this.detail ?? this.title;
  }
}

let accessToken: string | null = null;
let refreshing: Promise<Session | null> | null = null;
const sessionListeners = new Set<(s: Session | null) => void>();

export const getAccessToken = () => accessToken;
export function setSession(s: Session | null) {
  accessToken = s?.accessToken ?? null;
  sessionListeners.forEach((fn) => fn(s));
}
export const onSessionChange = (fn: (s: Session | null) => void) => {
  sessionListeners.add(fn);
  return () => void sessionListeners.delete(fn);
};

/** Single-flight refresh. Resolves null when the cookie is missing/expired. */
export function refreshSession(): Promise<Session | null> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CE-CSRF": "1" },
  })
    .then(async (res) => {
      const session = res.ok ? ((await res.json()) as Session) : null;
      setSession(session);
      return session;
    })
    .catch(() => {
      setSession(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export function toQuery(params?: ListParams | Record<string, unknown>) {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** return the raw Response (downloads) */
  raw?: boolean;
}

async function send(method: string, path: string, opts: RequestOptions, retry: boolean): Promise<Response> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body, signal: opts.signal, credentials: "include" });
  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    const session = await refreshSession();
    if (session) return send(method, path, opts, false);
  }
  return res;
}

async function toError(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error */
  }
  return new ApiError(
    res.status,
    String(body.code ?? (res.status >= 500 ? "INTERNAL" : "ERROR")),
    String(body.title ?? res.statusText ?? "Request failed"),
    typeof body.detail === "string" ? body.detail : res.status >= 500 ? "Something went wrong on our side. Try again." : undefined,
    Array.isArray(body.errors) ? (body.errors as FieldError[]) : [],
    body,
  );
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await send(method, path, opts, true);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "You're offline", "Couldn't reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && !path.startsWith("/auth/")) setSession(null);
  if (!res.ok) throw await toError(res);
  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, params?: ListParams | Record<string, unknown>, signal?: AbortSignal) =>
    request<T>("GET", `${path}${toQuery(params)}`, { signal }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "body"> = {}) => request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
  /** Fetches a file with auth and hands it to the browser as a download. */
  async download(path: string, fallbackName = "download") {
    const res = await request<Response>("GET", path, { raw: true });
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const name = /filename\*=UTF-8''([^;]+)/.exec(cd)?.[1] ?? /filename="([^"]+)"/.exec(cd)?.[1] ?? fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export async function login(email: string, password: string) {
  const s = await request<Session>("POST", "/auth/login", { body: { email, password } });
  setSession(s);
  return s;
}

export async function logout() {
  try {
    await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include", headers: { "X-CE-CSRF": "1" } });
  } finally {
    setSession(null);
  }
}

export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
