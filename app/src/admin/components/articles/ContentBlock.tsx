import { useState } from "react";
import MarkdownViewer from "./MarkdownViewer";

export default function ContentBlock({
  content,
}: {
  content: string;
}) {
  const [view, setView] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="font-semibold">Content</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setView("rendered")}
            className={`px-3 py-1 rounded ${
              view === "rendered"
                ? "bg-slate-200"
                : "bg-transparent"
            }`}
          >
            Rendered
          </button>

          <button
            onClick={() => setView("raw")}
            className={`px-3 py-1 rounded ${
              view === "raw"
                ? "bg-slate-200"
                : "bg-transparent"
            }`}
          >
            Markdown
          </button>
        </div>
      </div>

      <div className="p-5">
        {view === "rendered" ? (
          <MarkdownViewer content={content} />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}