import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import UsersLayout from "./pages/users/UsersLayout";
import UsersPage from "./pages/users/UsersPage";
import ArticleTypesOutlet from "./pages/articleTypes/ArticleTypesOutlet";
import ArticleTypesPage from "./pages/articleTypes/ArticleTypesPage";
import { ArticlesLayout } from "./pages/articles/ArticlesLayout";
import AllArticles from "./pages/articles/AllArticles";
import LoginPage from "./pages/Login/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ArticleDetailsPage from "./components/articles/ArticleDetailsPage";
import UserArticlesPage from "./components/users/UserArticlesPage";
const API_URL = import.meta.env.VITE_BACKEND_URL;

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/articles" element={<ArticlesLayout />}>
            <Route index element={<AllArticles />} />
            <Route path="/articles/:id" element={<ArticleDetailsPage />} />
          </Route>

          <Route path="/article-types" element={<ArticleTypesOutlet />}>
            <Route index element={<ArticleTypesPage />} />
          </Route>

          <Route path="/users" element={<UsersLayout />}>
            <Route index element={<UsersPage />} />
            <Route path="/users/:id/articles" element={<UserArticlesPage />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !loading && user ? (
            <Navigate to="/articles" replace />
          ) : (
            <LoginPage
              onRequestOtp={async (email) => {
                const res = await fetch(`${API_URL}/api/auth/otp/request`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                  credentials: "include",
                });
                return res.json();
              }}
              onVerifyOtp={async (email, code) => {
                const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, code }),
                  credentials: "include",
                });
                const data = await res.json();
                // if (data.success) window.location.href = "/articles";
                if (data.success) {
                  await refetch(); // calls /api/auth/me
                  navigate("/articles");
                }

                return data;
              }}
            />
          )
        }
      />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
