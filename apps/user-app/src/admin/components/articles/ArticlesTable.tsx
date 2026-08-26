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
  Input,
  Card,
  Row,
  Col,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { ClockCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

import type { ArticleStatus, ArticleSummary } from "./ArticlesRow";
import { useParams } from "react-router-dom";

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
    label: "Approved",
  },
  rewrite_required: {
    color: "red",
    label: "Rewrite required",
  },
  pending: {
    color: "gold",
    label: "Pending",
    icon: true,
  },
  failed: {
    color: "blue",
    label: "failed",
  },
};

function scoreColor(score: number) {
  if (score >= 8) return "#389e0d";
  if (score >= 6) return "#d48806";
  return "#cf1322";
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

function ArticleParameters({
  parameters,
}: {
  parameters: ArticleSummary["parameters"];
}) {
  if (!parameters?.length) {
    return <Text type="secondary">—</Text>;
  }

  return (
    <Space wrap size={[4, 4]}>
      {parameters.map((parameter) => (
        <Tag
          key={parameter.parameterId}
          bordered={false}
          style={{
            marginInlineEnd: 0,
            fontSize: 11,
          }}
        >
          {parameter.parameterName}: {parameter.value}
        </Tag>
      ))}
    </Space>
  );
}

function ArticlesTableInner({ articles, onRowClick }: ArticlesTableProps) {
  const [columns, setColumns] = useState<ColumnsType<ArticleSummary>>([]);

  const { id } = useParams();

  const [titleFilter, setTitleFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");

  const [visibleRows, setVisibleRows] = useState<ArticleSummary[]>(articles);

  useEffect(() => {
    setVisibleRows(articles);
  }, [articles]);

  const locallyFilteredArticles = useMemo(() => {
    const normalizedTitle = titleFilter.trim().toLowerCase();
    const normalizedAuthor = authorFilter.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesTitle =
        !normalizedTitle ||
        article.title.toLowerCase().includes(normalizedTitle);

      const matchesAuthor =
        !normalizedAuthor ||
        article.author_name.toLowerCase().includes(normalizedAuthor);

      return matchesTitle && matchesAuthor;
    });
  }, [articles, titleFilter, authorFilter]);

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
    const initialColumns: ColumnsType<ArticleSummary> = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        ellipsis: true,
        width: 300,
        filterIcon: () => <SearchOutlined />,
        render: (title: string) => (
          <Text
            style={{
              color: "var(--ant-color-link, #2f54eb)",
              fontWeight: 500,
            }}
          >
            {title}
          </Text>
        ),
      },

      {
        title: "Author",
        dataIndex: "author_name",
        key: "author_name",
        width: 190,
        ellipsis: true,
        render: (name: string) => (
          <Space size={8}>
            <Avatar
              size={26}
              style={{
                backgroundColor: "#7f77dd",
                fontSize: 11,
              }}
            >
              {initials(name)}
            </Avatar>

            <Text ellipsis>{name}</Text>
          </Space>
        ),
      },

      {
        title: "Type",
        dataIndex: "article_type_name",
        key: "type",
        width: 170,
        render: (type: string) => <Tag bordered={false}>{type}</Tag>,
      },

      {
        title: "Parameters",
        dataIndex: "parameters",
        key: "parameters",
        width: 320,
        render: (parameters: ArticleSummary["parameters"]) => (
          <ArticleParameters parameters={parameters} />
        ),
      },

      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 155,
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
      },

      {
        title: "Version",
        dataIndex: "version",
        key: "version",
        width: 105,
        render: (version: number) => <Text type="secondary">v{version}</Text>,
        // sorter: (a, b) =>
        //   a.version - b.version,
      },

      {
        title: "AI Score",
        dataIndex: "ai_score",
        key: "ai_score",
        // width: 165,
        // sorter: (a, b) =>
        //   (a.ai_score ?? -1) -
        //   (b.ai_score ?? -1),
        render: (score: number | null) =>
          score === null ? (
            <Text type="secondary">—</Text>
          ) : (
            <Space size={8} align="center">
              <Progress
                percent={Math.min(Math.max(score, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={scoreColor(score)}
                style={{
                  width: 56,
                }}
              />

              <Text
                strong
                style={{
                  color: scoreColor(score),
                  fontSize: 12,
                }}
              >
                {score}
              </Text>
            </Space>
          ),
      },

      {
        title: "Created",
        dataIndex: "submitted_at",
        key: "created_at",
        width: 135,
        render: (date: string) => (
          <Text type="secondary">{formatDate(date)}</Text>
        ),
        // sorter: (a, b) =>
        //   new Date(a.created_at).getTime() -
        //   new Date(b.created_at).getTime(),
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
      {/* Dashboard */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small">
            <Text type="secondary">Total Articles</Text>

            <div className="text-2xl font-semibold mt-1">{dashboard.total}</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={5}>
          <Card size="small">
            <Text type="secondary">Approved</Text>

            <div className="text-2xl font-semibold text-emerald-600 mt-1">
              {dashboard.approved}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={5}>
          <Card size="small">
            <Text type="secondary">Pending</Text>

            <div className="text-2xl font-semibold text-amber-600 mt-1">
              {dashboard.pending}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={5}>
          <Card size="small">
            <Text type="secondary">Rewrite Required</Text>

            <div className="text-2xl font-semibold text-red-600 mt-1">
              {dashboard.rewriteRequired}
            </div>
          </Card>
        </Col>

        {/* <Col xs={24} sm={12} md={8} lg={5}>
          <Card size="small">
            <Text type="secondary">Average AI Score</Text>

            <div className="text-2xl font-semibold mt-1">
              {dashboard.averageScore === null
                ? "—"
                : dashboard.averageScore.toFixed(1)}
            </div>
          </Card>
        </Col> */}
      </Row>

      {/* Local search */}
      <div className="flex flex-wrap gap-3">
        <Input
          allowClear
          value={titleFilter}
          onChange={(event) => setTitleFilter(event.target.value)}
          placeholder="Search title..."
          prefix={<SearchOutlined />}
          className="w-[240px]"
        />

        {!id && (
          <Input
            allowClear
            value={authorFilter}
            onChange={(event) => setAuthorFilter(event.target.value)}
            placeholder="Search author..."
            prefix={<SearchOutlined />}
            className="w-[240px]"
          />
        )}
      </div>

      {/* Table */}
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
            {visibleRows.length} shown
          </Text>
        </div>

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
          scroll={{
            x: "max-content",
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record.id),
            style: {
              cursor: onRowClick ? "pointer" : "default",
            },
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
      }}
    >
      <ArticlesTableInner {...props} />
    </ConfigProvider>
  );
}
