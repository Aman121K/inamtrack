"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";


interface Agent {
  id: string;
  phone: string;
  name: string;
  city?: string;
  preferredLanguage: string;
}

interface AuthContextType {
  agent: Agent | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, agent: Agent) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  agent: null,
  accessToken: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshAuth: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = useCallback(
    (newAccessToken: string, refreshToken: string, agentData: Agent) => {
      setAccessToken(newAccessToken);
      setAgent(agentData);
      localStorage.setItem("inamtrack_access", newAccessToken);
      localStorage.setItem("inamtrack_refresh", refreshToken);
      localStorage.setItem("inamtrack_agent", JSON.stringify(agentData));
    },
    []
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setAgent(null);
    localStorage.removeItem("inamtrack_access");
    localStorage.removeItem("inamtrack_refresh");
    localStorage.removeItem("inamtrack_agent");
    router.push("/login");
  }, [router]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("inamtrack_refresh");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const { data } = await res.json();
      setAccessToken(data.accessToken);
      setAgent(data.agent);
      localStorage.setItem("inamtrack_access", data.accessToken);
      localStorage.setItem("inamtrack_refresh", data.refreshToken);
      localStorage.setItem("inamtrack_agent", JSON.stringify(data.agent));
      return true;
    } catch {
      return false;
    }
  }, [logout]);

  useEffect(() => {
    const savedAgent = localStorage.getItem("inamtrack_agent");
    const savedToken = localStorage.getItem("inamtrack_access");
    if (savedAgent) {
      try {
        setAgent(JSON.parse(savedAgent));
      } catch {
        // ignore
      }
    }
    if (savedToken) {
      setAccessToken(savedToken);
      setIsLoading(false);
    } else {
      refreshAuth().finally(() => setIsLoading(false));
    }
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{ agent, accessToken, isLoading, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
