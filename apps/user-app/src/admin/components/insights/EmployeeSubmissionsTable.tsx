import { useEffect, useState } from "react";
import { Table, Spin, ConfigProvider, theme as antdTheme } from "antd";
import type { ColumnsType } from "antd/es/table";

interface EmployeeSubmissionRow {
  userId: string;
  name: string;
  jobRole: string;
  monthly: Record<string, number>;
  total: number;
}
interface EmployeeSubmissionsResult {
  months: string[];
  rows: EmployeeSubmissionRow[];
  monthlyTotals: Record<string, number>;
  grandTotal: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTH_LABELS[Number(m) - 1]}-${y.slice(2)}`;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function EmployeeSubmissionsTable({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const [data, setData] = useState<EmployeeSubmissionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${BACKEND_URL}/api/insights/employee-submissions?start=${start}&end=${end}`,
    )
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [start, end]);

  if (loading) return <Spin className="mt-10 flex justify-center" />;
  if (!data) return null;

  const columns: ColumnsType<EmployeeSubmissionRow> = [
    { title: "Name", dataIndex: "name", fixed: "left", width: 180 },
    { title: "Department", dataIndex: "jobRole", width: 120 },
    ...data.months.map((m) => ({
      title: formatMonth(m),
      dataIndex: ["monthly", m],
      width: 80,
      align: "center" as const,
      render: (val: number) => val || "-",
    })),
    {
      title: "Total",
      dataIndex: "total",
      fixed: "right",
      width: 80,
      align: "center" as const,
    },
  ];

  return (
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm, token: { colorPrimary: "#534ab7", borderRadius: 8 }, components: { Table: { headerBg: "#e2e8f0", headerColor: "#1e293b", headerSplitColor: "#cbd5e1" } } }}>
    <div style={{ background: "var(--ant-color-bg-container)", border: "1px solid var(--ant-color-border-secondary)", borderRadius: 12, overflow: "hidden" }}>
    <Table
      rowKey="userId"
      columns={columns}
      dataSource={data.rows}
      pagination={false}
      scroll={{ x: "max-content" }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>{data.rows.length} employees</Table.Summary.Cell>
            {data.months.map((m, i) => (<Table.Summary.Cell key={m} index={i + 2} align="center">{data.monthlyTotals[m]}</Table.Summary.Cell>))}
            <Table.Summary.Cell index={data.months.length + 2} align="center">{data.grandTotal}</Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
    </div>
    </ConfigProvider>
  );
}
