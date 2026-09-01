import { useEffect, useMemo, useState } from "react";
import {
  ConfigProvider,
  theme as antdTheme,
  Table,
  Tag,
  Avatar,
  Progress,
  Typography,
  Space,
  Empty,
  Card,
  Row,
  Col,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Search } from "lucide-react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import type { ArticleStatus, ArticleSummary } from "./ArticlesRow";

const { Text } = Typography;

type ArticlesTableProps = {
  articles: ArticleSummary[];
  onRowClick?: (id: string) => void;
};

const STATUS_CONFIG: Record<
  ArticleStatus,
  { color: string; label: string; icon?: boolean }
> = {
  approved: {
    color: "green",
    label: "Accepted",
  },
  rewrite_required: {
    color: "red",
    label: "Rejected",
  },
  pending: {
    color: "gold",
    label: "Pending",
    icon: true,
  },
  failed: {
    color: "orange",
    label: "Failed",
  },
};

function scoreColor(score: number) {
  if (score >= 10) return "#389e0d";
  if (score >= 6) return "#d48806";
  return "#cf1322";
}

function scoreTextClass(score: number) {
  if (score >= 10) return "text-[#389e0d]";
  if (score >= 6) return "text-[#d48806]";
  return "text-[#cf1322]";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ResizeableTitleProps {
  onResize?: (
    e: React.SyntheticEvent<Element>,
    data: {
      size: {
        width: number;
        height: number;
      };
    },
  ) => void;

  width?: number | string;
  children?: React.ReactNode;
}

const ResizeableTitle = ({
  onResize,
  width,
  children,
  ...restProps
}: ResizeableTitleProps & React.HTMLAttributes<HTMLTableHeaderCellElement>) => {
  if (!width || typeof width !== "number") {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <Resizable
      width={width}
      height={10}
      onResize={onResize}
      draggableOpts={{
        enableUserSelectHack: false,
      }}
      handle={
        <span
          className="column-resize-handle"
          onClick={(event) => event.stopPropagation()}
        />
      }
    >
      <th {...restProps}>{children}</th>
    </Resizable>
  );
};

function ArticlesTableInner({ articles, onRowClick }: ArticlesTableProps) {
  const [columns, setColumns] = useState<ColumnsType<ArticleSummary>>([]);

  const [titleFilter, setTitleFilter] = useState("");

  const [visibleRows, setVisibleRows] = useState<ArticleSummary[]>(articles);

  useEffect(() => {
    setVisibleRows(articles);
  }, [articles]);

  const locallyFilteredArticles = useMemo(() => {
    const normalizedTitle = titleFilter.trim().toLowerCase();

    if (!normalizedTitle) return articles;

    return articles.filter((article) =>
      article.title.toLowerCase().includes(normalizedTitle),
    );
  }, [articles, titleFilter]);

  useEffect(() => {
    setVisibleRows(locallyFilteredArticles);
  }, [locallyFilteredArticles]);

  const dashboard = useMemo(() => {
    const total = visibleRows.length;

    const approved = visibleRows.filter(
      (article) => article.status === "approved",
    ).length;

    const pending = visibleRows.filter(
      (article) => article.status === "pending",
    ).length;

    const rewriteRequired = visibleRows.filter(
      (article) => article.status === "rewrite_required",
    ).length;

    const scored = visibleRows.filter((article) => article.ai_score !== null);

    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, article) => sum + (article.ai_score ?? 0), 0) /
          scored.length
        : null;

    return {
      total,
      approved,
      pending,
      rewriteRequired,
      averageScore,
    };
  }, [visibleRows]);

  useEffect(() => {
    const fs = 13;

    const initialColumns: ColumnsType<ArticleSummary> = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        width: 340,
        render: (title: string) => (
          <Text
            className="font-medium text-[13px] text-[var(--ant-color-link,#2f54eb)]"
          >
            {title}
          </Text>
        ),
      },
      {
        title: "Author",
        dataIndex: "author_name",
        key: "author_name",
        width: 160,
        render: (name: string) => (
          <Space size={8}>
            <Avatar size={26} className="bg-[#7f77dd] text-[11px]">
              {initials(name)}
            </Avatar>

            <Text className="text-[13px]">
              {name}
            </Text>
          </Space>
        ),
      },
      {
        title: "Type",
        dataIndex: "article_type_name",
        key: "type",
        width: 130,
        render: (type: string) => (
          <Tag bordered={false} className="text-[13px]">
            {type}
          </Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 115,
        render: (status: ArticleStatus) => {
          const cfg = STATUS_CONFIG[status];

          return (
            <Tag
              color={cfg.color}
              icon={cfg.icon ? <ClockCircleOutlined /> : undefined}
              className="text-[13px]"
            >
              {cfg.label}
            </Tag>
          );
        },
      },
      {
        title: "Version",
        dataIndex: "version",
        key: "version",
        width: 85,
        render: (version: number) => (
          <Text className="text-[13px]">v{version}</Text>
        ),
      },
      {
        title: "AI Score",
        dataIndex: "ai_score",
        key: "ai_score",
        width: 130,
        render: (score: number | null) =>
          score === null ? (
            <Text className="text-[13px]">—</Text>
          ) : (
            <Space size={8} align="center">
              <Progress
                percent={Math.min(Math.max(score, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={scoreColor(score)}
                className="w-[56px]"
              />

              <Text strong className={`text-[13px] ${scoreTextClass(score)}`}>
                {score}
              </Text>
            </Space>
          ),
      },
      {
        title: "Created",
        dataIndex: "submitted_at",
        key: "created_at",
        width: 125,
        render: (date: string) => (
          <Text className="text-[13px]">{formatDate(date)}</Text>
        ),
        defaultSortOrder: "descend",
      },
    ];

    setColumns(initialColumns);
  }, []);

  const handleResize =
    (index: number) =>
    (
      _: React.SyntheticEvent<Element>,
      {
        size,
      }: {
        size: {
          width: number;
          height: number;
        };
      },
    ) => {
      setColumns((current) => {
        const next = [...current];

        next[index] = {
          ...next[index],
          width: size.width,
        };

        return next;
      });
    };

  const mergedColumns = columns.map((column, index) => ({
    ...column,
    ...(typeof column.width === "number"
      ? {
          onHeaderCell: () => ({
            width: column.width,
            onResize: handleResize(index),
          }),
        }
      : {}),
  }));

  const handleTableChange: TableProps<ArticleSummary>["onChange"] = (
    _,
    __,
    ___,
    extra,
  ) => {
    setVisibleRows(extra.currentDataSource ?? locallyFilteredArticles);
  };

  return (
    <div className="space-y-4">
      {/* Dashboard - full width, reduced height */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card size="small" className="[&_.ant-card-body]:!p-[10px_14px]">
            <Text type="secondary" className="text-[12px]">
              Total Articles
            </Text>

            <div className="mt-0.5 text-xl font-semibold">
              {dashboard.total}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Card size="small" className="[&_.ant-card-body]:!p-[10px_14px]">
            <Text type="secondary" className="text-[12px]">
              Accepted
            </Text>

            <div className="mt-0.5 text-xl font-semibold text-emerald-600">
              {dashboard.approved}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Card size="small" className="[&_.ant-card-body]:!p-[10px_14px]">
            <Text type="secondary" className="text-[12px]">
              Pending
            </Text>

            <div className="mt-0.5 text-xl font-semibold text-amber-600">
              {dashboard.pending}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Card size="small" className="[&_.ant-card-body]:!p-[10px_14px]">
            <Text type="secondary" className="text-[12px]">
              Rejected
            </Text>

            <div className="mt-0.5 text-xl font-semibold text-red-600">
              {dashboard.rewriteRequired}
            </div>
          </Card>
        </Col>
      </Row>

      <div>
        <div className="mb-4 flex w-full items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Search title..."
              className="h-9 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--ant-color-border-secondary)] bg-[var(--ant-color-bg-container)]">
        <div className="flex items-center justify-between border-b border-[var(--ant-color-border-secondary)] px-5 py-4"></div>

        <Table<ArticleSummary>
          components={{
            header: {
              cell: ResizeableTitle,
            },
          }}
          columns={mergedColumns}
          dataSource={locallyFilteredArticles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            hideOnSinglePage: true,
          }}
          scroll={{ x: 1085 }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record.id),
            className: onRowClick ? "cursor-pointer" : "cursor-default",
          })}
          locale={{
            emptyText: <Empty description="No articles found" />,
          }}
        />
      </div>
    </div>
  );
}

export default function ArticlesTable(props: ArticlesTableProps) {
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#534ab7",
          borderRadius: 8,
        },
        components: {
          Table: {
            headerBg: "#e2e8f0",
            headerColor: "#1e293b",
            headerSplitColor: "#cbd5e1",
          },
        },
      }}
    >
      <ArticlesTableInner {...props} />
    </ConfigProvider>
  );
}
