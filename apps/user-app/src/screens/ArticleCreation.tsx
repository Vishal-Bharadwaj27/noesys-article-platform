import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { api } from "../http-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ArticleType = { id: string; name: string; description: string | null };
type CreateResponse = { id: string; status: string };
type FormValues = { article_type_id: string; title: string; content: string };

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
      const result = await api<CreateResponse>("/articles", {
        method: "POST",
        body: JSON.stringify({
          article_type_id: values.article_type_id,
          title: values.title.trim(),
          content: values.content.trim(),
        }),
      });
      navigate(`/articles/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft size={14} />
          Back to Articles
        </button>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Create New Article</h1>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
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
              <textarea
                rows={12}
                value={values.content}
                onChange={(e) => setValues({ ...values, content: e.target.value })}
                placeholder="Write your article content here..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
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