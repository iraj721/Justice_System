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
    // Make sure token is added correctly
    headers["Authorization"] = `Bearer ${options.token}`;
    console.log("🔑 Token being sent:", options.token.substring(0, 20) + "...");
  } else {
    console.warn("⚠️ No token provided for request to:", path);
  }
  
  const url = `${API_BASE_URL}${path}`;
  console.log("📡 Requesting:", url);
  
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(payload.detail ?? `API error (${res.status})`);
  }
  
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text) as T;
}