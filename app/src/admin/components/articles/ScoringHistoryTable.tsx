import { HistoryItem } from "@/utils/types";
import { ConfigProvider, Table, Tag, Progress, theme as antdTheme } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function getAiScoreColorsHex(s: number) {
  if (s >= 10) return "#389e0d";
  if (s >= 6) return "#d48806";
  return "#cf1322";
}

function formatAiScore(s: number) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}


export default function ScoringHistoryTable({
  history,
  articleId,
}: {
  history: HistoryItem[];
  articleId: string;
}) {
  const navigate = useNavigate();
  const [cols, setCols] = useState<ColumnsType<HistoryItem>>([]);

  useEffect(() => {
    const columns: ColumnsType<HistoryItem> = [
      {
        title: "Version",
        dataIndex: "version",
        key: "version",
        width: 90,
        sorter: (a, b) => a.version - b.version,
        render: (v: number, r: HistoryItem) => (
          <span
            onClick={() =>
              navigate(`/admin/articles/${articleId}?version=${r.version}`)
            }
            style={{
              color: "#0284c7",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Aritcle Version {v}
          </span>
        ),
      },
      {
        title: "AI Score",
        dataIndex: "score",
        key: "score",
        width: 130,
        render: (s: number | null) =>
          s === null ? (
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              —
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Progress
                percent={Math.min(Math.max(s, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={getAiScoreColorsHex(s)}
                style={{ width: 56 }}
              />

              <span
                style={{
                  color: getAiScoreColorsHex(s),
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {formatAiScore(s)}
              </span>
            </span>
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (_: unknown, r: HistoryItem) => {
          const ds =
            r.score === null
              ? "scoring"
              : r.score === 10
                ? "accepted"
                : "rejected";

          const label =
            ds === "scoring"
              ? "Scoring..."
              : ds === "accepted"
                ? "Accepted"
                : "Rejected";

          return (
            <Tag
              color={
                ds === "accepted"
                  ? "green"
                  : ds === "rejected"
                    ? "red"
                    : "default"
              }
              style={{ fontSize: 13 }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: "Submitted",
        dataIndex: "submitted_at",
        key: "submitted_at",
        width: 160,
        sorter: (a, b) =>
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime(),
        render: (d: string) => (
          <span
            style={{
              color: "#334155",
              fontSize: 13,
            }}
          >
            {dayjs(d).format("MMM D, YYYY h:mm A")}
          </span>
        ),
      },
    ];

    setCols(columns);
  }, [articleId]);

  const handleResize =
    (idx: number) =>
    (_: unknown, { size }: { size: { width: number } }) =>
      setCols((cur) => {
        const n = [...cur];
        n[idx] = { ...n[idx], width: size.width };
        return n;
      });

  const merged = cols.map((c, i) => ({
    ...c,
    ...(typeof c.width === "number"
      ? {
          onHeaderCell: () => ({
            width: c.width,
            onResize: handleResize(i),
          }),
        }
      : {}),
  }));

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#111827",
          borderRadius: 8,
          colorText: "#111827",
          colorTextSecondary: "#374151",
          fontSize: 14,
          colorBgContainer: "#ffffff",
        },
        components: {
          Table: {
            headerBg: "#ffffff",
            headerColor: "#111827",
            headerSplitColor: "#d1d5db",
            borderColor: "#d1d5db",
            rowHoverBg: "#f9fafb",
            cellPaddingBlock: 14,
          },
        },
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #d1d5db",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1.5px solid #d1d5db",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Scoring History
          </span>

          <span
            style={{
              fontSize: 13,
              color: "#64748b",
            }}
          >
            {history.length} versions
          </span>
        </div>

        <Table<HistoryItem>
          columns={cols}
          dataSource={history}
          rowKey="version"
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No scoring history yet." }}
        />
      </div>
    </ConfigProvider>
  );
}
