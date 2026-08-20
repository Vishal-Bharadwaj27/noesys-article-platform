const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

const TOKEN_KEY = "token";

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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

function redirectToLogin(): void {
  tokenStorage.clear();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(`Unexpected response from server (${res.status})`, res.status);
  }

  const body = await res.json();

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError(body?.message || "Session expired. Please log in again.", 401);
  }

  if (!res.ok) {
    throw new ApiError(
      body?.message || `Request failed (${res.status})`,
      res.status
    );
  }

  return (body as ApiResponse<T>).data;
}

export async function apiFull<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(`Unexpected response from server (${res.status})`, res.status);
  }

  const body = await res.json();

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError(body?.message || "Session expired. Please log in again.", 401);
  }

  if (!res.ok) {
    throw new ApiError(
      body?.message || `Request failed (${res.status})`,
      res.status
    );
  }

  return body as ApiResponse<T>;
}

export { API_BASE };
export type { ApiResponse };