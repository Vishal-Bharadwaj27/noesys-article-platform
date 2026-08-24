import React, { useEffect, useState } from "react";
import ArticlesTable from "../../components/articles/ArticlesTable";
import { ArticleSummary } from "../../components/articles/ArticlesRow";
import { useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AllArticles = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const { id } = useParams();
  const [userName, setUserName] = useState<string>("");

  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const navigate = useNavigate();

  async function fetchArticles(
    month?: string,
    status?: string,
  ): Promise<ArticleSummary[]> {
    const params = new URLSearchParams();

    if (month) params.set("month", month);
    if (status) params.set("status", status);

    const res = await fetch(
      !id
        ? `${BACKEND_URL}/api/articles?${params.toString()}`
        : `${BACKEND_URL}/api/users/${id}/articles?${params.toString()}`,
      {
        credentials: "include",
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch articles");
    }

    const json = await res.json();

    if (json.user) {
      setUserName(json.user.name);
    }
    return json.data;
  }

  const loadArticles = async () => {
    const monthString = selectedMonth
      ? selectedMonth.format("YYYY-MM")
      : undefined;

    const data = await fetchArticles(monthString, status || undefined);

    setArticles(data);
  };

  useEffect(() => {
    loadArticles();
  }, [selectedMonth, id]);

  return (
    <div className="m-5">
      <div className="text-3xl font-semibold mb-3">
        <div className="text-3xl font-semibold mb-3">
          {id ? <h1>{userName}'s Articles</h1> : <h1>All Articles</h1>}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(date) => setSelectedMonth(date)}
          placeholder="Select month"
          className="w-[220px]"
        />
      </div>
      <div>
        <ArticlesTable
          articles={articles}
          onRowClick={(id) => navigate(`/admin/articles/${id}`)}
        />
      </div>
    </div>
  );
};

export default AllArticles;
