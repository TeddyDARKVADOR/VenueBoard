import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import client from "../api/client";

type Claims = { sub: number; role: string } | null;

interface AuthContextValue {
  claims: Claims;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claims>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await client.get("/claims");
      setClaims(resp.data || null);
    } catch {
      setClaims(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (loginStr: string, password: string) => {
    await client.post("/login", {
      user_auth_login: loginStr,
      user_auth_password: password,
    });
    await refresh();
  };

  const logout = () => {
    document.cookie = "access_token=; path=/; max-age=0";
    setClaims(null);
  };

  return (
    <AuthContext.Provider value={{ claims, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
