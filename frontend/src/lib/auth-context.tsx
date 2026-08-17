"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";

export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (allowed: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const storedToken = localStorage.getItem("bcos_access_token");
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const userData = await apiRequest<User>("/api/auth/me");
      setUser(userData);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("bcos_access_token");
      localStorage.removeItem("bcos_refresh_token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{
      access_token: string;
      refresh_token: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("bcos_access_token", data.access_token);
    localStorage.setItem("bcos_refresh_token", data.refresh_token);
    setToken(data.access_token);
    await refreshProfile();
  };

  const register = async (email: string, password: string, full_name?: string) => {
    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
    // Auto login after registration
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("bcos_access_token");
    localStorage.removeItem("bcos_refresh_token");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  const hasRole = (allowed: UserRole[]) => {
    if (!user) return false;
    if (user.is_superuser || user.role === "admin") return true;
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
