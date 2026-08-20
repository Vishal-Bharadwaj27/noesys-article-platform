import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export type ArticleStatus = "approved" | "rewrite_required";

export type ScoringAttempt = {
  article_id: string; // history row / attempt id
  version: number;
  score: number | null;
  status: ArticleStatus | "pending";
  date: string;
  feedback: string | null;
};

export type ArticleDetails = {
  id: string;
  title: string;
  type: string; // article_type name
  status: ArticleStatus;
  version: number;
  content: string;
  ai_score: number | null; // current score, 0-100 for display
  ai_feedback: string | null;
  author_name: string;
  author_email: string;
  job_role: string;
  created_at: string;
  word_count: number;
  history: ScoringAttempt[]; // ordered oldest -> newest
};

const STATUS_STYLES: Record<ArticleStatus, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rewrite_required: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  approved: "Scored",
  rewrite_required: "Rewrite Required",
};

function scoreBadgeColor(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function scoreQualityLabel(score: number) {
  if (score >= 90) return "Excellent quality. Minor improvements only.";
  if (score >= 80) return "Strong quality overall.";
  if (score >= 60) return "Decent, but has room to improve.";
  return "Needs significant rework.";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

// Simple sparkline trend using an SVG polyline over the scored attempts
function TrendSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;

  const w = 90;
  const h = 26;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * w;
      const y = h - ((s - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const x = (i / (scores.length - 1)) * w;
        const y = h - ((s - min) / range) * h;
        return <circle key={i} cx={x} cy={y} r="2" fill="#6366f1" />;
      })}
    </svg>
  );
}

type ArticleDetailsPageProps = {
  article: ArticleDetails;
};

export default function ArticleDetailsPage({
  article,
}: ArticleDetailsPageProps) {
  const navigate = useNavigate();
  const params = useParams();

  const scoredAttempts = useMemo(
    () =>
      article.history.filter(
        (h): h is ScoringAttempt & { score: number } => h.score !== null,
      ),
    [article.history],
  );

  return (
    <div className="px-6 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{article.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <span>{article.type}</span>
            <span className="text-slate-300">·</span>
            <span
              className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${STATUS_STYLES[article.status]}`}
            >
              {STATUS_LABELS[article.status]}
            </span>
            <span className="text-slate-300">·</span>
            <span>v{article.version}</span>
            <span className="text-slate-300">·</span>
            <span>by {article.author_name}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-500 tracking-wide mb-3">
              ARTICLE CONTENT
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>

          {/* Scoring history */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Scoring History</h2>
              {scoredAttempts.length >= 2 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Trend</span>
                  <TrendSparkline scores={scoredAttempts.map((a) => a.score)} />
                </div>
              )}
            </div>

            <div className="hidden md:grid grid-cols-[0.6fr_0.7fr_0.9fr_0.9fr_2fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              {["ATTEMPT", "SCORE", "STATUS", "DATE", "FEEDBACK"].map((col) => (
                <span
                  key={col}
                  className="text-[11px] font-medium text-slate-400 tracking-wide"
                >
                  {col}
                </span>
              ))}
            </div>

            {article.history.map((attempt, i) => {
              const isLatest = i === article.history.length - 1;
              return (
                <div
                  key={attempt.article_id}
                  className={`grid grid-cols-[0.6fr_0.7fr_0.9fr_0.9fr_2fr] items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-b-0
                    ${isLatest ? "bg-indigo-50/40" : ""}`}
                >
                  <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    #{i + 1}
                    {isLatest && (
                      <span className="text-[10px] font-semibold text-indigo-600">
                        LATEST
                      </span>
                    )}
                  </span>

                  {attempt.score !== null ? (
                    <span
                      className={`w-fit text-xs font-semibold rounded-full px-2 py-0.5 ${scoreBadgeColor(attempt.score)}`}
                    >
                      {attempt.score}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-sm">—</span>
                  )}

                  <span
                    className={`w-fit text-xs font-medium rounded-full px-2.5 py-0.5 ${
                      attempt.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : STATUS_STYLES[attempt.status as ArticleStatus]
                    }`}
                  >
                    {attempt.status === "pending"
                      ? "Pending"
                      : STATUS_LABELS[attempt.status as ArticleStatus]}
                  </span>

                  <span className="text-sm text-slate-500">
                    {formatDate(attempt.date)}
                  </span>

                  <span className="text-sm text-slate-600 truncate">
                    {attempt.feedback ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* AI Score */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center">
            <h2 className="text-xs font-semibold text-slate-400 tracking-wide mb-4">
              AI SCORE
            </h2>
            {article.ai_score !== null ? (
              <>
                <ScoreRing score={article.ai_score} />
                <p className="text-sm text-slate-500 mt-4">
                  {scoreQualityLabel(article.ai_score)}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-6">Not yet scored.</p>
            )}
          </div>

          {/* Feedback */}
          {article.ai_feedback && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 border-l-4 border-l-indigo-500">
              <h2 className="text-xs font-semibold text-indigo-600 tracking-wide mb-2">
                AI FEEDBACK
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {article.ai_feedback}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 tracking-wide mb-3">
              METADATA
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Article ID</dt>
                <dd className="font-mono text-slate-700">{article.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-slate-700">{article.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Author</dt>
                <dd className="text-slate-700">{article.author_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Job Role</dt>
                <dd className="text-slate-700">{article.job_role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-700">
                  {formatDate(article.created_at)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Attempts</dt>
                <dd className="text-slate-700">{article.history.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Word count</dt>
                <dd className="text-slate-700">{article.word_count}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
