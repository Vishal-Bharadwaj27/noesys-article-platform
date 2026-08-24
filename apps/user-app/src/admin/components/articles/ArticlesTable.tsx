import { useState } from "react";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

const { Text } = Typography;

export type ArticleStatus = "approved" | "rewrite_required" | "pending";

export type ArticleSummary = {
  id: string;
  title: string;
  type: string;
  version: number;
  ai_score: number | null;
  status: ArticleStatus;
  created_at: string;
  author_name: string;
};

type ArticlesTableProps = {
  articles: ArticleSummary[];
  onRowClick?: (id: string) => void;
};

const STATUS_CONFIG: Record<
  ArticleStatus,
  { color: string; label: string; icon?: boolean }
> = {
  approved: { color: "green", label: "Approved" },
  rewrite_required: { color: "red", label: "Rewrite required" },
  pending: { color: "gold", label: "Pending", icon: true },
};

function scoreColor(score: number) {
  if (score >= 8) return "#389e0d";
  if (score >= 6) return "#d48806";
  return "#cf1322";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ResizeableTitleProps {
  onResize?: (
    e: React.SyntheticEvent<Element>,
    data: { size: { width: number; height: number } },
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
      draggableOpts={{ enableUserSelectHack: false }}
      handle={
        <span
          className="column-resize-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
    >
      <th {...restProps}>{children}</th>
    </Resizable>
  );
};

function ArticlesTableInner({ articles, onRowClick }: ArticlesTableProps) {
  const [columns, setColumns] = useState<ColumnsType<ArticleSummary>>([
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 320,
      render: (title: string) => (
        <Text
          style={{ color: "var(--ant-color-link, #2f54eb)", fontWeight: 500 }}
        >
          {title}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: string) => <Tag bordered={false}>{type}</Tag>,
      filters: Array.from(new Set(articles.map((a) => a.type))).map((t) => ({
        text: t,
        value: t,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 95,
      render: (v: number) => <Text type="secondary">v{v}</Text>,
      sorter: (a, b) => a.version - b.version,
    },
    {
      title: "Author",
      dataIndex: "author_name",
      key: "author_name",
      width: 180,
      render: (name: string) => (
        <Space size={8}>
          <Avatar
            size={24}
            style={{ backgroundColor: "#7f77dd", fontSize: 11 }}
          >
            {initials(name)}
          </Avatar>
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: "AI score",
      dataIndex: "ai_score",
      key: "ai_score",
      width: 160,
      sorter: (a, b) => (a.ai_score ?? -1) - (b.ai_score ?? -1),
      render: (score: number | null) =>
        score === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <Space size={8} align="center">
            <Progress
              percent={(Math.min(score, 10) / 10) * 100}
              size="small"
              showInfo={false}
              strokeColor={scoreColor(score)}
              style={{ width: 56 }}
            />
            <Text strong style={{ color: scoreColor(score), fontSize: 12 }}>
              {score}
            </Text>
          </Space>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Rewrite required", value: "rewrite_required" },
        { text: "Pending", value: "pending" },
      ],
      render: (status: ArticleStatus) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <Tag
            color={cfg.color}
            icon={cfg.icon ? <ClockCircleOutlined /> : undefined}
          >
            {cfg.label}
          </Tag>
        );
      },
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (d: string) => <Text type="secondary">{formatDate(d)}</Text>,
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: "descend",
    },
  ]);

  const handleResize =
    (index: number) =>
      (
        _: React.SyntheticEvent<Element>,
        { size }: { size: { width: number; height: number } },
      ) => {
        const nextColumns = [...columns];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        setColumns(nextColumns);
      };

  const mergedColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: () => ({
      width: col.width,
      onResize: handleResize(index),
    }),
  }));

  return (
    <div
      style={{
        background: "var(--ant-color-bg-container)",
        border: "1px solid var(--ant-color-border-secondary)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--ant-color-border-secondary)",
        }}
      >
        <Text strong style={{ fontSize: 15 }}>
          Articles
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {articles.length} total
        </Text>
      </div>

      <Table<ArticleSummary>
        components={{
          header: {
            cell: ResizeableTitle,
          },
        }}
        columns={mergedColumns}
        dataSource={articles}
        rowKey="id"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record.id),
          style: { cursor: onRowClick ? "pointer" : "default" },
        })}
        locale={{
          emptyText: <Empty description="No articles found" />,
        }}
      />
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
      }}
    >
      <ArticlesTableInner {...props} />
    </ConfigProvider>
  );
}
