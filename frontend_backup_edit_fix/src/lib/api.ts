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
  if (!token) {
    localStorage.removeItem("access_token");
  } else {
    localStorage.setItem("access_token", token);
  }
}

// ✅ FINAL apiFetch (MATCHES REQUIRED FORMAT + SAFE + TOKEN SUPPORT)
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // ❌ HANDLE ERROR (exactly like your required pattern)
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  // ✅ SAFE RESPONSE HANDLING (prevents crash on empty response)
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  return null as T;
}

// 🔐 LOGIN
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

  let data: any = null;

  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    }
  } catch {
    // ignore parsing error
  }

  if (!res.ok) {
    throw new Error(data?.detail ?? `Login failed (${res.status})`);
  }

  if (!data?.access_token) {
    throw new Error("Invalid login response from server");
  }

  setToken(data.access_token);
  return data.access_token;
}

// 📝 REGISTER
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
      body: JSON.stringify(payload),
    }
  );
}