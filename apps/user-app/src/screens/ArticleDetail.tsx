import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, X, Check, Clock, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { useArticle, type HistoryItem } from "../hooks/useArticle";
import { api } from "../http-client";

function scoreColor(score: number) {
  if (score >= 8) return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
  if (score >= 6) return { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  return { bar: "bg-red-500", badge: "bg-red-50 text-red-600" };
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rewrite_required: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { article, history, currentScore, currentFeedback, loading, error, refetch } =
    useArticle(id ?? "");

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (article) { setTitle(article.title); setContent(article.content); }
  }, [article]);

  async function handleSubmitRewrite() {
    if (!article) return;
    if (!title.trim() || !content.trim()) { setSubmitError("Title and content are required"); return; }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api(`/articles`, {
        method: "POST",
        body: JSON.stringify({
          id: article.id,
          article_type_id: article.article_type_id,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      setEditing(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit rewrite");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-sm text-indigo-600 hover:underline">
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  const hasScore = currentScore !== null;
  const colors = hasScore ? scoreColor(currentScore!) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft size={14} />
          Back to Articles
        </button>

        {/* Title + action */}
        <div className="flex items-start justify-between gap-4 mb-6">
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="flex-1 text-lg font-medium rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-slate-900 leading-snug">{article?.title}</h1>
          )}

          {editing ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setEditing(false); if (article) { setTitle(article.title); setContent(article.content); } setSubmitError(null); }}
                className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSubmitRewrite}
                disabled={submitting}
                className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-3 py-2 transition-colors"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Submit Rewrite
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 transition-colors shrink-0"
            >
              <Edit3 size={14} />
              Rewrite Article
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Article card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Article</h2>
              {article && (
                <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                  {article.article_type_name}
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              {editing ? (
                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Article content"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              ) : (
                <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                  {article?.content}
                </p>
              )}

              {submitError && (
                <p className="mt-3 text-sm text-red-600">{submitError}</p>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Current Score</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-slate-900">
                      {hasScore ? currentScore!.toFixed(1) : "—"}
                      <span className="text-base text-slate-400 font-normal"> / 10</span>
                    </p>
                    {hasScore && (
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors!.bar}`}
                          style={{ width: `${(Math.min(currentScore!, 10) / 10) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Feedback</p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {currentFeedback || "No feedback available yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Scoring History</h2>
            </div>
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-4 gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              {["VERSION", "SCORE", "STATUS", "SUBMITTED"].map((col) => (
                <span key={col} className="text-[11px] font-medium text-slate-400 tracking-wide">
                  {col}
                </span>
              ))}
            </div>
            {history.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No scoring history yet.</div>
            ) : (
              history.map((item) => <HistoryRow key={item.version} item={item} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const hasScore = item.score !== null;
  const colors = hasScore ? scoreColor(item.score!) : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-3.5 border-b border-slate-100 last:border-b-0 items-center">
      <span className="font-medium text-slate-700 text-sm">v{item.version}</span>
      <div className="flex items-center gap-2">
        {hasScore ? (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${colors!.badge}`}>
            {item.score!.toFixed(1)}
          </span>
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </div>
      <span
        className={`inline-flex w-fit items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-600"}`}
      >
        {item.status === "pending" && <Clock size={11} />}
        {item.status}
      </span>
      <span className="text-slate-400 text-sm">
        {dayjs(item.submitted_at).format("MMM D, YYYY h:mm A")}
      </span>
    </div>
  );
}