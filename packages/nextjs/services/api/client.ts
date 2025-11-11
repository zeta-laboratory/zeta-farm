// 统一的 fetch 封装

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || "API request failed", response.status, data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : "Network error");
  }
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}
