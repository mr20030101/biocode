const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://127.0.0.1:8000";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("access_token");
  else localStorage.setItem("access_token", token);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function login(email: string, password: string): Promise<string> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok) {
    throw new Error((data as any)?.detail ?? "Login failed");
  }
  setToken(data.access_token);
  return data.access_token;
}

export async function register(payload: {
  email: string;
  full_name: string;
  role?: "admin" | "tech" | "viewer";
  password: string;
}) {
  return apiFetch<{ id: string; email: string; full_name: string }>(
    "/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

