import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../Logo/Noesys_logo.avif";

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-slate-900">Noesys Article Platform</span>
        </div>
        <div className="flex items-center gap-3">
            {user && <span className="text-sm text-slate-500 hidden sm:block">{user.name}</span>}
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