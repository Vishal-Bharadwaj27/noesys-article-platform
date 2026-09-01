import { HistoryItem } from "@/hooks/useArticle";
import {
  ConfigProvider,
  Table,
  Tag,
  Progress,
  theme as antdTheme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Resizable } from "react-resizable";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function scoreColorHex(s: number) {
  if (s >= 10) return "#389e0d";
  if (s >= 6) return "#d48806";
  return "#cf1322";
}

function formatScore(s: number) {
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
            className="cursor-pointer text-[14px] font-semibold text-sky-600"
          >
            Article Version {v}
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
            <span className="text-[13px] text-slate-400">—</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Progress
                percent={Math.min(Math.max(s, 0), 10) * 10}
                size="small"
                showInfo={false}
                strokeColor={scoreColorHex(s)}
                className="w-[56px]"
              />
              <span
                className="text-[13px] font-semibold"
                style={{ color: scoreColorHex(s) }}
              >
                {formatScore(s)}
              </span>
            </span>
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (_: any, r: HistoryItem) => {
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
              className="text-[13px]"
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
          <span className="text-[13px] text-slate-700">
            {dayjs(d).format("MMM D, YYYY h:mm A")}
          </span>
        ),
      },
    ];

    setCols(columns);
  }, [articleId, navigate]);

  const handleResize =
    (idx: number) =>
    (_: any, { size }: { size: { width: number } }) =>
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
      <div className="overflow-hidden rounded-xl border-[1.5px] border-[#d1d5db] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b-[1.5px] border-[#d1d5db] px-5 py-[14px]">
          <span className="text-[15px] font-semibold text-[#111827]">
            Scoring History
          </span>
          <span className="text-[13px] text-slate-500">
            {history.length} versions
          </span>
        </div>

        <Table<HistoryItem>
          columns={merged}
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