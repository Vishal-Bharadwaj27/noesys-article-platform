import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ReactNode } from "react";

export function RoleBasedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: ReactNode, 
  allowedRoles: ("super_admin" | "admin" | "user")[] 
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.auth_role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
