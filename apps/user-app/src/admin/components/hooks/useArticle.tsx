import { useEffect, useState, useCallback } from "react";

type UseArticleOptions = {
  adminMode?: boolean;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useArticle(
  id: string,
  { adminMode = false }: UseArticleOptions = {},
) {
  const [article, setArticle] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = adminMode
        ? `${BACKEND_URL}/api/articles/${id}`
        : `${BACKEND_URL}/articles/mine/${id}`;

      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error(`Failed to load article (${res.status})`);
      }

      const json = await res.json();

      if (adminMode) {
        const data = json.data;

        setArticle(data);
        setHistory(data?.history ?? []);
        setCurrentScore(data?.ai_score ?? null);
        setCurrentFeedback(data?.ai_feedback ?? "");
      } else {
        setArticle(json.article);
        setHistory(json.history ?? []);
        setCurrentScore(json.current_score ?? null);
        setCurrentFeedback(json.current_feedback ?? "");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load article";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, adminMode]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  return {
    article,
    history,
    currentScore,
    currentFeedback,
    loading,
    error,
    refetch: fetchArticle,
    setCurrentScore,
    setCurrentFeedback,
    setHistory,
    setArticle,
  };
}