import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Input, Spin, Table, Tag, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, EditOutlined, CloseOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useArticle, type HistoryItem } from "../hooks/useArticle";
import { api } from "../http-client";

function historyStatus(status: string): string {
  return status === "approved" ? "green" : status === "rewrite_required" ? "gold" : "default";
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { article, history, currentScore, currentFeedback, loading, error, refetch } =
    useArticle(id ?? "");

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      modal.error({
        title: "Unable to load article",
        content: error,
        onOk: () => navigate("/"),
      });
    }
  }, [error, modal, navigate]);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    }
  }, [article]);

  const historyColumns: ColumnsType<HistoryItem> = [
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
      render: (value: number) => <span className="font-medium">v{value}</span>,
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      width: 120,
      render: (value: number | null) =>
        value !== null ? (
          <span className="font-semibold text-gray-800">{value.toFixed(1)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: string) => <Tag color={historyStatus(value)}>{value}</Tag>,
    },
    {
      title: "Submitted",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (value: string) => (
        <span className="text-gray-500">{dayjs(value).format("MMM D, YYYY h:mm A")}</span>
      ),
    },
  ];

  async function handleSubmitRewrite() {
    if (!article) {
      return;
    }
    if (!title.trim() || !content.trim()) {
      message.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/articles`, {
        method: "POST",
        body: JSON.stringify({
          id: article.id,
          article_type_id: article.article_type_id,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      message.success("Rewrite submitted");
      setEditing(false);
      refetch();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to submit rewrite");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-900 !-ml-2 mb-6"
        >
          Back to Articles
        </Button>

        <div className="flex items-start justify-between gap-4 mb-6">
          {editing ? (
            <Input
              size="large"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="text-lg font-medium"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-800 leading-snug">
              {article?.title}
            </h1>
          )}

          {editing ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                icon={<CloseOutlined />}
                onClick={() => {
                  setEditing(false);
                  if (article) {
                    setTitle(article.title);
                    setContent(article.content);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={submitting}
                onClick={handleSubmitRewrite}
              >
                Submit Rewrite
              </Button>
            </div>
          ) : (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              className="shrink-0"
            >
              Rewrite Article
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <Card
            className="!rounded-2xl border-gray-200 shadow-sm"
            title={
              <div className="flex items-center gap-4">
                <span className="text-gray-800">Article</span>
                {article && (
                  <Tag className="ml-auto">{article.article_type_name}</Tag>
                )}
              </div>
            }
          >
            {editing ? (
              <Input.TextArea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Article content"
              />
            ) : (
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {article?.content}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Current Score
                </p>
                <p className="text-3xl font-semibold text-gray-800">
                  {currentScore !== null ? currentScore.toFixed(1) : "—"}
                  <span className="text-base text-gray-400 font-normal"> / 10</span>
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Feedback
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {currentFeedback || "No feedback available yet."}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="!rounded-2xl border-gray-200 shadow-sm"
            title={<span className="text-gray-800">Scoring History</span>}
          >
            <Table
              columns={historyColumns}
              dataSource={history}
              rowKey="version"
              pagination={false}
              locale={{ emptyText: "No scoring history yet." }}
              size="small"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}