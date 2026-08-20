import { useEffect, useState, useCallback } from "react";
import { apiFull } from "../http-client";

export interface ArticleListItem {
  id: string;
  title: string;
  type: string;
  version: number;
  ai_score: number | null;
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

interface ListResponse {
  data: ArticleRow[];
  pagination?: PaginationInfo;
}

export function useMyArticles(options: UseMyArticlesOptions = {}) {
  const { month, viewAll = false, page, limit = 10 } = options;

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });

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

  return { articles, loading, error, pagination, refetch: fetchArticles };
}