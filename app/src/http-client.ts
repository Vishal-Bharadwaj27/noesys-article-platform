const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

const TOKEN_KEY = "auth:token";
const ROLE_KEY = "auth:role";

function decodeRole(token: string): string | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))?.role ?? null;
  } catch {
    return null;
  }
}
function isExpired(token: string): boolean {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return p.exp ? p.exp * 1000 < Date.now() : false;
  } catch {
    return true;
  }
}

export const tokenManager = {
  set: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const r = decodeRole(token);
    if (r) localStorage.setItem(ROLE_KEY, r);
  },
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRole: (): string | null => localStorage.getItem(ROLE_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem("token");
  },
  isExpired: (): boolean => {
    const t = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("token");
    return !t || isExpired(t);
  },
};
// backward compat
export const tokenStorage = tokenManager;

export class ApiError extends Error {
  status: number;
  constructor(m: string, s: number) {
    super(m);
    this.name = "ApiError";
    this.status = s;
  }
}
type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
function redirectToLogin() {
  tokenManager.clear();
  if (window.location.pathname !== "/login") window.location.assign("/login");
}
async function doFetch<T>(
  path: string,
  options: RequestInit,
  full: boolean,
): Promise<any> {
  const token = tokenManager.get() ?? localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json"))
    throw new ApiError(`Unexpected response (${res.status})`, res.status);
  const body = await res.json();
  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError(body?.message || "Session expired.", 401);
  }
  if (!res.ok)
    throw new ApiError(
      body?.message || `Request failed (${res.status})`,
      res.status,
    );
  return full ? (body as ApiResponse<T>) : (body as ApiResponse<T>).data;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return doFetch<T>(path, options, false);
}
export async function apiFull<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  return doFetch<T>(path, options, true);
}
export { API_BASE };
export type { ApiResponse };
