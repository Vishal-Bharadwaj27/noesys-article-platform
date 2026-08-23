import React, { useEffect, useState } from "react";
import ArticlesTable from "../../components/articles/ArticlesTable";
import { ArticleSummary } from "../../components/articles/ArticlesRow";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AllArticles = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function fetchArticles(
    month?: string,
    status?: string,
  ): Promise<ArticleSummary[]> {
    const params = new URLSearchParams();

    if (month) params.set("month", month);
    if (status) params.set("status", status);

    const res = await fetch(
      `${BACKEND_URL}/api/articles?${params.toString()}`,
      {
        credentials: "include",
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch articles");
    }

    const json = await res.json();
    return json.data;
  }

  async function fetchArticle(id: string) {
    const res = await fetch(`${BACKEND_URL}/api/articles/${id}`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch article");
    }

    const json = await res.json();
    return json.data;
  }

  const loadArticles = async () => {
    try {
      setLoading(true);

      const data = await fetchArticles(month || undefined, status || undefined);

      setArticles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [month, status]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="m-5">
      <div className="text-3xl font-semibold mb-3">
        <h1>All Articles</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="rewrite_required">Rewrite Required</option>
          <option value="pending">Pending</option>
          
        </select>
      </div>
      <div>
        <ArticlesTable
          articles={articles}
          onRowClick={(id) => navigate(`/articles/${id}`)}
        />
      </div>
    </div>
  );
};

export default AllArticles;
