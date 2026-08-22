import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import MyArticles from "./screens/MyArticles";
import ArticleCreation from "./screens/ArticleCreation";
import ArticleDetail from "./screens/ArticleDetail";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><MyArticles /></Protected>} />
      <Route path="/articles/new" element={<Protected><ArticleCreation /></Protected>} />
      <Route path="/articles/:id" element={<Protected><ArticleDetail /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}