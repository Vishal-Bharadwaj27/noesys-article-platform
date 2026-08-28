import { useEffect, useState, useCallback } from "react";
import { api } from "../http-client";

export interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  article_type_id: string;
  article_type_name: string;
  status: string;
  version: number;
}

export interface HistoryItem {
  article_id: string;
  version: number;
  title: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
}

export interface ArticleDetailResponse {
  article: ArticleDetail;
  current_feedback: string;
  current_score: number | null;
  history: HistoryItem[];
}

export function useArticle(id: string) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api<ArticleDetailResponse>(`/articles/mine/${id}`);
      setArticle(result.article);
      setHistory(result.history ?? []);
      setCurrentScore(result.current_score);
      setCurrentFeedback(result.current_feedback ?? "");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load article";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
