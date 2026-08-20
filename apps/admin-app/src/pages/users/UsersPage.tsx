import React, { useMemo, useState } from "react";
import UserCard, { User } from "../../components/users/UserCard";
import { getCurrentMonth } from "../../utils/date";
import { Calendar, Search } from "lucide-react";

const mockUsers: User[] = [
  {
    id: "usr_001",
    email: "vishal@company.com",
    name: "Vishal Bharadwaj",
    auth_role: "super_admin",
    job_role: "Founder & System Administrator",
    created_at: "2025-01-15T10:30:00Z",
    is_active: 1,
  },
  {
    id: "usr_002",
    email: "sarah.johnson@company.com",
    name: "Sarah Johnson",
    auth_role: "admin",
    job_role: "Content Manager",
    created_at: "2025-03-12T08:45:00Z",
    is_active: 1,
  },
  {
    id: "usr_003",
    email: "rahul.sharma@company.com",
    name: "Rahul Sharma",
    auth_role: "admin",
    job_role: "Technical Lead",
    created_at: "2025-04-22T14:20:00Z",
    is_active: 1,
  },
  {
    id: "usr_004",
    email: "emma.wilson@example.com",
    name: "Emma Wilson",
    auth_role: "user",
    job_role: "Software Engineer",
    created_at: "2025-05-08T09:10:00Z",
    is_active: 1,
  },
  {
    id: "usr_005",
    email: "alex.morgan@example.com",
    name: "Alex Morgan",
    auth_role: "user",
    job_role: "UI/UX Designer",
    created_at: "2025-06-17T11:55:00Z",
    is_active: 0,
  },
  {
    id: "usr_006",
    email: "priya.patel@example.com",
    name: "Priya Patel",
    auth_role: "user",
    job_role: "QA Engineer",
    created_at: "2025-07-02T16:40:00Z",
    is_active: 1,
  },
  {
    id: "usr_007",
    email: "michael.lee@example.com",
    name: "Michael Lee",
    auth_role: "user",
    job_role: "Product Manager",
    created_at: "2025-07-19T13:25:00Z",
    is_active: 0,
  },
  {
    id: "usr_008",
    email: "ananya.reddy@example.com",
    name: "Ananya Reddy",
    auth_role: "user",
    job_role: "Business Analyst",
    created_at: "2025-08-01T07:15:00Z",
    is_active: 1,
  },
];

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());

  const handleToggleNotSubmitted = () => {
    setShowNotSubmitted((p) => !p);
  };

  const filteredUsers = useMemo(() => {
    const newUsers = mockUsers.filter((users) => {
      return users.name.toLowerCase().includes(search.trim());
    });

    return newUsers;
  }, [search, showNotSubmitted]);

  return (
    <div className="m-5">
      <h1 className="text-4xl bold my-4">Users List</h1>
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

      <div className="flex items-center justify-center">
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-2">
          {filteredUsers.map((m) => (
            <UserCard key={m.id} user={m} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
