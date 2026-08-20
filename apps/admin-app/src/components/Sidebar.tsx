import { useState } from "react";
import {
  FileText,
  Users,
  Tags,
  Menu,
  X,
  LayoutGrid,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

type NavItem = {
  key: string;
  label: string;
  icon: typeof FileText;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "articles", label: "Articles", icon: FileText, to: "/articles" },
  {
    key: "article-types",
    label: "Article Types",
    icon: Tags,
    to: "/article-types",
  },
  { key: "users", label: "Users", icon: Users, to: "/users" },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Failed to logout");
    }
  }

  const NavList = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
    ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}

      <button onClick={handleLogout} className="flex items-center gap-2">
        <LogOut size={18} />
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutGrid size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-slate-900">ArticleAI</span>
          <span className="ml-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col
          transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <LayoutGrid size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-900">ArticleAI</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <NavList />
        <div className="px-3 py-4 border-t border-slate-200 text-xs text-slate-400">
          Admin workspace
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-white border-r border-slate-200 sticky top-0">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutGrid size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-slate-900">Article App</span>
          <span className="ml-auto text-[11px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
            Admin
          </span>
        </div>
        <NavList />
        <div className="px-3 py-4 border-t border-slate-200 text-xs text-slate-400">
          Admin workspace
        </div>
      </aside>
    </>
  );
}
