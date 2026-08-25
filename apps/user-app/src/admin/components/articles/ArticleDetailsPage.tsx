import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Skeleton,
  Empty,
  Descriptions,
  Timeline,
  Progress,
  message,
  Segmented,
  Divider,
  Modal,
} from "antd";
import {
  CopyOutlined,
  CheckOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { formatDate } from "@/admin/utils/date";

const syntaxTheme = oneDark as { [key: string]: CSSProperties };

const MarkdownCode: Components["code"] = ({
  className,
  children,
  ...props
}) => {
  const match = /language-(\w+)/.exec(className || "");

  if (match) {
    return (
      <SyntaxHighlighter style={syntaxTheme} language={match[1]} PreTag="div">
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const { Title, Text, Paragraph } = Typography;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type HistoryVersion = {
  id: string;
  article_id: string;
  version: number;
  title: string;
  content: string;
  ai_score: number | null;
  ai_feedback: string | null;
  submitted_at: string;
  scored_at: string | null;
  snapshotted_at: string;
};

type ArticleDetails = {
  id: string;
  title: string;
  content: string;
  status: string;
  ai_score: number | null;
  ai_feedback: string | null;
  version: number;
  submitted_at: string;
  author_name: string;
  author_email: string;
  job_role: string;
  history: HistoryVersion[];
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  approved: { color: "success", label: "Approved" },
  rewrite_required: { color: "error", label: "Rewrite required" },
  pending: { color: "warning", label: "Pending review" },
};

function StatusTag({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "default", label: status };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null) {
    return <Text type="secondary">Not scored</Text>;
  }
  const pct = Math.round((score / 10) * 100);
  const color = score >= 7 ? "#389e0d" : score >= 5 ? "#d48806" : "#cf1322";
  return (
    <Space align="center">
      <Progress
        type="circle"
        percent={pct}
        size={59}
        strokeColor={color}
        format={() => (
          <span style={{ fontSize: 14, fontWeight: 500 }}>{score} / 10</span>
        )}
      />
    </Space>
  );
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      message.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      message.error("Failed to copy");
    }
  };

  return (
    <Button
      size="small"
      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
      onClick={handleCopy}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

function ContentBlock({ content }: { content: string }) {
  const [view, setView] = useState<"rendered" | "raw">("rendered");

  return (
    <Card
      size="small"
      title="Content"
      extra={
        <Space>
          <Segmented
            size="small"
            value={view}
            onChange={(v) => setView(v as "rendered" | "raw")}
            options={[
              { label: "Rendered", value: "rendered" },
              { label: "Markdown", value: "raw" },
            ]}
          />
          <CopyButton text={content} />
        </Space>
      }
    >
      {view === "rendered" ? (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: MarkdownCode,

              h1: ({ children }) => (
                <h1
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: 700,
                    marginTop: "1.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    marginTop: "1.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p
                  style={{
                    marginBottom: "1rem",
                    lineHeight: 1.6,
                  }}
                >
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul
                  style={{
                    marginLeft: "1.5rem",
                    marginBottom: "1rem",
                    listStyleType: "disc",
                  }}
                >
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol
                  style={{
                    marginLeft: "1.5rem",
                    marginBottom: "1rem",
                    listStyleType: "decimal",
                  }}
                >
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li
                  style={{
                    marginBottom: "0.5rem",
                  }}
                >
                  {children}
                </li>
              ),

              strong: ({ children }) => (
                <strong
                  style={{
                    fontWeight: 600,
                  }}
                >
                  {children}
                </strong>
              ),

              em: ({ children }) => (
                <em
                  style={{
                    fontStyle: "italic",
                  }}
                >
                  {children}
                </em>
              ),

              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: "4px solid #d9d9d9",
                    paddingLeft: "1rem",
                    marginLeft: 0,
                    marginBottom: "1rem",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  {children}
                </blockquote>
              ),

              pre: ({ children }) => (
                <pre
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #444",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 13,
                    overflow: "auto",
                    marginBottom: "1rem",
                  }}
                >
                  {children}
                </pre>
              ),

              table: ({ children }) => (
                <div
                  style={{
                    overflowX: "auto",
                    marginBottom: "1rem",
                    maxWidth: "100%",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                    }}
                  >
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead style={{ background: "#f8fafc" }}>{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th
                  style={{
                    border: "1px solid #e2e8f0",
                    padding: "8px 12px",
                    fontWeight: 600,
                    textAlign: "left",
                    background: "#f8fafc",
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{ border: "1px solid #e2e8f0", padding: "8px 12px" }}
                >
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  style={{
                    color: "#1890ff",
                    textDecoration: "underline",
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <pre
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 6,
            padding: 12,
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </pre>
      )}
    </Card>
  );
}

export default function ArticleDetailsPage() {
  const { id } = useParams();

  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedVersion, setSelectedVersion] = useState<HistoryVersion | null>(
    null,
  );

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      setErrored(false);
      try {
        const res = await fetch(`${BACKEND_URL}/api/articles/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch article");
        }

        const json = await res.json();
        setArticle(json.data);
      } catch (err) {
        console.error(err);
        setErrored(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadArticle();
    }
  }, [id]);

  const allAttempts = useMemo(() => {
    if (!article) return [];
    return [...article.history].sort((a, b) =>
      sortOrder === "asc" ? a.version - b.version : b.version - a.version,
    );
  }, [article, sortOrder]);

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Card style={{ marginBottom: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (errored || !article) {
    return (
      <div style={{ maxWidth: 960, margin: "40px auto", padding: 24 }}>
        <Card>
          <Empty description="Article not found" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space
              style={{ width: "100%", justifyContent: "space-between" }}
              align="start"
            >
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                  {article.title}
                </Title>
                <Space size={8}>
                  <StatusTag status={article.status} />
                  <Tag>v{article.version}</Tag>
                </Space>
              </div>
              <ScoreDisplay score={article.ai_score} />
            </Space>

            <Divider style={{ margin: "8px 0" }} />

            <Descriptions size="small" column={2}>
              <Descriptions.Item
                label={
                  <Space size={4}>
                    <UserOutlined /> Author
                  </Space>
                }
              >
                {article.author_name}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space size={4}>
                    <MailOutlined /> Email
                  </Space>
                }
              >
                {article.author_email}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {article.job_role || "—"}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space size={4}>
                    <ClockCircleOutlined /> Submitted
                  </Space>
                }
              >
                {formatDate(article.submitted_at)}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>

        {/* Latest evaluation */}
        <Card
          size="small"
          title="Latest evaluation"
          extra={
            article.ai_feedback ? (
              <CopyButton text={article.ai_feedback} label="Copy feedback" />
            ) : null
          }
        >
          <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {article.ai_feedback ?? (
              <Text type="secondary">No feedback available</Text>
            )}
          </Paragraph>
          <div style={{ marginBottom: 0 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: MarkdownCode,

                h1: ({ children }) => (
                  <h3
                    style={{
                      marginTop: "1rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {children}
                  </h3>
                ),

                h2: ({ children }) => (
                  <h4
                    style={{
                      marginTop: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {children}
                  </h4>
                ),

                h3: ({ children }) => (
                  <h4
                    style={{
                      marginTop: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {children}
                  </h4>
                ),

                p: ({ children }) => (
                  <p
                    style={{
                      marginBottom: "0.75rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {children}
                  </p>
                ),

                ul: ({ children }) => (
                  <ul
                    style={{
                      marginLeft: "1.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol
                    style={{
                      marginLeft: "1.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {children}
                  </ol>
                ),

                li: ({ children }) => (
                  <li
                    style={{
                      marginBottom: "0.25rem",
                    }}
                  >
                    {children}
                  </li>
                ),

                strong: ({ children }) => (
                  <strong
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {children}
                  </strong>
                ),
                table: ({ children }) => (
                  <div
                    style={{
                      overflowX: "auto",
                      marginBottom: "0.75rem",
                      maxWidth: "100%",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.875rem",
                      }}
                    >
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead style={{ background: "#f8fafc" }}>{children}</thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                  <th
                    style={{
                      border: "1px solid #e2e8f0",
                      padding: "8px 12px",
                      fontWeight: 600,
                      textAlign: "left",
                      background: "#f8fafc",
                    }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    style={{ border: "1px solid #e2e8f0", padding: "8px 12px" }}
                  >
                    {children}
                  </td>
                ),
              }}
            >
              {article.ai_feedback ?? "No feedback available"}
            </ReactMarkdown>
          </div>
        </Card>

        {/* Content */}
        <ContentBlock content={article.content} />

        {/* History */}
        <Card
          size="small"
          title="Submission history"
          extra={
            <Segmented
              size="small"
              value={sortOrder}
              onChange={(v) => setSortOrder(v as "asc" | "desc")}
              options={[
                { label: <SortDescendingOutlined />, value: "desc" },
                { label: <SortAscendingOutlined />, value: "asc" },
              ]}
            />
          }
        >
          {allAttempts.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No submission history yet"
            />
          ) : (
            <Timeline
              items={allAttempts.map((item) => ({
                color:
                  item.ai_score === null
                    ? "gray"
                    : item.ai_score >= 7
                      ? "green"
                      : item.ai_score >= 5
                        ? "orange"
                        : "red",
                children: (
                  <Card
                    size="small"
                    hoverable
                    onClick={() => setSelectedVersion(item)}
                    style={{ marginBottom: 4, cursor: "pointer" }}
                  >
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Space size={8}>
                        <Text strong>Version {item.version}</Text>
                        <Tag
                          color={item.ai_score === null ? "default" : undefined}
                        >
                          {item.ai_score !== null
                            ? `${item.ai_score} / 10`
                            : "Not scored"}
                        </Tag>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDate(item.submitted_at)}
                      </Text>
                    </Space>
                    {item.ai_feedback && (
                      <Paragraph
                        style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                      >
                        {item.ai_feedback}
                      </Paragraph>
                    )}
                  </Card>
                ),
              }))}
            />
          )}
        </Card>

        <Modal
          open={selectedVersion !== null}
          onCancel={() => setSelectedVersion(null)}
          footer={null}
          width={720}
          title={
            selectedVersion
              ? `Version ${selectedVersion.version} — ${selectedVersion.title}`
              : ""
          }
        >
          {selectedVersion && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Space size={8}>
                <Tag
                  color={
                    selectedVersion.ai_score === null ? "default" : undefined
                  }
                >
                  {selectedVersion.ai_score !== null
                    ? `${selectedVersion.ai_score} / 10`
                    : "Not scored"}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Submitted {formatDate(selectedVersion.submitted_at)}
                </Text>
              </Space>

              <ContentBlock content={selectedVersion.content} />

              {selectedVersion.ai_feedback && (
                <Card size="small" title="Feedback">
                  <Paragraph
                    style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}
                  >
                    {selectedVersion.ai_feedback}
                  </Paragraph>
                  <div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: MarkdownCode,

                        h1: ({ children }) => (
                          <h4
                            style={{
                              marginTop: "0.75rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {children}
                          </h4>
                        ),

                        h2: ({ children }) => (
                          <h4
                            style={{
                              marginTop: "0.75rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {children}
                          </h4>
                        ),

                        h3: ({ children }) => (
                          <h4
                            style={{
                              marginTop: "0.75rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {children}
                          </h4>
                        ),

                        p: ({ children }) => (
                          <p
                            style={{
                              marginBottom: "0.75rem",
                              lineHeight: 1.6,
                            }}
                          >
                            {children}
                          </p>
                        ),

                        ul: ({ children }) => (
                          <ul
                            style={{
                              marginLeft: "1.5rem",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {children}
                          </ul>
                        ),

                        ol: ({ children }) => (
                          <ol
                            style={{
                              marginLeft: "1.5rem",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {children}
                          </ol>
                        ),

                        li: ({ children }) => (
                          <li
                            style={{
                              marginBottom: "0.25rem",
                            }}
                          >
                            {children}
                          </li>
                        ),

                        strong: ({ children }) => (
                          <strong
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {children}
                          </strong>
                        ),
                        table: ({ children }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              marginBottom: "0.75rem",
                              maxWidth: "100%",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "0.875rem",
                              }}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead style={{ background: "#f8fafc" }}>
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr>{children}</tr>,
                        th: ({ children }) => (
                          <th
                            style={{
                              border: "1px solid #e2e8f0",
                              padding: "8px 12px",
                              fontWeight: 600,
                              textAlign: "left",
                              background: "#f8fafc",
                            }}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td
                            style={{
                              border: "1px solid #e2e8f0",
                              padding: "8px 12px",
                            }}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {selectedVersion.ai_feedback}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </div>
  );
}
