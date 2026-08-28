import { useEffect, useState } from "react";
import { Collapse, Spin, Empty, Tag } from "antd";

interface OptionBreakdown {
  label: string;
  count: number;
}
interface ParameterSummary {
  parameterId: string;
  parameterName: string;
  scopeType: "numeric" | "option";
  options?: OptionBreakdown[];
  numeric?: { avg: number; min: number; max: number; count: number };
}
interface ArticleTypeSummary {
  articleTypeId: string;
  articleTypeName: string;
  totalArticles: number;
  parameters: ParameterSummary[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function SummaryView({ start, end }: { start: string; end: string }) {
  const [data, setData] = useState<ArticleTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/insights/summary?start=${start}&end=${end}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [start, end]);

  if (loading) return <Spin className="mt-10 flex justify-center" />;
  if (!data.length) return <Empty description="No data for this range" />;

  return (
    <Collapse
      defaultActiveKey={data.map((d) => d.articleTypeId)}
      items={data.map((at) => ({
        key: at.articleTypeId,
        label: (
          <span className="font-medium">
            {at.articleTypeName}{" "}
            <span className="font-normal text-gray-400">
              ({at.totalArticles} articles)
            </span>
          </span>
        ),
        children: (
          <div className="flex flex-col gap-3">
            {at.parameters.map((p) => (
              <div key={p.parameterId}>
                <div className="mb-1 text-sm font-medium">
                  {p.parameterName}
                </div>
                {p.scopeType === "option" ? (
                  <div className="flex flex-wrap gap-2">
                    {p.options?.map((o) => (
                      <Tag key={o.label}>
                        {o.label}: {o.count}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    avg {p.numeric?.avg.toFixed(1)} · min {p.numeric?.min} · max{" "}
                    {p.numeric?.max} · n={p.numeric?.count}
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
      }))}
    />
  );
}
