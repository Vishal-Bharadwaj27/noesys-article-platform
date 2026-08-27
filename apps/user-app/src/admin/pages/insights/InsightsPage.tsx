import { Select } from "antd";
import { useState } from "react";

const InsightsPage = () => {
  const [insights, setInsights] = useState("Summary");
  return (
    <div>
      <div className="m-5">
        <Select
          className="w-[20vw]"
          value={insights}
          onChange={setInsights}
          options={[
            { value: "Summary", label: "Summary" },
            { value: "Employee Submissions", label: "Employee Submissions" },
          ]}
        />
      </div>

      
    </div>
  );
};

export default InsightsPage;
