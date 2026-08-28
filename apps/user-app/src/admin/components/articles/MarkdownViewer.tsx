import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

const MarkdownCode: Components["code"] = ({
  className,
  children,
  ...props
}) => {
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

export default function MarkdownViewer({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: MarkdownCode,
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-6 mb-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-6 mb-4">{children}</ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-slate-300 pl-4 italic mb-4">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}