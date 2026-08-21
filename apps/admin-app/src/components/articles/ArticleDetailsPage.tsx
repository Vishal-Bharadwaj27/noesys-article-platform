import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type HistoryVersion = {
  id: string;
  article_id: string;
  version: number;
  title: string;
  content: string;
  ai_score: number | null;
  ai_feedback: string | null;
  submitted_at: string;
  scored_at: string | null;
  snapshotted_at: string;
};

type ArticleDetails = {
  id: string;
  title: string;
  content: string;
  status: string;
  ai_score: number | null;
  ai_feedback: string | null;
  version: number;
  submitted_at: string;

  author_name: string;
  author_email: string;
  job_role: string;

  history: HistoryVersion[];
};

export default function ArticleDetailsPage() {
  const { id } = useParams();

  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("HEI")
    async function loadArticle() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/articles/${id}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch article");
        }

        const json = await res.json();

        setArticle(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadArticle();
    }
  }, [id]);

  const scoredAttempts = useMemo(() => {
    if (!article) return [];

    return article.history.filter(
      (h) => h.ai_score !== null,
    );
  }, [article]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!article) {
    return <div className="p-6">Article not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-3xl font-bold mb-2">
          {article.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            Author: {article.author_name}
          </span>

          <span>
            Email: {article.author_email}
          </span>

          <span>
            Role: {article.job_role}
          </span>

          <span>
            Version: {article.version}
          </span>

          <span>
            Status: {article.status}
          </span>
        </div>
      </div>

      {/* Current score */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-lg mb-4">
          Latest Evaluation
        </h2>

        <div className="space-y-3">
          <div>
            <span className="font-medium">
              Score:
            </span>{" "}
            {article.ai_score ?? "Not scored"} / 10
          </div>

          <div>
            <span className="font-medium">
              Feedback:
            </span>
            <p className="mt-2 whitespace-pre-wrap">
              {article.ai_feedback ??
                "No feedback available"}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-lg mb-4">
          Content
        </h2>

        <div className="whitespace-pre-wrap leading-7">
          {article.content}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-lg mb-4">
          Submission History
        </h2>

        <div className="space-y-4">
          {scoredAttempts.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  Version {item.version}
                </span>

                <span>
                  Score: {item.ai_score ?? "-"} / 10
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-3">
                {item.ai_feedback}
              </p>

              <div className="text-xs text-slate-500">
                Submitted: {item.submitted_at}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}