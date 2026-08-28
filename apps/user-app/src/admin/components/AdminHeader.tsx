import {
  ChartNoAxesCombined,
  FileText,
  LogOut,
  Pen,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import logoImage from "../../Logo/Noesys_logo.avif";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  {
    key: "Write an article",
    label: "Write An Article",
    icon: Pen,
    to: "/admin/my-article",
  },
  {
    key: "articles",
    label: "Articles",
    icon: FileText,
    to: "/admin/articles",
  },
  {
    key: "article-types",
    label: "Article Types",
    icon: Tags,
    to: "/admin/article-types",
  },
  {
    key: "users",
    label: "Users",
    icon: Users,
    to: "/admin/users",
  },
  {
    key: "insights",
    label: "Insights",
    icon: ChartNoAxesCombined,
    to: "/admin/insights",
  },
];

export default function AdminHeader({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-50">
      <div className="w-full px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Logo" className="h-12 w-20 rounded-lg" />
          <span className="font-semibold text-slate-900">
            Article Platform
          </span>
        </div>
        {title && (
          <span className="text-sm font-medium text-slate-700 hidden md:block">
            {title}
          </span>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
            }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-500 hidden sm:block">
              {user.email}
            </span>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
