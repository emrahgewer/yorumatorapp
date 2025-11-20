const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://yorumatorapp.onrender.com/api/v1";

export async function register(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Registration failed");
  }
  const data = await res.json();
  return { message: "Kayıt başarılı", data };
}

export async function login(payload: { email: string; password: string; otp?: string }) {
  const body = new URLSearchParams({
    username: payload.email,
    password: payload.password,
  });
  if (payload.otp) {
    body.append("scope", payload.otp);
  }
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  const data = await res.json();
  return { message: "Giriş başarılı", data };
}
