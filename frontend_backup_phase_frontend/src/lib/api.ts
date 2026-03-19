const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:8000";

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

// ✅ CUSTOM INIT TYPE (FIXES YOUR ERROR)
type ApiFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any; // 👈 allows object (no more BodyInit error)
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ✅ AUTO HANDLE JSON BODY
  let body: BodyInit | undefined = undefined;

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data as T;
}

// 🔐 LOGIN (unchanged - correct)
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

// 📝 REGISTER (UPDATED - no manual stringify needed)
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
      body: payload, // ✅ cleaner
    },
  );
}