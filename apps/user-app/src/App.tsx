import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import MyArticles from "./screens/MyArticles";
import ArticleCreation from "./screens/ArticleCreation";
import ArticleDetail from "./screens/ArticleDetail";
import type { ReactNode } from "react";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import AllArticles from "./admin/pages/articles/AllArticles";
import UsersPage from "./admin/pages/users/UsersPage";
import ArticleTypesPage from "./admin/pages/articleTypes/ArticleTypesPage";

import Sidebar from "./admin/components/Sidebar";
import ArticleDetailsPage from "./admin/components/articles/ArticleDetailsPage";

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
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

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <MyArticles />
          </Protected>
        }
      />
      <Route
        path="/articles/new"
        element={
          <Protected>
            <ArticleCreation />
          </Protected>
        }
      />
      <Route
        path="/articles/:id"
        element={
          <Protected>
            <ArticleDetail />
          </Protected>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/articles"
        element={
          <RoleBasedRoute allowedRoles={["admin", "super_admin"]}>
            <AdminLayout>
              <AllArticles />
            </AdminLayout>
          </RoleBasedRoute>
        }
      />

      <Route
        path="/admin/:id/articles"
        element={
          <RoleBasedRoute allowedRoles={["admin", "super_admin"]}>
            <AdminLayout>
              <AllArticles />
            </AdminLayout>
          </RoleBasedRoute>
        }
      />

      <Route
        path="/admin/articles/:id"
        element={
          <RoleBasedRoute allowedRoles={["admin", "super_admin"]}>
            <AdminLayout>
              <ArticleDetailsPage />
            </AdminLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleBasedRoute allowedRoles={["super_admin"]}>
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/article-types"
        element={
          <RoleBasedRoute allowedRoles={["admin", "super_admin"]}>
            <AdminLayout>
              <ArticleTypesPage />
            </AdminLayout>
          </RoleBasedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
