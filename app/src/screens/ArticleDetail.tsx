import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import {
  ChevronLeft,
  Edit3,
  X,
  Check,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import dayjs from "dayjs";
import {
  useArticle,
  type HistoryItem,
  type ArticleDetailResponse,
} from "../hooks/useArticle";
import { api } from "../http-client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { formatFeedbackAsMarkdown } from "../utils/formatFeedback";
import { ConfigProvider, Table, Tag, Progress, theme as antdTheme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import { useAuth } from "@/contexts/AuthContext";
import AdminHeader from "@/admin/components/AdminHeader";
import ArticleViewer from "@/components/shadcnEditor/ArticleViewer";
import TiptapEditor from "@/components/editor/TiptapEditor";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

const ResizeableTitle = ({ onResize, width, children, ...restProps }: any) => {
  if (!width || typeof width !== "number")
    return <th {...restProps}>{children}</th>;
  return (
    <Resizable
      width={width}
      height={10}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
      handle={
        <span
          className="column-resize-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
    >
      <th {...restProps}>{children}</th>
    </Resizable>
  );
};

function formatScore(s: number) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

function scoreColorHex(score: number) {
  if (score >= 10) return "#389e0d";
  if (score >= 6) return "#d48806";
  return "#cf1322";
}
function ParameterResultsBox({
  results,
}: {
  results: { parameter_name: string; value: any }[];
}) {
  const [open, setOpen] = useState(false);
  if (!results || !results.length)
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <p className="text-md font-semibold uppercase tracking-wide text-slate-600">
            Parameter Results
          </p>
          {open ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </button>
        {open && (
          <div className="px-4 pb-4">
            <p className="text-sm text-slate-400">No parameter results yet</p>
          </div>
        )}
      </div>
    );
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <p className="text-md font-semibold uppercase tracking-wide text-slate-600">
          Parameter Results
        </p>
        {open ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-2">
          {results.map((r: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
            >
              <span className="text-sm font-medium text-slate-700">
                {r.parameter_name}
              </span>
              <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                {r.value == null ? "—" : String(r.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function goBack(navigate: any) {
  if (window.history.length > 1) navigate(-1);
  else navigate("/");
}

const MarkdownCode: Components["code"] = ({
  className,
  children,
  ...props
}) => {
  const match = /language-(\w+)/.exec(className || "");

  if (match) {
    return (
      <SyntaxHighlighter style={syntaxTheme} language={match[1]} PreTag="div">
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const feedbackMarkdownComponents: Components = {
  h2: ({ children }: any) => (
    <h2 className="text-lg font-bold text-slate-900 mt-4 mb-3 border-b border-slate-200 pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-slate-800 mt-3 mb-2">
      {children}
    </h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside ml-2 mb-3 space-y-1">{children}</ul>
  ),
  li: ({ children }: any) => (
    <li className="text-md text-slate-700 leading-relaxed">{children}</li>
  ),
  p: ({ children }: any) => (
    <p className="text-md text-slate-600 mb-2">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic">{children}</em>,
};

function scoreColor(score: number) {
  if (score >= 10) {
    return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
  }

  if (score >= 6) {
    return { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  }

  return { bar: "bg-red-500", badge: "bg-red-50 text-red-600" };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={16} className="text-emerald-600" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  );
}

function FeedbackBlock({ feedback }: { feedback: string }) {
  // Strip "Overall Score: X/10" line from feedback
  const strippedFeedback = feedback
    .replace(/^###\s*Overall\s*Score:.*?\/10.*$/m, "")
    .trim();
  const formattedFeedback = formatFeedbackAsMarkdown(strippedFeedback);

  return (
    <div className="prose prose-sm prose-slate max-w-none bg-white p-4 rounded-lg border border-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={feedbackMarkdownComponents}
      >
        {formattedFeedback}
      </ReactMarkdown>
    </div>
  );
}

export default function ArticleDetail() {
  const { user } = useAuth();
  const { id, version: routeVersion } = useParams<{
    id: string;
    version?: string;
  }>();
  const [editorView, setEditorView] = useState<"editor" | "preview">("editor");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryVersion = searchParams.get("version");
  const rawVersion = routeVersion ?? queryVersion;
  const parsedVersion = rawVersion ? parseInt(rawVersion, 10) : null;
  const versionParam =
    parsedVersion !== null && !isNaN(parsedVersion) ? parsedVersion : null;

  const {
    article,
    history,
    currentScore,
    currentFeedback,
    loading,
    error,
    parameterResults,
    setCurrentScore,
    setCurrentFeedback,
    setArticle,
    setParameterResults,
    setHistory,
  } = useArticle(id ?? "");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [contentCollapsed, setContentCollapsed] = useState(true);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    }
  }, [article]);

  const isVersionSnapshot =
    versionParam !== null &&
    history.some((h) => h.version === versionParam) &&
    versionParam !== article?.version;
  // If version param matches a history entry, show snapshot; if it equals current version treat as live
  const snapshot =
    versionParam !== null
      ? (history.find((h) => h.version === versionParam) ?? null)
      : null;
  const effectiveSnapshot = isVersionSnapshot ? snapshot : null;
  const displayTitle = effectiveSnapshot?.title ?? article?.title ?? "";
  const displayContent = effectiveSnapshot?.content ?? article?.content ?? "";
  const displayScore = effectiveSnapshot
    ? effectiveSnapshot.score
    : currentScore;
  const displayFeedback = effectiveSnapshot
    ? (effectiveSnapshot.feedback ?? "")
    : (currentFeedback ?? "");
  const displaySubmittedAt = effectiveSnapshot?.submitted_at ?? null;

  // Poll every 2.5s while scoring; stops on unmount/complete/timeout (5 min)
  const POLLING_INTERVAL = 2500;
  const MAX_POLL_DURATION = 300000;
  useEffect(() => {
    if (effectiveSnapshot || !article || currentScore !== null) return;
    let stopped = false;
    let timer: number | null = null;
    const pollStart = Date.now();
    const isTimedOut = () => Date.now() - pollStart > MAX_POLL_DURATION;
    const tick = async () => {
      if (stopped || document.visibilityState === "hidden") return;
      if (isTimedOut()) {
        if (timer) clearInterval(timer);
        try {
          sessionStorage.setItem("toastError", "Scoring timed out");
        } catch {}
        return;
      }
      try {
        const result = await api<ArticleDetailResponse>(
          `/articles/mine/${article.id}`,
        );
        setArticle(result.article);
        setHistory(result.history ?? []);
        setCurrentScore(result.current_score);
        setCurrentFeedback(result.current_feedback ?? "");
        setParameterResults(result.parameter_results ?? []);
        if (result.current_score !== null) {
          if (timer) clearInterval(timer);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    };
    timer = window.setInterval(() => {
      if (isTimedOut()) {
        if (timer) clearInterval(timer);
        try {
          sessionStorage.setItem("toastError", "Scoring timed out");
        } catch {}
        return;
      }
      tick();
    }, POLLING_INTERVAL);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [article?.id, currentScore, effectiveSnapshot]);

  const isPending = currentScore === null && article?.status === "pending";

  async function handleSubmitRewrite() {
    if (!article) return;
    if (!title.trim() || !content.trim()) {
      setSubmitError("Title and content are required");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    api(`/articles`, {
      method: "POST",
      body: JSON.stringify({
        id: article.id,
        article_type_id: article.article_type_id,
        title: title.trim(),
        content: content.trim(),
      }),
    }).catch((err) => {
      console.error("Background rewrite submission failed:", err);
    });

    try {
      sessionStorage.setItem(
        "toast",
        "Article rewrite submitted! Scoring in progress...",
      );
    } catch {}

    navigate("/");
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

          <button
            onClick={() => navigate("/")}
            className="text-sm text-indigo-600 hover:underline"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  const hasScore = displayScore !== null;
  const colors = hasScore ? scoreColor(displayScore!) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {user?.auth_role === "user" ? <Header /> : <AdminHeader />}

      <div className="w-full px-4 md:px-8 py-8">
        <button
          onClick={() => goBack(navigate)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {effectiveSnapshot && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
              Version {effectiveSnapshot.version} Snapshot
            </span>
            {displaySubmittedAt && (
              <span className="text-xs text-slate-400">
                {dayjs(displaySubmittedAt).format("MMM D, YYYY h:mm A")}
              </span>
            )}
          </div>
        )}
        {isPending && !effectiveSnapshot && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Processing your
            submission — scoring in background...
          </div>
        )}
        <div className="flex items-start justify-between gap-4 mb-6">
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="flex-1 bg-white text-sm font-medium rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-slate-900 leading-snug">
              {displayTitle}
            </h1>
          )}

          {effectiveSnapshot ? null : isPending ? (
            <span className="text-xs px-3 py-2 rounded-lg bg-amber-100 text-amber-700 font-medium">
              Scoring — edits disabled
            </span>
          ) : editing ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setEditing(false);

                  if (article) {
                    setTitle(article.title);
                    setContent(article.content);
                  }

                  setSubmitError(null);
                }}
                className="flex items-center gap-1.5 text-sm font-medium bg-white text-slate-700 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>

              <button
                onClick={handleSubmitRewrite}
                disabled={submitting}
                className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-3 py-2 transition-colors"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Submit Rewrite
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditing(true);
                setContentCollapsed(false);
              }}
              className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 transition-colors shrink-0"
            >
              <Edit3 size={14} />
              Rewrite Article
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Current Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-md font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Current Score
            </p>

            <div className="flex items-center gap-3">
              {displayScore === null ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                  <span>Scoring...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-slate-900">
                    {hasScore ? formatScore(displayScore!) : "—"}

                    <span className="text-base text-slate-400 font-normal">
                      {" "}
                      / 10
                    </span>
                  </p>

                  {hasScore && colors && (
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar}`}
                        style={{
                          width: `${(Math.min(displayScore!, 10) / 10) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-md font-semibold uppercase tracking-wide text-slate-600">
                Feedback
              </p>

              {displayFeedback && <CopyButton text={displayFeedback} />}
            </div>

            {displayScore === null ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <Loader2 size={16} className="animate-spin text-slate-400" />
                <span>Scoring...</span>
              </div>
            ) : (
              <FeedbackBlock
                feedback={displayFeedback || "No feedback available yet."}
              />
            )}
          </div>
          <ParameterResultsBox results={parameterResults} />

          {/* Content - COLLAPSIBLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-slate-100 cursor-pointer"
              onClick={() => setContentCollapsed(!contentCollapsed)}
            >
              <h2 className="font-semibold text-slate-900">Article</h2>

              <div className="flex items-center gap-2">
                {article && (
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                    {article.article_type_name}
                  </span>
                )}
                <span className="p-1 text-slate-400">
                  {contentCollapsed ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronUp size={18} />
                  )}
                </span>
              </div>
            </div>

            {!contentCollapsed && (
              <div className="px-5 py-4">
                {editing ? (
                  <div>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit">
                      <button
                        type="button"
                        onClick={() => setEditorView("editor")}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          editorView === "editor"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorView("preview")}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          editorView === "preview"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="mx-5">
                      {editorView === "editor" && (
                        <TiptapEditor value={content} onChange={setContent} />
                      )}
                    </div>

                    {editorView === "preview" && (
                      <ArticleViewer content={content} />
                    )}
                  </div>
                ) : (
                  <ArticleViewer content={content} />
                )}

                {submitError && (
                  <p className="mt-3 text-sm text-red-600">{submitError}</p>
                )}
              </div>
            )}
          </div>

          {!effectiveSnapshot && (
            <ScoringHistoryTable
              history={history}
              articleId={article?.id ?? ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ScoringHistoryTable({
  history,
  articleId,
}: {
  history: HistoryItem[];
  articleId: string;
}) {
  const navigate = useNavigate();
  const [cols, setCols] = useState<ColumnsType<HistoryItem>>([]);
  useEffect(() => {
    const columns: ColumnsType<HistoryItem> = [
      {
        title: "Version",
        dataIndex: "version",
        key: "version",
        width: 90,
        sorter: (a, b) => a.version - b.version,
        render: (v: number, r: HistoryItem) => (
          <span
            onClick={() =>
              navigate(`/articles/${articleId}?version=${r.version}`)
            }
            className="text-sky-600 font-semibold text-sm cursor-pointer"
          >
            Aritcle Version {v}
          </span>
        ),
      },
      {
        title: "AI Score",
        dataIndex: "score",
        key: "score",
        width: 130,
        render: (s: number | null) =>
          s === null ? (
            <span className="text-slate-400 text-xs">—</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Progress
                percent={Math.min(Math.max(s, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={scoreColorHex(s)}
                style={{ width: 56 }}
              />
              <span
                className="font-semibold text-xs" style={{ color: scoreColorHex(s) }}
              >
                {formatScore(s)}
              </span>
            </span>
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (_: any, r: HistoryItem) => {
          const ds =
            r.score === null
              ? "scoring"
              : r.score === 10
                ? "accepted"
                : "rejected";
          const label =
            ds === "scoring"
              ? "Scoring..."
              : ds === "accepted"
                ? "Accepted"
                : "Rejected";
          return (
            <Tag
              color={
                ds === "accepted"
                  ? "green"
                  : ds === "rejected"
                    ? "red"
                    : "default"
              }
              style={{ fontSize: 13 }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: "Submitted",
        dataIndex: "submitted_at",
        key: "submitted_at",
        width: 160,
        sorter: (a, b) =>
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime(),
        render: (d: string) => (
          <span className="text-slate-700 text-xs">
            {dayjs(d).format("MMM D, YYYY h:mm A")}
          </span>
        ),
      },
    ];
    setCols(columns);
  }, [articleId]);
  const handleResize =
    (idx: number) =>
    (_: any, { size }: { size: { width: number } }) =>
      setCols((cur) => {
        const n = [...cur];
        n[idx] = { ...n[idx], width: size.width };
        return n;
      });
  const merged = cols.map((c, i) => ({
    ...c,
    ...(typeof c.width === "number"
      ? { onHeaderCell: () => ({ width: c.width, onResize: handleResize(i) }) }
      : {}),
  }));
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#111827",
          borderRadius: 8,
          colorText: "#111827",
          colorTextSecondary: "#374151",
          fontSize: 14,
          colorBgContainer: "#ffffff",
        },
        components: {
          Table: {
            headerBg: "#ffffff",
            headerColor: "#111827",
            headerSplitColor: "#d1d5db",
            borderColor: "#d1d5db",
            rowHoverBg: "#f9fafb",
            cellPaddingBlock: 14,
          },
        },
      }}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200"
        >
          <span className="text-base font-semibold text-gray-900">
            Scoring History
          </span>
          <span className="text-xs text-slate-500">
            {history.length} versions
          </span>
        </div>
        <Table<HistoryItem>
          components={{ header: { cell: ResizeableTitle } }}
          columns={merged}
          dataSource={history}
          rowKey="version"
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No scoring history yet." }}
        />
      </div>
    </ConfigProvider>
  );
}
