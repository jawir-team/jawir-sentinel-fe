import { ApiError } from "@/types/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions<TBody = unknown> {
  method?: HttpMethod;
  path: string;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipAuth?: boolean;
  rawResponse?: boolean;
}

let getAuthToken: (() => Promise<string | null>) | null = null;
let onUnauthorized: (() => Promise<boolean>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  getAuthToken = provider;
}

export function setUnauthorizedHandler(handler: () => Promise<boolean>) {
  onUnauthorized = handler;
}

export function getBaseApiUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
  return base.replace(/\/+$/, "");
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullPath = path.startsWith("http")
    ? path
    : `${getBaseApiUrl()}${normalizedPath}`;

  const url = new URL(fullPath, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

async function executeRequest(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError("NETWORK_ERROR", message, 0);
  }
}

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

export async function apiClient<TResponse = unknown, TBody = unknown>(
  options: ApiClientOptions<TBody>
): Promise<TResponse> {
  const {
    method = "GET",
    path,
    body,
    params,
    headers: customHeaders = {},
    signal,
    skipAuth = false,
    rawResponse = false,
  } = options;

  const url = buildUrl(path, params);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...customHeaders,
  };

  // Auth token injection
  if (!skipAuth && !headers["Authorization"] && getAuthToken) {
    try {
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Failed to retrieve auth token:", err);
    }
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const requestInit: RequestInit = {
    method,
    headers,
    signal,
    body: isFormData
      ? (body as unknown as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  };

  let response = await executeRequest(url, requestInit);

  // 401 Unauthorized handling & retry
  if (response.status === 401 && !skipAuth && onUnauthorized) {
    const refreshed = await onUnauthorized();
    if (refreshed && getAuthToken) {
      const newToken = await getAuthToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await executeRequest(url, { ...requestInit, headers });
      }
    }
  }

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (payload && payload.error) {
      throw new ApiError(
        payload.error.code || `HTTP_${response.status}`,
        payload.error.message || "An error occurred",
        response.status,
        payload.error.details || {}
      );
    }

    const defaultMessages: Record<number, string> = {
      400: "Invalid request payload",
      401: "Unauthorized access",
      403: "Access forbidden",
      404: "Resource not found",
      409: "Conflict occurred",
      500: "Internal server error",
    };

    throw new ApiError(
      `HTTP_${response.status}`,
      defaultMessages[response.status] || response.statusText || "Request failed",
      response.status
    );
  }

  if (rawResponse) {
    return payload as TResponse;
  }

  // Handle standard envelopes
  if (payload && typeof payload === "object") {
    // If pagination is present alongside data, return the object with { data, pagination }
    if ("pagination" in payload && "data" in payload) {
      return payload as TResponse;
    }
    // If data property exists without pagination, unwrap data
    if ("data" in payload) {
      return payload.data as TResponse;
    }
  }

  return payload as TResponse;
}

export function apiGet<TResponse>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  options?: Omit<ApiClientOptions<never>, "method" | "path" | "params">
): Promise<TResponse> {
  return apiClient<TResponse>({
    ...options,
    method: "GET",
    path,
    params,
  });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiClientOptions<TBody>, "method" | "path" | "body">
): Promise<TResponse> {
  return apiClient<TResponse, TBody>({
    ...options,
    method: "POST",
    path,
    body,
  });
}

export function apiPut<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiClientOptions<TBody>, "method" | "path" | "body">
): Promise<TResponse> {
  return apiClient<TResponse, TBody>({
    ...options,
    method: "PUT",
    path,
    body,
  });
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiClientOptions<TBody>, "method" | "path" | "body">
): Promise<TResponse> {
  return apiClient<TResponse, TBody>({
    ...options,
    method: "PATCH",
    path,
    body,
  });
}

export function apiDelete<TResponse>(
  path: string,
  options?: Omit<ApiClientOptions<never>, "method" | "path">
): Promise<TResponse> {
  return apiClient<TResponse>({
    ...options,
    method: "DELETE",
    path,
  });
}
