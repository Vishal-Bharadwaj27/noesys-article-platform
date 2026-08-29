import { useEffect, useState } from "react";
import { Collapse, Spin, Empty, ConfigProvider, Table, theme as antdTheme } from "antd";

interface OptionBreakdown { label: string; count: number; }
interface ParameterSummary {
  parameterId: string; parameterName: string; scopeType: "numeric" | "option";
  options?: OptionBreakdown[]; numeric?: { avg: number; min: number; max: number; count: number };
}
interface ArticleTypeSummary { articleTypeId: string; articleTypeName: string; totalArticles: number; parameters: ParameterSummary[]; }

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function SummaryView({ start, end }: { start: string; end: string }) {
  const [data, setData] = useState<ArticleTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/insights/summary?start=${start}&end=${end}`).then((res) => res.json()).then(setData).finally(() => setLoading(false));
  }, [start, end]);

  if (loading) return <Spin className="mt-10 flex justify-center" />;
  if (!data.length) return <Empty description="No data for this range" />;

  return (
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm, token: { colorPrimary: "#534ab7", borderRadius: 8 }, components: { Table: { headerBg: "#e2e8f0", headerColor: "#1e293b", headerSplitColor: "#cbd5e1" }, Collapse: { headerBg: "#e2e8f0", contentBg: "#ffffff" } } }}>
      <Collapse
        defaultActiveKey={data.map((d) => d.articleTypeId)}
        items={data.map((at) => ({
          key: at.articleTypeId,
          label: (
            <span className="font-medium text-slate-900">
              {at.articleTypeName} <span className="font-semibold text-slate-700">({at.totalArticles} articles)</span>
            </span>
          ),
          children: (
            <Table
              pagination={false}
              size="small"
              dataSource={at.parameters.map((p) => ({ key: p.parameterId, ...p }))}
              columns={[
                { title: "Parameter", dataIndex: "parameterName", key: "parameterName", width: 220, render: (v: string) => <span className="font-medium text-slate-800">{v}</span> },
                { title: "Type", dataIndex: "scopeType", key: "scopeType", width: 90, render: (v: string) => <span className="capitalize text-slate-600 text-sm">{v}</span> },
                {
                  title: "Details", key: "details", render: (_: any, r: ParameterSummary) =>
                    r.scopeType === "option"
                      ? <div className="flex flex-wrap gap-1.5">{r.options?.map((o) => <span key={o.label} className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">{o.label}: {o.count}</span>)}</div>
                      : <span className="text-sm text-slate-600">avg {r.numeric?.avg.toFixed(1)} · min {r.numeric?.min} · max {r.numeric?.max} · n={r.numeric?.count}</span>
                },
              ]}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" } as any}
            />
          ),
        }))}
      />
    </ConfigProvider>
  );
}
