/**
 * BCOS Platform — Central API Client
 * 
 * Handles HTTP requests, JWT header injection, and automatic token refreshes.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Inject JWT access token if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bcos_access_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized — attempt token refresh
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("bcos_refresh_token");
    if (refreshToken && !endpoint.includes("/api/auth/")) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("bcos_access_token", data.access_token);
          headers["Authorization"] = `Bearer ${data.access_token}`;
          // Retry original request
          response = await fetch(url, { ...options, headers });
        } else {
          // Token refresh failed -> clear session
          localStorage.removeItem("bcos_access_token");
          localStorage.removeItem("bcos_refresh_token");
          window.location.href = "/login";
        }
      } catch (err) {
        localStorage.removeItem("bcos_access_token");
        localStorage.removeItem("bcos_refresh_token");
        window.location.href = "/login";
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === "string" 
          ? errJson.detail 
          : JSON.stringify(errJson.detail);
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
