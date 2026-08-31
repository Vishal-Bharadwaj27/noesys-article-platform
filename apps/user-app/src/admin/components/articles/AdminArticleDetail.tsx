import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import dayjs from "dayjs";
import { api } from "../../../http-client";
import type { HistoryItem, ArticleDetailResponse } from "../../../hooks/useArticle";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { formatFeedbackAsMarkdown } from "../../../utils/formatFeedback";
import { ConfigProvider, Table, Tag, Progress, theme as antdTheme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import ArticleViewer from "@/components/shadcnEditor/ArticleViewer";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

const ResizeableTitle = ({
  onResize,
  width,
  children,
  ...restProps
}: any) => {
  if (!width || typeof width !== "number") {
    return <th {...restProps}>{children}</th>;
  }

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

function formatScore(s:number){return Number.isInteger(s)?String(s):s.toFixed(1);}
function scoreColorHex(s: number) {
  if (s >= 8) return "#389e0d";
  if (s >= 6) return "#d48806";
  return "#cf1322";
}
function ParameterResultsBox({results}:{results:{parameter_name:string;value:any}[]}){ const [open,setOpen]=useState(false); if(!results||!results.length) return <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"><button onClick={()=>setOpen(v=>!v)} className="w-full flex items-center justify-between px-4 py-3"><p className="text-md font-semibold uppercase tracking-wide text-slate-600">Parameter Results</p>{open?<ChevronUp size={18} className="text-slate-400"/>:<ChevronDown size={18} className="text-slate-400"/>}</button>{open&&<div className="px-4 pb-4"><p className="text-sm text-slate-400">No parameter results yet</p></div>}</div>; return <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"><button onClick={()=>setOpen(v=>!v)} className="w-full flex items-center justify-between px-4 py-3"><p className="text-md font-semibold uppercase tracking-wide text-slate-600">Parameter Results</p>{open?<ChevronUp size={18} className="text-slate-400"/>:<ChevronDown size={18} className="text-slate-400"/>}</button>{open&&<div className="px-4 pb-4 grid gap-2">{results.map((r:any,i:number)=><div key={i} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"><span className="text-sm font-medium text-slate-700">{r.parameter_name}</span><span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">{r.value==null?"—":String(r.value)}</span></div>)}</div>}</div>;}
function goBack(navigate:any){ if(window.history.length>1) navigate(-1); else navigate("/admin/articles"); }

const MarkdownCode: Components["code"] = ({
  className,
  children,
  ...props
}: any) => {
  const m = /language-(\w+)/.exec(className || "");

  if (m) {
    return (
      <SyntaxHighlighter
        style={syntaxTheme}
        language={m[1]}
        PreTag="div"
      >
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

const sharedMarkdownComponents: Components = {
  h1: ({ children, ...p }: any) => (
    <h1
      style={{
        fontSize: "1.875rem",
        fontWeight: 700,
        marginTop: "1.5rem",
        marginBottom: "1rem",
      }}
      {...p}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...p }: any) => (
    <h2
      style={{
        fontSize: "1.5rem",
        fontWeight: 600,
        marginTop: "1.5rem",
        marginBottom: "0.75rem",
      }}
      {...p}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...p }: any) => (
    <h3
      style={{
        fontSize: "1.25rem",
        fontWeight: 600,
        marginTop: "1rem",
        marginBottom: "0.5rem",
      }}
      {...p}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...p }: any) => (
    <p style={{ marginBottom: "1rem", lineHeight: 1.6 }} {...p}>
      {children}
    </p>
  ),
  ul: ({ children, ...p }: any) => (
    <ul
      style={{
        marginLeft: "1.5rem",
        marginBottom: "1rem",
        listStyleType: "disc",
      }}
      {...p}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...p }: any) => (
    <ol
      style={{
        marginLeft: "1.5rem",
        marginBottom: "1rem",
        listStyleType: "decimal",
      }}
      {...p}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...p }: any) => (
    <li style={{ marginBottom: "0.5rem" }} {...p}>
      {children}
    </li>
  ),
  strong: ({ children, ...p }: any) => (
    <strong style={{ fontWeight: 600 }} {...p}>
      {children}
    </strong>
  ),
  em: ({ children, ...p }: any) => (
    <em style={{ fontStyle: "italic" }} {...p}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...p }: any) => (
    <blockquote
      style={{
        borderLeft: "4px solid #d9d9d9",
        paddingLeft: "1rem",
        marginLeft: 0,
        marginBottom: "1rem",
        color: "#666",
        fontStyle: "italic",
      }}
      {...p}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...p }: any) => (
    <pre
      style={{
        background: "#1e1e1e",
        border: "1px solid #444",
        borderRadius: 6,
        padding: 12,
        fontSize: 13,
        overflow: "auto",
        marginBottom: "1rem",
      }}
      {...p}
    >
      {children}
    </pre>
  ),
  a: ({ href, children, ...p }: any) => (
    <a
      href={href}
      style={{ color: "#1890ff", textDecoration: "underline" }}
      target="_blank"
      rel="noopener noreferrer"
      {...p}
    >
      {children}
    </a>
  ),
  code: MarkdownCode,
  img: ({ src, alt }: any) => (
    <img
      src={src}
      alt={alt}
      style={{
        maxWidth: "100%",
        display: "block",
        borderRadius: 8,
        margin: "1rem 0",
      }}
    />
  ),
  table: ({ children, ...p }: any) => (
    <div
      style={{
        overflowX: "auto",
        marginBottom: "1rem",
        maxWidth: "100%",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
        {...p}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...p }: any) => (
    <thead style={{ background: "#f8fafc" }} {...p}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...p }: any) => <tbody {...p}>{children}</tbody>,
  tr: ({ children, ...p }: any) => <tr {...p}>{children}</tr>,
  th: ({ children, ...p }: any) => (
    <th
      style={{
        border: "1px solid #e2e8f0",
        padding: "8px 12px",
        fontWeight: 600,
        textAlign: "left",
        background: "#f8fafc",
      }}
      {...p}
    >
      {children}
    </th>
  ),
  td: ({ children, ...p }: any) => (
    <td
      style={{
        border: "1px solid #e2e8f0",
        padding: "8px 12px",
      }}
      {...p}
    >
      {children}
    </td>
  ),
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
    <ul className="list-disc list-inside ml-2 mb-3 space-y-1">
      {children}
    </ul>
  ),
  li: ({ children }: any) => (
    <li className="text-sm text-slate-700 leading-relaxed">
      {children}
    </li>
  ),
  p: ({ children }: any) => (
    <p className="text-sm text-slate-600 mb-2">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic">{children}</em>,
};

function scoreColor(score: number) {
  if (score >= 8) return { bar: "bg-emerald-500" };
  if (score >= 6) return { bar: "bg-amber-500" };
  return { bar: "bg-red-500" };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check size={16} className="text-emerald-600" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  );
}

function ContentBlock({ content }: { content: string }) {
  const [view, setView] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Content</h2>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView("rendered")}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                view === "rendered"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Rendered
            </button>

            <button
              onClick={() => setView("raw")}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                view === "raw"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Markdown
            </button>
          </div>

          <CopyButton text={content} />
        </div>
      </div>

      <div className="px-5 py-4">
        {view === "rendered" ? (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={sharedMarkdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <pre
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function FeedbackBlock({ feedback }: { feedback: string }) {
  const stripped = feedback
    .replace(/^###\s*Overall\s*Score:.*?\/10.*$/m, "")
    .trim();

  const fmt = formatFeedbackAsMarkdown(stripped);

  return (
    <div className="prose prose-sm prose-slate max-w-none bg-white p-4 rounded-lg border border-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={feedbackMarkdownComponents}
      >
        {fmt}
      </ReactMarkdown>
    </div>
  );
}

export default function AdminArticleDetail() {
  const { id, version: routeVersion } = useParams<{
    id: string;
    version?: string;
  }>();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryVersion = searchParams.get("version");
  const rawVersion = routeVersion ?? queryVersion;

  const parsedVersion = rawVersion ? parseInt(rawVersion, 10) : null;
  const versionParam =
    parsedVersion !== null && !isNaN(parsedVersion) ? parsedVersion : null;

  const [article, setArticle] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [parameterResults, setParameterResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contentCollapsed, setContentCollapsed] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);

      try {
        const BACKEND = import.meta.env.VITE_BACKEND_URL;
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        const headers: Record<string, string> = {};

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${BACKEND}/api/articles/${id}`, {
          credentials: "include",
          headers,
        });

        if (!res.ok) throw new Error("Failed to load");

        const json = await res.json();
        const d = json.data;

        // admin response shape
        // normalize to user ArticleDetail shape
        const art = {
          id: d.id,
          title: d.title,
          content: d.content,
          article_type_id: d.article_type_id || "",
          article_type_name: d.article_type_name || d.type || "",
          status: d.status,
          version: d.version,
        } as any;

        setArticle(art);
        setCurrentScore(d.ai_score ?? null);
        setCurrentFeedback(d.ai_feedback || "");
        setParameterResults(d.parameter_results ?? []);

        const hist = (d.history || []).map((h: any) => ({
          article_id: h.article_id || h.id,
          version: h.version,
          title: h.title,
          content: h.content,
          score: h.ai_score ?? h.score ?? null,
          feedback: h.ai_feedback ?? h.feedback ?? null,
          status: h.status || "pending",
          submitted_at: h.submitted_at || h.snapshotted_at,
        }));

        setHistory(hist);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // also try user endpoint fallback
  useEffect(() => {
    if (article) return;
    if (!id) return;

    (async () => {
      try {
        const result = await api<ArticleDetailResponse>(
          `/articles/mine/${id}`
        );

        setArticle(result.article);
        setHistory(result.history ?? []);
        setCurrentScore(result.current_score);
        setCurrentFeedback(result.current_feedback ?? "");
        setParameterResults((result as any).parameter_results ?? []);
        setError(null);
      } catch {}
    })();
  }, [id, article]);

  const isVersionSnapshot =
    versionParam !== null &&
    history.some((h) => h.version === versionParam) &&
    versionParam !== article?.version;

  const snapshot =
    versionParam !== null
      ? history.find((h) => h.version === versionParam) ?? null
      : null;

  const effectiveSnapshot = isVersionSnapshot ? snapshot : null;
  const displayTitle = effectiveSnapshot?.title ?? article?.title ?? "";
  const displayContent = effectiveSnapshot?.content ?? article?.content ?? "";
  const displayScore = effectiveSnapshot
    ? effectiveSnapshot.score
    : currentScore;
  const displayFeedback = effectiveSnapshot
    ? effectiveSnapshot.feedback ?? ""
    : currentFeedback ?? "";
  const displaySubmittedAt = effectiveSnapshot?.submitted_at ?? null;

  const hasScore = displayScore !== null;
  const colors = hasScore ? scoreColor(displayScore!) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2
          size={28}
          className="animate-spin text-slate-400"
        />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">
            {error || "Article not found"}
          </p>

          <button
            onClick={() => navigate("/admin/articles")}
            className="text-sm text-indigo-600 hover:underline"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
                {dayjs(displaySubmittedAt).format(
                  "MMM D, YYYY h:mm A"
                )}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 leading-snug">
            {displayTitle}
          </h1>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-md font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Current Score
            </p>

            <div className="flex items-center gap-3">
              {displayScore === null ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
                  <Loader2
                    size={16}
                    className="animate-spin text-slate-400"
                  />
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

                  {hasScore && (
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors!.bar}`}
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

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-md font-semibold uppercase tracking-wide text-slate-600">
                Feedback
              </p>

              {displayFeedback && (
                <CopyButton text={displayFeedback} />
              )}
            </div>

            {displayScore === null ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <Loader2
                  size={16}
                  className="animate-spin text-slate-400"
                />
                <span>Scoring...</span>
              </div>
            ) : (
              <FeedbackBlock
                feedback={displayFeedback || "No feedback available yet."}
              />
            )}
          </div>
          <ParameterResultsBox results={parameterResults} />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-slate-100 cursor-pointer"
              onClick={() => setContentCollapsed(!contentCollapsed)}
            >
              <h2 className="font-semibold text-slate-900">
                Article
              </h2>

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
                {/* <ContentBlock content={displayContent} /> */}
                <ArticleViewer content={displayContent} />
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
              navigate(
                `/admin/articles/${articleId}?version=${r.version}`
              )
            }
            style={{
              color: "#0284c7",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
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
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              —
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Progress
                percent={Math.min(Math.max(s, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={scoreColorHex(s)}
                style={{ width: 56 }}
              />

              <span
                style={{
                  color: scoreColorHex(s),
                  fontWeight: 600,
                  fontSize: 13,
                }}
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
          <span
            style={{
              color: "#334155",
              fontSize: 13,
            }}
          >
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
      ? {
          onHeaderCell: () => ({
            width: c.width,
            onResize: handleResize(i),
          }),
        }
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
        style={{
          background: "#ffffff",
          border: "1.5px solid #d1d5db",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1.5px solid #d1d5db",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Scoring History
          </span>

          <span
            style={{
              fontSize: 13,
              color: "#64748b",
            }}
          >
            {history.length} versions
          </span>
        </div>

        <Table<HistoryItem>
          components={{
            header: {
              cell: ResizeableTitle,
            },
          }}
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