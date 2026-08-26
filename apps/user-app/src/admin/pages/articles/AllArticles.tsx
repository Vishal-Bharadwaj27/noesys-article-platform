import React, { useCallback, useEffect, useState } from "react";
import ArticlesTable from "../../components/articles/ArticlesTable";
import type {
  ArticleStatus,
  ArticleSummary,
} from "../../components/articles/ArticlesRow";
import { useNavigate, useParams } from "react-router-dom";
import { DatePicker, Select, Empty } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { api } from "@/http-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type ArticleTypeOption = {
  id: string;
  name: string;
};

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Statuses",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "rewrite_required",
    label: "Rewrite Required",
  },
];

const AllArticles = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  console.log("articles", articles);

  const [articleTypes, setArticleTypes] = useState<ArticleTypeOption[]>([]);

  const [userName, setUserName] = useState("");

  // Current month is the default.
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedType, setSelectedType] = useState("all");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchArticleTypes = useCallback(async () => {
    try {
      const response = await api<
        Array<{
          id: string;
          name: string;
        }>
      >("/article-types");

      setArticleTypes(
        response.map((type) => ({
          id: type.id,
          name: type.name,
        })),
      );
    } catch (err) {
      console.error("Failed to load article types:", err);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Always send month.
      params.set("month", selectedMonth.format("YYYY-MM"));

      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }

      if (selectedType !== "all") {
        params.set("type", selectedType);
      }

      const endpoint = id
        ? `${BACKEND_URL}/api/users/${id}/articles?${params.toString()}`
        : `${BACKEND_URL}/api/articles?${params.toString()}`;

      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch articles (${res.status})`);
      }

      const json = await res.json();

      if (json.user) {
        setUserName(json.user.name ?? "");
      }

      setArticles(json.data ?? []);
    } catch (err) {
      console.error("Failed to load articles:", err);

      setError(err instanceof Error ? err.message : "Failed to load articles");

      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [id, selectedMonth, selectedStatus, selectedType]);

  useEffect(() => {
    fetchArticleTypes();
  }, [fetchArticleTypes]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleMonthChange = (date: Dayjs | null) => {
    // Clearing the month resets it to current month.
    if (!date) {
      setSelectedMonth(dayjs().startOf("month"));
      return;
    }

    setSelectedMonth(date.startOf("month"));
  };
  console.log(articles)

  return (
    <div className="m-5">
      <div className="mb-5">
        <h1 className="text-3xl font-semibold">
          {id ? `${userName || "User"}'s Articles` : "All Articles"}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Showing articles for {selectedMonth.format("MMMM YYYY")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          allowClear
          placeholder="Select month"
          className="w-[220px]"
        />

        <Select
          value={selectedType}
          onChange={setSelectedType}
          className="w-[220px]"
          options={[
            {
              value: "all",
              label: "All Types",
            },
            ...articleTypes.map((type) => ({
              value: type.id,
              label: type.name,
            })),
          ]}
        />

        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-[220px]"
          options={STATUS_OPTIONS}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading articles...
        </div>
      ) : articles.length === 0 ? (
        <Empty
          description={`No articles found for ${selectedMonth.format(
            "MMMM YYYY",
          )}`}
        />
      ) : (
        <ArticlesTable
          articles={articles}
          onRowClick={(articleId) => navigate(`/admin/articles/${articleId}`)}
        />
      )}
    </div>
  );
};

export default AllArticles;
