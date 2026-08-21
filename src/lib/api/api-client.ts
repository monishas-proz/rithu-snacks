import { ApiResponse } from "./api-response";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  _isRetry?: boolean;
}

// Shared promise for deduplicating concurrent token refresh operations
let refreshPromise: Promise<boolean> | null = null;

async function performSilentRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data && data.success);
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Auth endpoints that should not trigger automatic 401 retry
const AUTH_BYPASS_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/reset-password",
  "/api/auth/send-email-otp",
  "/api/auth/verify-email-otp",
];

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, _isRetry, ...fetchOptions } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      credentials: "include", // Transmits Server-Side HttpOnly Cookies automatically
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Network error. Please check your connection and try again.",
      0
    );
  }

  // If 401 Unauthorized occurs on an authenticated endpoint and we haven't retried yet:
  const isAuthEndpoint = AUTH_BYPASS_ENDPOINTS.some((ep) =>
    endpoint.startsWith(ep)
  );

  if (response.status === 401 && !isAuthEndpoint && !_isRetry) {
    const refreshed = await performSilentRefresh();
    if (refreshed) {
      // Retry the original request with the fresh token cookie
      return fetchApi<T>(endpoint, {
        ...options,
        _isRetry: true,
      });
    }
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new ApiClientError(
      "Invalid response from server.",
      response.status
    );
  }

  if (!response.ok || !data.success) {
    throw new ApiClientError(
      data.message || "Something went wrong",
      response.status,
      data.errors
    );
  }

  return data;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: "DELETE", ...options }),
};

