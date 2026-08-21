import React, { useEffect, useMemo, useState } from "react";
import UserCard, { User } from "../../components/users/UserCard";
import { getCurrentMonth } from "../../utils/date";
import { Calendar, Search } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function fetchUsers(
  month?: string,
  submissionStatus?: "not_submitted",
): Promise<User[]> {
  const params = new URLSearchParams();
  if (month && submissionStatus) {
    params.set("month", month);
    params.set("submission_status", submissionStatus);
  }

  const res = await fetch(`${BACKEND_URL}/api/users?${params}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`);
  }

  const data = await res.json();
  return data.data;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());

  const handleToggleNotSubmitted = () => {
    setShowNotSubmitted((p) => !p);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchUsers(
      showNotSubmitted ? month : undefined,
      showNotSubmitted ? "not_submitted" : undefined,
    )
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [showNotSubmitted, month]);

  const handleToggleActive = async (userId: string, nextIsActive: boolean) => {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ is_active: nextIsActive }),
    });

    if (!res.ok) throw new Error("Failed to update user status");

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_active: nextIsActive ? 1 : 0 } : u,
      ),
    );
  };

  const handleRoleChange = async (
    userId: string,
    nextRole: "user" | "admin" | "super_admin",
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: nextRole }),
    });

    if (!res.ok) throw new Error("Failed to update user role");

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, auth_role: nextRole } : u)),
    );
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [users, search]);

  return (
    <div className="m-5">
      <h1 className="text-4xl bold my-4 font-semibold">Users List</h1>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between my-6">
        {/* Search + toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            onClick={handleToggleNotSubmitted}
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
      ${
        showNotSubmitted
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
          >
            Show not submitted
          </button>
        </div>

        {/* Month filter, only when active */}
        {showNotSubmitted && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="sales-month"
              className="whitespace-nowrap text-sm font-medium text-slate-700"
            >
              Filter by month
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="sales-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-md border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-slate-400">Loading users...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* <div className="flex items-center justify-center">
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-2">
          {filteredUsers.map((m) => (
            <UserCard key={m.id} user={m} />
          ))}
        </div>
      </div> */}

      {!loading && !error && (
        <div className="flex items-center justify-center">
          <div className="grid lg:grid-cols-3 grid-cols-1 gap-2">
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onToggleActive={handleToggleActive}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
