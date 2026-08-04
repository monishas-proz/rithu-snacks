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
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

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
