import React, { useEffect, useMemo, useState } from "react";
import UserCard, { User } from "../../components/users/UserCard";
import { Search } from "lucide-react";
import { DatePicker, AutoComplete, Input } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SearchOutlined } from "@ant-design/icons";

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
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [focusedYear, setFocusedYear] = useState(dayjs().year());

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);

  const handleToggleNotSubmitted = () => {
    setShowNotSubmitted((p) => !p);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchUsers(
      showNotSubmitted && selectedMonth
        ? selectedMonth.format("YYYY-MM")
        : undefined,
      showNotSubmitted ? "not_submitted" : undefined,
    )
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [showNotSubmitted, selectedMonth]);

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
      <div className="flex flex-col gap-4  md:flex-row md:items-center md:justify-between my-6">
        {/* Search + toggle */}
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xl">
          <div className="relative flex-1 ">
            <AutoComplete
              value={search}
              onChange={setSearch}
              options={
                search.trim()
                  ? filteredUsers.map((u) => ({
                      value: u.name,
                      label: u.name,
                      key: u.id,
                    }))
                  : []
              }
              onSelect={(value) => setSearch(value)}
              style={{ width: "100%" }}
            >
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search user"
                size="small"
                className="h-10"
              />
            </AutoComplete>{" "}
          </div>

          <button
            onClick={handleToggleNotSubmitted}
            className={`h-10 flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
      ${
        showNotSubmitted
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
          >
            Show Not Submitted
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between font-normal w-[180px]"
                  >
                    {selectedMonth.format("MMMM YYYY")}
                    <Calendar className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-64 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                      onClick={() => setFocusedYear((y) => y - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="font-bold text-sm">{focusedYear}</div>

                    <Button
                      variant="ghost"
                      className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                      onClick={() => setFocusedYear((y) => y + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const month = dayjs()
                        .year(focusedYear)
                        .month(i)
                        .startOf("month");

                      const isSelected =
                        selectedMonth.format("YYYY-MM") ===
                        month.format("YYYY-MM");

                      const isCurrent =
                        dayjs().format("YYYY-MM") === month.format("YYYY-MM");

                      return (
                        <Button
                          key={i}
                          variant={isSelected ? "default" : "ghost"}
                          onClick={() => setSelectedMonth(month)}
                          className={`h-9 text-sm ${
                            isSelected
                              ? ""
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {month.format("MMM")}
                          {isCurrent && (
                            <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-primary" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
                onUserClick={(id) => navigate(`/admin/${id}/articles`)}
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
