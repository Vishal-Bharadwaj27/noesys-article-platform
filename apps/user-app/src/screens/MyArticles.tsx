import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Plus, LogOut, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import { useMyArticles, type ArticleListItem } from "../hooks/useMyArticles";
import { useAuth } from "../contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type ArticleStatus = "approved" | "rewrite_required" | "pending";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rewrite_required: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Scored",
  rewrite_required: "Rewrite",
  pending: "Pending",
};

function scoreColor(score: number) {
  if (score >= 8) return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
  if (score >= 6) return { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  return { bar: "bg-red-500", badge: "bg-red-50 text-red-600" };
}

export default function MyArticles() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const currentMonth = dayjs().format("YYYY-MM");
  const [month, setMonth] = useState(currentMonth);
  const [viewAll, setViewAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { articles, loading, error, pagination } = useMyArticles({
    month: viewAll ? undefined : month,
    viewAll,
    page: viewAll ? currentPage : undefined,
    limit: 10,
  });

  function handleLogout() {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  }

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <LayoutGrid size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-900">Article App</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-500 hidden sm:block">
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Articles</h1>
            {user && (
              <p className="text-sm text-slate-500 mt-0.5">{user.name} · {user.email}</p>
            )}
          </div>
          <button
            onClick={() => navigate("/articles/new")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            <Plus size={16} />
            New Article
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-[160px]"
                disabled={viewAll}
              >
                {dayjs(month).format("MMMM YYYY")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const m = dayjs().month(i).format("YYYY-MM");
                  return (
                    <Button
                      key={i}
                      variant="ghost"
                      onClick={() => { setMonth(m); }}
                      className="text-xs"
                    >
                      {dayjs().month(i).format("MMM")}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={() => { setViewAll((p) => !p); setCurrentPage(1); }}
            className="text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors"
          >
            {viewAll ? "Current Month" : "View All"}
          </button>
          <span className="text-sm text-slate-400 ml-auto">
            {viewAll
              ? `All articles${pagination.total > 0 ? ` (${pagination.total} total)` : ""}`
              : `Showing ${month}`}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_0.6fr_1fr_0.9fr_1fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            {["TITLE", "TYPE", "VERSION", "AI SCORE", "STATUS", "CREATED"].map((col) => (
              <span key={col} className="text-[11px] font-medium text-slate-400 tracking-wide">
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              {viewAll ? "No articles found." : `No articles for ${month}.`}
            </div>
          ) : (
            articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                onClick={() => navigate(`/articles/${article.id}`)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {viewAll && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleRow({ article, onClick }: { article: ArticleListItem; onClick: () => void }) {
  const { title, type, version, ai_score, status, created } = article;
  const hasScore = ai_score !== null;
  const colors = hasScore ? scoreColor(ai_score!) : null;

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_0.6fr_1fr_0.9fr_1fr] items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <span className="text-indigo-700 font-medium text-sm truncate">{title}</span>
      <span className="text-slate-500 text-sm truncate">{type}</span>
      <span className="text-slate-500 text-sm">v{version}</span>

      {/* AI Score */}
      <div className="flex items-center gap-2">
        {hasScore ? (
          <>
            <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors!.bar}`}
                style={{ width: `${(Math.min(ai_score!, 10) / 10) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${colors!.badge}`}>
              {ai_score}
            </span>
          </>
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </div>

      {/* Status */}
      <span
        className={`inline-flex w-fit items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}
      >
        {status === "pending" && <Clock size={11} />}
        {STATUS_LABELS[status] ?? status}
      </span>

      <span className="text-slate-400 text-sm">
        {dayjs(created).format("MMM D, YYYY")}
      </span>
    </div>
  );
}