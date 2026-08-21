import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  job_role: string;
  auth_role: "super_admin" | "admin" | "user";
  is_active: boolean;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
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

  async function logout() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
    } catch (err) {
      console.error(err);
      alert("Failed to logout");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
