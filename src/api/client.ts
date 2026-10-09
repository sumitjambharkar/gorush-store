import * as SecureStore from "expo-secure-store";

// Android emulators can't reach "localhost" (that's the emulator itself) —
// use 10.0.2.2, or your machine's LAN IP on a physical device. Override via
// EXPO_PUBLIC_API_URL in a .env file for your setup.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const TOKEN_KEY = "merchant_auth_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Full error body from the server (e.g. retryAfterSeconds). */
  data?: Record<string, any>;
  constructor(message: string, status: number, code?: string, data?: Record<string, any>) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError("Network error — check your connection and API URL", 0);
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    throw new ApiError(json.message || "Something went wrong", response.status, json.code, json);
  }

  return json as T;
}
