import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  job_role: string;
  auth_role: "super_admin" | "admin" | "user";
  is_active: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => void;
};
const API_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    setUser(null);
    // adjust to your actual logout endpoint / Access logout URL if applicable
    window.location.href = "/api/auth/logout";
  };

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);