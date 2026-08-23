import ArticleRow, { ArticleSummary } from "./ArticlesRow";

type ArticlesTableProps = {
  articles: ArticleSummary[];
  onRowClick?: (id: string) => void;
};

export default function ArticlesTable({
  articles,
  onRowClick,
}: ArticlesTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Articles</h2>
        <span className="text-xs text-slate-400">{articles.length} total</span>
      </div>

      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_0.6fr_1fr_1fr_0.9fr_1fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
        {[
          "TITLE",
          "TYPE",
          "VERSION",
          "AUTHOR",
          "AI SCORE",
          "STATUS",
          "CREATED",
        ].map((col) => (
          <span
            key={col}
            className="text-[11px] font-medium text-slate-400 tracking-wide"
          >
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      {articles.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No articles found.
        </div>
      ) : (
        articles.map((article) => (
          <ArticleRow key={article.id} article={article} onClick={onRowClick} />
        ))
      )}
    </div>
  );
}
