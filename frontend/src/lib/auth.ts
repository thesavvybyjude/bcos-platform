/**
 * BCOS Platform — Auth Utility Functions
 */

import { apiRequest } from "./api";
import { User } from "./auth-context";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bcos_access_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiRequest<{ access_token: string; refresh_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("bcos_access_token", data.access_token);
  localStorage.setItem("bcos_refresh_token", data.refresh_token);
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("bcos_access_token");
    localStorage.removeItem("bcos_refresh_token");
    window.location.href = "/login";
  }
}

export async function refreshToken(): Promise<string | null> {
  const rToken = localStorage.getItem("bcos_refresh_token");
  if (!rToken) return null;
  const data = await apiRequest<{ access_token: string }>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: rToken }),
  });
  localStorage.setItem("bcos_access_token", data.access_token);
  return data.access_token;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiRequest<User>("/api/auth/me");
  } catch (_) {
    return null;
  }
}
