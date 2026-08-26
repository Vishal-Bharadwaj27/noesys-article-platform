import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { ChevronLeft, Edit3, X, Check, Clock, Loader2, Copy } from "lucide-react";
import dayjs from "dayjs";
import { useArticle, type HistoryItem, type ArticleDetailResponse } from "../hooks/useArticle";
import { api } from "../http-client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { formatFeedbackAsMarkdown } from "../utils/formatFeedback";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

const MarkdownCode: Components["code"] = ({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");

  if (match) {
    return (
      <SyntaxHighlighter
        style={syntaxTheme}
        language={match[1]}
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
  h1: ({ children, ...props }) => (
    <h1 style={{ fontSize: "1.875rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "1rem" }} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.75rem" }} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "1rem", marginBottom: "0.5rem" }} {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p style={{ marginBottom: "1rem", lineHeight: 1.6 }} {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", listStyleType: "disc" }} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol style={{ marginLeft: "1.5rem", marginBottom: "1rem", listStyleType: "decimal" }} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => <li style={{ marginBottom: "0.5rem" }} {...props}>{children}</li>,
  strong: ({ children, ...props }) => <strong style={{ fontWeight: 600 }} {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em style={{ fontStyle: "italic" }} {...props}>{children}</em>,
  blockquote: ({ children, ...props }) => (
    <blockquote style={{ borderLeft: "4px solid #d9d9d9", paddingLeft: "1rem", marginLeft: 0, marginBottom: "1rem", color: "#666", fontStyle: "italic" }} {...props}>
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre style={{ background: "#1e1e1e", border: "1px solid #444", borderRadius: 6, padding: 12, fontSize: 13, overflow: "auto", marginBottom: "1rem" }} {...props}>
      {children}
    </pre>
  ),
    a: ({ href, children, ...props }) => (
      <a href={href} style={{ color: "#1890ff", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
      code: MarkdownCode,
        table: ({ children, ...props }) => (
          <div style={{ overflowX: "auto", marginBottom: "1rem", maxWidth: "100%" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }} {...props}>{children}</table></div>
        ),
          thead: ({ children, ...props }) => <thead style={{ background: "#f8fafc" }} {...props}>{children}</thead>,
            tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
              tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
                th: ({ children, ...props }) => <th style={{ border: "1px solid #e2e8f0", padding: "8px 12px", fontWeight: 600, textAlign: "left", background: "#f8fafc" }} {...props}>{children}</th>,
                  td: ({ children, ...props }) => <td style={{ border: "1px solid #e2e8f0", padding: "8px 12px" }} {...props}>{children}</td>,
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
    <p className="text-sm text-slate-600 mb-2">
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic">{children}</em>
  ),
};

function scoreColor(score: number) {
  if (score >= 8) {
    return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
  }

  if (score >= 6) {
    return { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  }

  return { bar: "bg-red-500", badge: "bg-red-50 text-red-600" };
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-indigo-50 text-indigo-700",
  rewrite_required: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  failed: "bg-slate-100 text-slate-600",
};

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
              className={`px-3 py-1 text-xs font-medium rounded-md ${view === "rendered"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setView("raw")}
              className={`px-3 py-1 text-xs font-medium rounded-md ${view === "raw"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
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
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={sharedMarkdownComponents}>
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

function RewriteContentEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const [view, setView] = useState<"rendered" | "raw">("raw");

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500">
          Article Content
        </span>

        <div className="flex bg-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setView("rendered")}
            className={`px-3 py-1 text-xs font-medium rounded-md ${view === "rendered"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setView("raw")}
            className={`px-3 py-1 text-xs font-medium rounded-md ${view === "raw"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Markdown
          </button>
        </div>
      </div>

      <div className="p-3">
        {view === "rendered" ? (
          <div className="min-h-[250px] prose prose-sm prose-slate max-w-none px-1 py-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={sharedMarkdownComponents}>
              {content || "No content available."}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            rows={10}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Article content"
            className="w-full min-h-[250px] rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        )}
      </div>
    </div>
  );
}

function FeedbackBlock({ feedback }: { feedback: string }) {
  const formattedFeedback = formatFeedbackAsMarkdown(feedback);
  return (
    <div className="prose prose-sm prose-slate max-w-none bg-white p-4 rounded-lg border border-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={feedbackMarkdownComponents}>
        {formattedFeedback}
      </ReactMarkdown>
    </div>
  );
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { article, history, currentScore, currentFeedback, loading, error, setCurrentScore, setCurrentFeedback, setArticle, setHistory } = useArticle(id ?? "");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    }
  }, [article]);

  // Fallback polling for direct visits — exponential backoff, max 50 attempts
  useEffect(() => {
    if (!article || (article.status !== "processing" && article.status !== "pending")) return;
    let attempts = 0; let timeout: number | null = null; let stopped = false;
    const schedule = () => {
      if (stopped || attempts >= 50) return;
      const delay = attempts < 5 ? 3000 : attempts < 15 ? 6000 : 10000;
      timeout = window.setTimeout(async () => {
        attempts++;
        try {
          const result = await api<ArticleDetailResponse>(`/articles/mine/${article.id}`);
          setArticle(result.article); setHistory(result.history ?? []); setCurrentScore(result.current_score); setCurrentFeedback(result.current_feedback ?? "");
          if (result.article.status === "pending" || result.article.status === "processing") schedule();
        } catch (e) { console.error(e); schedule(); }
      }, delay);
    };
    schedule();
    return () => { stopped = true; if (timeout) clearTimeout(timeout); };
  }, [article?.id, article?.status]);

  async function handleSubmitRewrite() {
    if (!article) return;

    if (!title.trim() || !content.trim()) {
      setSubmitError("Title and content are required");
      return;
    }

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

      navigate("/my-articles");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit rewrite"
      );
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

  const hasScore = currentScore !== null;
  const colors = hasScore ? scoreColor(currentScore!) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="w-full px-4 md:px-8 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronLeft size={14} />
          Back to Articles
        </button>

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
            <h1 className="text-2xl font-semibold text-slate-900 leading-snug">
              {article?.title}
            </h1>
          )}

          {editing ? (
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
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 transition-colors shrink-0"
            >
              <Edit3 size={14} />
              Rewrite Article
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Article</h2>

              <div className="flex items-center gap-2">
                {article && (
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                    {article.article_type_name}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              {editing ? (
                <RewriteContentEditor
                  content={content}
                  onChange={setContent}
                />
              ) : (
                <ContentBlock content={article?.content ?? ""} />
              )}

              {submitError && (
                <p className="mt-3 text-sm text-red-600">{submitError}</p>
              )}

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                    Current Score
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-slate-900">
                      {hasScore ? currentScore!.toFixed(1) : "—"}

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
                            width: `${(Math.min(currentScore!, 10) / 10) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Feedback
                    </p>

                    {currentFeedback && (
                      <CopyButton text={currentFeedback} />
                    )}
                  </div>

                  <FeedbackBlock
                    feedback={
                      currentFeedback || "No feedback available yet."
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                Scoring History
              </h2>
            </div>

            <div className="hidden md:grid grid-cols-4 gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              {["VERSION", "SCORE", "STATUS", "SUBMITTED"].map((col) => (
                <span
                  key={col}
                  className="text-[11px] font-medium text-slate-400 tracking-wide"
                >
                  {col}
                </span>
              ))}
            </div>

            {history.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                No scoring history yet.
              </div>
            ) : (
              history.map((item) => (
                <HistoryRow key={item.version} item={item} />
              ))
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
      <span className="font-medium text-slate-700 text-sm">
        v{item.version}
      </span>

      <div className="flex items-center gap-2">
        {hasScore ? (
          <span
            className={`text-xs font-semibold rounded-full px-2 py-0.5 ${colors!.badge}`}
          >
            {item.score!.toFixed(1)}
          </span>
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </div>

      <span
        className={`inline-flex w-fit items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-600"
          }`}
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