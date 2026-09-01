import { Clock } from "lucide-react";

export type ArticleStatus =
  | "approved"
  | "rewrite_required"
  | "pending"
  | "failed";


export type ArticleParameterResult = {
  parameterId: string;
  parameterName: string;
  scopeType: "numeric" | "option";
  value: string;
};

export type ArticleSummary = {
  id: string;
  title: string;
  type: string;
  version: number;
  ai_score: number | null;
  status: ArticleStatus;
  created_at: string;
  author_name: string;
  submitted_at: string;
  month_year: string;
  parameters: ArticleParameterResult[];
};

type ArticleRowProps = {
  article: ArticleSummary;
  onClick?: (id: string) => void;
};

const STATUS_STYLES: Record<ArticleStatus, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rewrite_required: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red",
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  approved: "Approved",
  rewrite_required: "Rewrite Required",
  pending: "Pending",
  failed: "failed"
};

function scoreColor(score: number) {
  if (score >= 8) {
    return {
      bar: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 6) {
    return {
      bar: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700",
    };
  }

  return {
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ArticleRow({ article, onClick }: ArticleRowProps) {
  const {
    title,
    type,
    version,
    ai_score,
    status,
    created_at,
    author_name,
    parameters,
  } = article;

  const hasScore = ai_score !== null;
  const colors = hasScore ? scoreColor(ai_score) : null;

  return (
    <div
      onClick={() => onClick?.(article.id)}
      className={`grid grid-cols-[2fr_1fr_0.7fr_1.2fr_1.8fr_1fr_1fr] items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-b-0 ${
        onClick ? "cursor-pointer hover:bg-slate-50" : ""
      } transition-colors`}
    >
      <span className="text-indigo-700 font-medium text-sm truncate">
        {title}
      </span>

      <span className="text-slate-500 text-sm truncate">{type}</span>

      <span className="text-slate-500 text-sm">v{version}</span>

      <span className="text-slate-600 text-sm truncate">{author_name}</span>

      <div className="flex flex-wrap gap-1.5">
        {parameters?.length ? (
          parameters.map((parameter) => (
            <span
              key={parameter.parameterId}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              {parameter.parameterName}: {parameter.value}
            </span>
          ))
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasScore ? (
          <>
            <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors!.bar}`}
                style={{
                  width: `${Math.min(Math.max(ai_score, 0), 10) * 10}%`,
                }}
              />
            </div>

            <span
              className={`text-xs font-semibold rounded-full px-2 py-0.5 ${colors!.badge}`}
            >
              {ai_score}
            </span>
          </>
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex w-fit items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[status]}`}
        >
          {status === "pending" && <Clock size={11} />}
          {STATUS_LABELS[status]}
        </span>

        <span className="text-slate-400 text-sm">{formatDate(created_at)}</span>
      </div>
    </div>
  );
}
