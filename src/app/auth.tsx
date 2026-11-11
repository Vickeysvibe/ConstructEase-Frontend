import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, login as apiLogin, logout as apiLogout, onSessionChange, refreshSession } from "@/lib/api/client";
import type { Me, Session } from "@/lib/api/types";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  status: Status;
  session: Session | null;
  me: Me | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isOrgAdmin: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export const meQueryKey = ["me"] as const;

/** Restores the session from the refresh cookie on load; keeps the access token in memory only. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const off = onSessionChange((s) => {
      setSession(s);
      setStatus(s ? "authenticated" : "anonymous");
      if (!s) qc.clear();
    });
    void refreshSession();
    return off;
  }, [qc]);

  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: () => api.get<Me>("/me"),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
  }, []);
  const logout = useCallback(async () => {
    await apiLogout();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      me: me.data,
      login,
      logout,
      isOrgAdmin: session?.user.orgRole === "owner" || session?.user.orgRole === "admin",
    }),
    [status, session, me.data, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
