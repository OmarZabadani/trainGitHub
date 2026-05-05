import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail, tokenStore } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = anon, object = authed
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      tokenStore.clear();
      setUser(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      tokenStore.set(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (payload) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", payload);
      tokenStore.set(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    tokenStore.clear();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, error, login, register, logout, refresh: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
