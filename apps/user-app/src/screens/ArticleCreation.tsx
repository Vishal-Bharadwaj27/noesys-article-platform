import Header from "../components/Header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ChevronLeft, Send, Loader2, Copy, Check } from "lucide-react";
import { api } from "../http-client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";

type ArticleType = { id: string; name: string; description: string | null };
type CreateResponse = { id: string; status: string };
type FormValues = { article_type_id: string; title: string; content: string };

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
  li: ({ children, ...props }) => (
    <li style={{ marginBottom: "0.5rem" }} {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong style={{ fontWeight: 600 }} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em style={{ fontStyle: "italic" }} {...props}>
      {children}
    </em>
  ),
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

function ContentEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const [view, setView] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500">
          Article Content
        </span>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 rounded-lg p-0.5">
            {(["rendered", "raw"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md ${view === v
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {v === "rendered" ? "Rendered" : "Markdown"}
              </button>
            ))}
          </div>

          <CopyButton text={content} />
        </div>
      </div>

      <div className="p-3">
        {view === "rendered" ? (
          <div className="min-h-[150px] prose prose-sm prose-slate max-w-none px-1 py-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={sharedMarkdownComponents}>
              {content || "No content available."}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            rows={6}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your article content here..."
            className="w-full min-h-[250px] rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        )}
      </div>
    </div>
  );
}

export default function ArticleCreation() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<ArticleType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({ article_type_id: "", title: "", content: "" });

  useEffect(() => {
    let active = true;
    async function loadTypes() {
      try {
        const result = await api<ArticleType[]>("/article-types");
        if (active) setTypes(result);
      } catch (err) {
        if (active) setTypesError(err instanceof Error ? err.message : "Failed to load article types");
      } finally {
        if (active) setLoadingTypes(false);
      }
    }
    loadTypes();
    return () => { active = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.article_type_id) { setError("Please select an article type"); return; }
    if (!values.title.trim()) { setError("Please enter a title"); return; }
    if (!values.content.trim()) { setError("Please enter content"); return; }
    setSubmitting(true);
    try {
      await api<CreateResponse>("/articles", {
        method: "POST",
        body: JSON.stringify({
          article_type_id: values.article_type_id,
          title: values.title.trim(),
          content: values.content.trim(),
        }),
      });
      // simple toast via sessionStorage + alert fallback
      try { sessionStorage.setItem("toast", "Article submitted! Scoring in progress..."); } catch { }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit article");
    } finally {
      setSubmitting(false);
    }
  }

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

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Create New Article</h1>

        <div>
          {typesError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {typesError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Article Type
              </label>
              <Select
                value={values.article_type_id}
                onValueChange={(value: string) => setValues({ ...values, article_type_id: value })}
                disabled={loadingTypes}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an article type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.description ? `${t.name} — ${t.description}` : t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                placeholder="Enter article title"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
              <ContentEditor
                content={values.content}
                onChange={(content) => setValues({ ...values, content })}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? "Submitting..." : "Submit Article"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}