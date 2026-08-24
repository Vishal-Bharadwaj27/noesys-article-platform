import { useEffect, useState, useCallback, useRef } from "react";
import { api, apiFull } from "../http-client";
import { type ArticleDetail, type ArticleDetailResponse } from "./useArticle";

export interface ArticleListItem {
  id: string;
  title: string;
  type: string;
  version: number;
  ai_score: number | null;
  ai_feedback?: string | null;
  status: string;
  created: string;
  authorName?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseMyArticlesOptions {
  month?: string;
  viewAll?: boolean;
  page?: number;
  limit?: number;
}

interface ArticleRow {
  article: Omit<ArticleListItem, "authorName">;
  author?: { id: string; name: string };
}

export function useMyArticles(options: UseMyArticlesOptions = {}) {
  const { month, viewAll = false, page, limit = 10 } = options;

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const latestArticlesRef = useRef<ArticleListItem[]>([]);
  const isPollingRef = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    latestArticlesRef.current = articles;
  }, [articles]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (viewAll) {
      params.set("viewAll", "true");
      params.set("page", String(page ?? 1));
      params.set("limit", String(limit));
    } else if (month) {
      params.set("month", month);
    }

    const query = params.toString();
    const path = `/articles/mine${query ? `?${query}` : ""}`;

    try {
      const result = await apiFull<ArticleRow[]>(path);
      setArticles(
        result.data.map((row) => ({
          ...row.article,
          authorName: row.author?.name,
        }))
      );
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load articles";
      setError(message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [viewAll, month, page, limit]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

useEffect(() => {
  const interval = setInterval(async () => {
    if (isPollingRef.current) return;

    const processingArticles = latestArticlesRef.current.filter(
      (article) =>
        article.status === "processing" ||
        article.status === "pending"
    );

    if (processingArticles.length === 0) return;

    isPollingRef.current = true;

    try {
      await Promise.all(
        processingArticles.map(async (article) => {
          try {
            const res = await api<ArticleDetailResponse>(
              `/articles/mine/${article.id}`
            );

            const updatedArticle = res.article;

            setArticles((prev) =>
              prev.map((currentArticle) =>
                currentArticle.id === updatedArticle.id
                  ? {
                      ...currentArticle,
                      status: updatedArticle.status,
                      ai_score: res.current_score,
                      ai_feedback: res.current_feedback,
                      version: updatedArticle.version,
                    }
                  : currentArticle
              )
            );
          } catch (error) {
            console.error(
              `Failed to poll article ${article.id}:`,
              error
            );
          }
        })
      );
    } finally {
      isPollingRef.current = false;
    }
  }, 3000);

  return () => clearInterval(interval);
}, []);


  return { articles, loading, error, pagination, refetch: fetchArticles };
}
