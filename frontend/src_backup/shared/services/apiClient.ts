// frontend/src/shared/services/apiClient.ts
import { API_BASE_URL } from "../env";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(payload.detail ?? `API error (${res.status})`);
  }
  
  // If response is empty, return empty object
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text) as T;
}