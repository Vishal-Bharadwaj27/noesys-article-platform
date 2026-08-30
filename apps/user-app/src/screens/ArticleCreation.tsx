import Header from "../components/Header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Send, Loader2, Copy, Check } from "lucide-react";
import { api } from "../http-client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import TurndownService from "turndown";
import { useAuth } from "@/contexts/AuthContext";
import AdminHeader from "@/admin/components/AdminHeader";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ArticleViewer from "@/components/shadcnEditor/ArticleViewer";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

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

const sharedMarkdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1
      style={{
        fontSize: "1.875rem",
        fontWeight: 700,
        marginTop: "1.5rem",
        marginBottom: "1rem",
      }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      style={{
        fontSize: "1.5rem",
        fontWeight: 600,
        marginTop: "1.5rem",
        marginBottom: "0.75rem",
      }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      style={{
        fontSize: "1.25rem",
        fontWeight: 600,
        marginTop: "1rem",
        marginBottom: "0.5rem",
      }}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p style={{ marginBottom: "1rem", lineHeight: 1.6 }} {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul
      style={{
        marginLeft: "1.5rem",
        marginBottom: "1rem",
        listStyleType: "disc",
      }}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      style={{
        marginLeft: "1.5rem",
        marginBottom: "1rem",
        listStyleType: "decimal",
      }}
      {...props}
    >
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
    <blockquote
      style={{
        borderLeft: "4px solid #d9d9d9",
        paddingLeft: "1rem",
        marginLeft: 0,
        marginBottom: "1rem",
        color: "#666",
        fontStyle: "italic",
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
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
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      style={{ color: "#1890ff", textDecoration: "underline" }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  code: MarkdownCode,
  table: ({ children, ...props }) => (
    <div
      style={{
        overflowX: "auto",
        margin: "16px 0",
        maxWidth: "100%",
        borderRadius: "6px",
        border: "1px solid #ddd",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "0.875rem",
          backgroundColor: "#fff",
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      style={{ background: "#f8fafc", borderBottom: "2px solid #ddd" }}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr style={{ borderBottom: "1px solid #e0e0e0" }} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        textAlign: "left",
        backgroundColor: "#f5f5f5",
        fontWeight: 700,
        color: "#333",
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        color: "#555",
      }}
      {...props}
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr
      style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #ddd" }}
    />
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ""}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: 8,
        margin: "12px 0",
        display: "block",
      }}
      {...props}
    />
  ),
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Add GFM table support to turndown
turndown.addRule("table", {
  filter: "table",
  replacement: function (content) {
    return "\n" + content + "\n";
  },
});

turndown.addRule("tableHead", {
  filter: "thead",
  replacement: function (content) {
    return content;
  },
});

turndown.addRule("tableBody", {
  filter: "tbody",
  replacement: function (content) {
    return content;
  },
});

turndown.addRule("tableRow", {
  filter: "tr",
  replacement: function (content) {
    let line = "| " + content.trim() + " |";
    return line + "\n";
  },
});

turndown.addRule("tableCell", {
  filter: ["th", "td"],
  replacement: function (content) {
    return content.trim() + " | ";
  },
});

// Add IMAGE support to turndown - converts <img> to markdown ![alt](src)
turndown.addRule("image", {
  filter: "img",
  replacement: function (content, node) {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    return "![" + alt + "](" + src + ")";
  },
});

function toMarkdown(content: string): string {
  if (!content.trim() || content.trim() === "<p></p>") return "";

  const temp = document.createElement("div");
  temp.innerHTML = content;

  const decode = (s: string) => {
    const ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
  };

  // Detect rich HTML (from .docx paste or Tiptap formatting) vs raw markdown wrapped in <p>
  const hasRichElements = !!temp.querySelector(
    "h1,h2,h3,ul,ol,blockquote,pre,table,strong,em,u",
  );
  const hasImages = !!temp.querySelector("img");
  const hasTable = !!temp.querySelector("table");

  // Case 1: Rich HTML (formatted docx / Tiptap tables/bold/headings/images) -> use Turndown
  if (hasRichElements || hasImages) {
    try {
      if (hasTable) {
        const div = document.createElement("div");
        div.innerHTML = content;

        // Fix tables that might have empty headers
        div.querySelectorAll("table").forEach((tbl) => {
          const headerRow = tbl.querySelector("thead tr");
          if (!headerRow || !headerRow.querySelector("th")) {
            const firstBodyRow = tbl.querySelector("tbody tr");
            if (firstBodyRow) {
              const thead = document.createElement("thead");
              const headerTr = document.createElement("tr");
              firstBodyRow.querySelectorAll("td").forEach((td) => {
                const th = document.createElement("th");
                th.innerHTML = td.innerHTML;
                headerTr.appendChild(th);
              });
              thead.appendChild(headerTr);
              const tbody = tbl.querySelector("tbody");
              if (tbody) {
                tbl.insertBefore(thead, tbody);
                firstBodyRow.remove();
              }
            }
          }
        });

        content = div.innerHTML;
      }

      let md = turndown.turndown(content);
      md = decode(md);

      // Clean up escaped characters except in code blocks
      md = md
        .split("\n")
        .map((line) => {
          if (line.includes("|")) return line;
          return line.replace(/\\([#*_\-[\]`>])/g, "$1");
        })
        .join("\n");

      // Fix GFM table format: ensure delimiter row immediately follows header
      md = md.replace(/(\|[^\n]*\|)\n\s*\n\s*(\|[\s\-:|]+\|)/g, "$1\n$2");

      // Collapse multiple blank lines inside table blocks
      md = md.replace(/(\|[^\n]*\|)\n\n(?=\|)/g, "$1\n");

      // Ensure proper spacing between table and other content
      md = md.replace(/(\|[\s\-:|]+\|)\n(?!\|)/g, "$1\n\n");

      // Clean up multiple consecutive blank lines (except in tables)
      md = md.replace(/\n\n\n+/g, "\n\n");

      return md.trim();
    } catch (e) {
      console.error("Turndown error:", e);
      /* fallthrough */
    }
  }

  // Case 2: raw markdown pasted (wrapped in <p>) + optional images
  const getTextWithBreaks = (el: HTMLElement): string => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    return decode((clone.textContent ?? "").trim());
  };

  const parts: string[] = [];
  for (const node of Array.from(temp.childNodes) as ChildNode[]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const tx = decode((node.textContent ?? "").trim());
      if (tx) parts.push(tx);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as HTMLElement;

    // Handle top-level images
    if (el.tagName.toLowerCase() === "img") {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      if (src) parts.push("![" + alt + "](" + src + ")");
      continue;
    }

    // Handle images inside other elements
    const imgs = Array.from(el.querySelectorAll("img"));
    if (imgs.length > 0) {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("img").forEach((n) => n.remove());
      clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
      const text = decode((clone.textContent ?? "").trim());
      if (text) parts.push(text);
      for (const img of imgs) {
        const src = (img as HTMLImageElement).getAttribute("src") ?? "";
        const alt = img.getAttribute("alt") ?? "";
        if (src) parts.push("![" + alt + "](" + src + ")");
      }
      continue;
    }

    const text = getTextWithBreaks(el);
    if (!text) continue;

    if (text.includes("|") && text.includes("\n")) {
      parts.push(text);
    } else {
      parts.push(text);
    }
  }

  if (parts.length > 0) {
    let out = parts.join("\n\n").trim();
    // GFM tables must have header and delimiter on consecutive lines
    out = out.replace(/(\|[^\n]*\|)\n\s*\n(?=\|)/g, "$1\n");
    return out;
  }

  // Fallback: images at deeper nesting or Turndown for edge cases
  if (hasImages) {
    try {
      return decode(turndown.turndown(content)).trim();
    } catch {}
  }

  const raw = decode((temp as HTMLElement).innerText ?? temp.textContent ?? "");
  return raw.trim();
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

type CreateResponse = { id: string; status: string };
type FormValues = { article_type_id: string; title: string; content: string };
type ArticleType = { id: string; name: string; description: string | null };

export default function ArticleCreation() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<ArticleType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({
    article_type_id: "",
    title: "",
    content: "",
  });
  const [editorView, setEditorView] = useState<"editor" | "preview">("editor");
  const { user } = useAuth();
  useEffect(() => {
    let active = true;

    async function loadTypes() {
      try {
        const result = await api<ArticleType[]>("/article-types");
        if (active) setTypes(result);
      } catch (err) {
        if (active) {
          setTypesError(
            err instanceof Error ? err.message : "Failed to load article types",
          );
        }
      } finally {
        if (active) setLoadingTypes(false);
      }
    }

    loadTypes();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.article_type_id) {
      setError("Please select an article type");
      return;
    }

    if (!values.title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!values.content.trim()) {
      setError("Please enter content");
      return;
    }

    if (values.content.length > 500000) {
      setError("Content exceeds 500KB limit");
      return;
    }

    setSubmitting(true);

    try {
      await api<CreateResponse>("/articles", {
        method: "POST",
        body: JSON.stringify({
          article_type_id: values.article_type_id,
          title: values.title.trim(),
          content: toMarkdown(values.content.trim()),
        }),
      });

      try {
        sessionStorage.setItem(
          "toast",
          "Article submitted! Scoring in progress...",
        );
      } catch {}

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user?.auth_role === "user" ? <Header /> : <AdminHeader />}

      <div className="w-full px-4 md:px-8 py-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronLeft size={14} />
          Back to Articles
        </button>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">
          Create New Article
        </h1>

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
                onValueChange={(value: string) =>
                  setValues({ ...values, article_type_id: value })
                }
                disabled={loadingTypes}
              >
                <SelectTrigger className="w-full border-slate-400 bg-white shadow-sm text-slate-900 [&_span[data-placeholder]]:text-slate-500">
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title
              </label>

              <input
                type="text"
                value={values.title}
                onChange={(e) =>
                  setValues({ ...values, title: e.target.value })
                }
                placeholder="Enter article title"
                className="w-full rounded-lg border border-slate-400 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Content
              </label>

              <div className="space-y-2">
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

                {editorView === "editor" && (
                  <TiptapEditor
                    value={values.content}
                    onChange={(content) => setValues({ ...values, content })}
                  />
                )}

                {editorView === "preview" && <ArticleViewer content={values.content} />}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {submitting ? "Submitting..." : "Submit Article"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
