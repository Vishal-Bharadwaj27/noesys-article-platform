import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, DatePicker, Table, Tag, Tooltip, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMyArticles, type ArticleListItem } from "../hooks/useMyArticles";
import { useAuth } from "../contexts/AuthContext";

type StatusBadge = { color: string; text: string };

function statusBadge(item: ArticleListItem): StatusBadge {
  if (item.ai_score !== null) {
    return { color: "green", text: "Scored" };
  }
  if (item.status === "pending") {
    return { color: "gold", text: "Pending" };
  }
  return { color: "default", text: item.status };
}

export default function MyArticles() {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const currentMonth = dayjs().format("YYYY-MM");
  const [month, setMonth] = useState<string>(currentMonth);
  const [viewAll, setViewAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { articles, loading, error, pagination } = useMyArticles({
    month: viewAll ? undefined : month,
    viewAll,
    page: viewAll ? currentPage : undefined,
    limit: 10,
  });

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error, message]);

  const columns: ColumnsType<ArticleListItem> = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (value: string, record) => (
          <button
            type="button"
            onClick={() => navigate(`/articles/${record.id}`)}
            className="text-left text-gray-800 hover:text-gray-900 font-medium hover:underline"
          >
            {value}
          </button>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        width: 160,
        render: (value: string) => (
          <span className="text-gray-600">{value}</span>
        ),
      },
      {
        title: "Version",
        dataIndex: "version",
        key: "version",
        width: 90,
        render: (value: number) => <span className="text-gray-600">v{value}</span>,
      },
      {
        title: "AI Score",
        dataIndex: "ai_score",
        key: "ai_score",
        width: 100,
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
        width: 120,
        render: (_, record) => {
          const badge = statusBadge(record);
          return <Tag color={badge.color}>{badge.text}</Tag>;
        },
      },
      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 140,
        render: (value: string) => (
          <span className="text-gray-500">
            {dayjs(value).format("MMM D, YYYY")}
          </span>
        ),
      },
    ],
    [navigate]
  );

  function handleMonthChange(date: dayjs.Dayjs | null) {
    if (date) {
      setMonth(date.format("YYYY-MM"));
    }
  }

  function handleToggleViewAll() {
    setViewAll((prev) => {
      if (!prev) {
        setCurrentPage(1);
      }
      return !prev;
    });
  }

  function handleLogout() {
    modal.confirm({
      title: "Log out",
      content: "Are you sure you want to log out?",
      okText: "Log out",
      cancelText: "Cancel",
      onOk: () => {
        logout();
        message.success("Logged out");
      },
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header line */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">My Articles</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-0.5">
                {user.name} &middot; {user.email}
              </p>
            )}
          </div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Filter line */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <DatePicker
              picker="month"
              value={month ? dayjs(month, "YYYY-MM") : null}
              onChange={handleMonthChange}
              disabled={viewAll}
              style={{ width: 192 }}
              allowClear={false}
              placeholder="Select month"
            />
            <Tooltip title="Switch between the selected month and all articles">
              <Button
                icon={<UnorderedListOutlined />}
                onClick={handleToggleViewAll}
              >
                {viewAll ? "Current Month" : "View All Articles"}
              </Button>
            </Tooltip>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/articles/new")}
          >
            Create New Article
          </Button>
        </div>

        {/* View context hint */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <CalendarOutlined />
          {viewAll ? (
            <span>
              Showing all articles across every month
              {pagination.total > 0 && ` (${pagination.total} total)`}
            </span>
          ) : (
            <span>Showing articles for {month}</span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={articles}
            rowKey="id"
            loading={loading}
            pagination={
              viewAll
                ? {
                    current: pagination?.page || 1,
                    pageSize: pagination?.limit || 10,
                    total: pagination?.total || 0,
                    onChange: (page) => setCurrentPage(page),
                    showSizeChanger: false,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total}`,
                  }
                : false
            }
            locale={{
              emptyText: loading ? (
                <Spin />
              ) : (
                <div className="py-10 text-gray-500">
                  {viewAll
                    ? "No articles found"
                    : `No articles for ${month}`}
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}