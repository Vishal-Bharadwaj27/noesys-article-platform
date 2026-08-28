// InsightsPage.tsx
import { EmployeeSubmissionsTable } from "@/admin/components/insights/EmployeeSubmissionsTable";
import { SummaryView } from "@/admin/components/insights/SummaryView";
import { MonthYearPicker } from "@/admin/components/ui/MonthYearPicker";
import { Select } from "antd";
import { useState } from "react";

const currentMonthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const InsightsPage = () => {
  const [insights, setInsights] = useState("Employee Submissions");
  const [start, setStart] = useState(currentMonthYear());
  const [end, setEnd] = useState(currentMonthYear());

  return (
    <div>
      <div className="m-5 flex items-center gap-3">
        <Select
          className="w-[20vw]"
          value={insights}
          onChange={setInsights}
          options={[
            { value: "Employee Submissions", label: "Employee Submissions" },
            { value: "Summary", label: "Summary" },
          ]}
        />
        <span>Start Date</span>
        <MonthYearPicker label="Start" value={start} onChange={setStart} />
        <span>End Date</span>
        <MonthYearPicker
          label="End"
          value={end}
          onChange={setEnd}
          minValue={start}
        />
      </div>

      <div className="m-5">
        {insights === "Summary" ? (
          <SummaryView start={start} end={end} />
        ) : (
          <EmployeeSubmissionsTable start={start} end={end} />
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
