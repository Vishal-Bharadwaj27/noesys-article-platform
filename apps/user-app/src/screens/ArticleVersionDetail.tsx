import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useArticle } from "../hooks/useArticle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatFeedbackAsMarkdown } from "../utils/formatFeedback";
import dayjs from "dayjs";

export default function ArticleVersionDetail() {
  const { id, version } = useParams<{ id: string; version: string }>();
  const navigate = useNavigate();
  const { article, history, loading, error } = useArticle(id ?? "");
  const v = parseInt(version ?? "", 10);
  const snap = history.find(h => h.version === v);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p>{error}</p><button onClick={() => navigate(`/articles/${id}`)} className="ml-2 underline">Back</button></div>;
  if (!snap) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-8 text-center">Version {v} not found.<button onClick={() => navigate(`/articles/${id}`)} className="ml-2 text-indigo-600 underline">Back to current version</button></div></div>;

  const score = snap.score;
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="w-full px-4 md:px-8 py-8">
        <button onClick={() => navigate(`/articles/${id}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"><ChevronLeft size={14} />Back to current version</button>
        <div className="mb-4 flex items-center gap-2"><span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Version {snap.version} snapshot</span><span className="text-xs text-slate-400">{dayjs(snap.submitted_at).format("MMM D, YYYY h:mm A")}</span><span className="text-xs text-slate-400">{article?.article_type_name}</span></div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">{snap.title || `v${snap.version}`}</h1>
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5"><p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Current Score</p>{score===null?<span className="text-slate-400">Scoring...</span>:<p className="text-3xl font-semibold">{score.toFixed(1)}<span className="text-base text-slate-400"> /10</span></p>}</div>
          <div className="bg-white border rounded-xl p-5"><p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Feedback</p><div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{formatFeedbackAsMarkdown(snap.feedback || "No feedback.")}</ReactMarkdown></div></div>
          <div className="bg-white border rounded-xl p-5"><p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Content</p><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{snap.content || ""}</ReactMarkdown></div></div>
        </div>
      </div>
    </div>
  );
}
