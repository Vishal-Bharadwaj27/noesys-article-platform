// services/insights.service.ts

interface DateRange {
  start: string; // 'YYYY-MM'
  end: string; // 'YYYY-MM'
}

interface OptionBreakdown {
  label: string;
  count: number;
  sortOrder: number;
}

interface ParameterSummary {
  parameterId: string;
  parameterName: string;
  scopeType: "numeric" | "option";
  sortOrder: number;
  options?: OptionBreakdown[];
  numeric?: { avg: number; min: number; max: number; count: number };
}

interface ArticleTypeSummary {
  articleTypeId: string;
  articleTypeName: string;
  totalArticles: number;
  parameters: ParameterSummary[];
}

export async function getSummary(
  db: D1Database,
  range: DateRange,
): Promise<ArticleTypeSummary[]> {
  const articleTypes = await db
    .prepare(
      `SELECT id, name FROM article_types WHERE is_active = 1 ORDER BY name`,
    )
    .all();

  const result: ArticleTypeSummary[] = [];

  for (const at of articleTypes.results as any[]) {
    const totalRow = await db
      .prepare(
        `
      SELECT COUNT(*) as cnt
      FROM articles a
      WHERE a.article_type_id = ? AND a.month_year BETWEEN ? AND ?
    `,
      )
      .bind(at.id, range.start, range.end)
      .first<{ cnt: number }>();

    const params = await db
      .prepare(
        `
      SELECT id, name, scope_type, sort_order
      FROM parameters
      WHERE article_type_id = ? AND is_active = 1
      ORDER BY sort_order, name
    `,
      )
      .bind(at.id)
      .all();

    const parameterSummaries: ParameterSummary[] = [];

    for (const p of params.results as any[]) {
      if (p.scope_type === "option") {
        const rows = await db
          .prepare(
            `
          SELECT po.label AS label, po.sort_order AS sortOrder, COUNT(*) AS cnt
          FROM article_parameter_results apr
          JOIN articles a ON a.id = apr.article_id AND a.version = apr.version
          JOIN parameter_options po ON po.id = apr.option_id
          WHERE apr.parameter_id = ? AND a.month_year BETWEEN ? AND ?
          GROUP BY po.id
          ORDER BY po.sort_order
        `,
          )
          .bind(p.id, range.start, range.end)
          .all();

        parameterSummaries.push({
          parameterId: p.id,
          parameterName: p.name,
          scopeType: "option",
          sortOrder: p.sort_order,
          options: (rows.results as any[]).map((r) => ({
            label: r.label,
            count: r.cnt,
            sortOrder: r.sortOrder,
          })),
        });
      } else {
        const row = await db
          .prepare(
            `
          SELECT AVG(apr.numeric_value) AS avg, MIN(apr.numeric_value) AS min,
                 MAX(apr.numeric_value) AS max, COUNT(*) AS cnt
          FROM article_parameter_results apr
          JOIN articles a ON a.id = apr.article_id AND a.version = apr.version
          WHERE apr.parameter_id = ? AND a.month_year BETWEEN ? AND ?
        `,
          )
          .bind(p.id, range.start, range.end)
          .first<any>();

        parameterSummaries.push({
          parameterId: p.id,
          parameterName: p.name,
          scopeType: "numeric",
          sortOrder: p.sort_order,
          numeric: {
            avg: row?.avg ?? 0,
            min: row?.min ?? 0,
            max: row?.max ?? 0,
            count: row?.cnt ?? 0,
          },
        });
      }
    }

    result.push({
      articleTypeId: at.id,
      articleTypeName: at.name,
      totalArticles: totalRow?.cnt ?? 0,
      parameters: parameterSummaries,
    });
  }

  return result;
}

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

function enumerateMonths(start: string, end: string): string[] {
  const months: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

export async function getEmployeeSubmissions(
  db: D1Database,
  range: DateRange,
): Promise<EmployeeSubmissionsResult> {
  const months = enumerateMonths(range.start, range.end);

  const rowsRaw = await db
    .prepare(
      `
    SELECT u.id AS userId, u.name AS name, u.job_role AS jobRole,
           a.month_year AS monthYear, COUNT(*) AS cnt
    FROM articles a
    JOIN users u ON u.id = a.user_id
    WHERE a.month_year BETWEEN ? AND ?
    GROUP BY u.id, a.month_year
    ORDER BY u.name
  `,
    )
    .bind(range.start, range.end)
    .all();

  const byUser = new Map<string, EmployeeSubmissionRow>();
  const monthlyTotals: Record<string, number> = Object.fromEntries(
    months.map((m) => [m, 0]),
  );
  let grandTotal = 0;

  for (const r of rowsRaw.results as any[]) {
    if (!byUser.has(r.userId)) {
      byUser.set(r.userId, {
        userId: r.userId,
        name: r.name,
        jobRole: r.jobRole,
        monthly: Object.fromEntries(months.map((m) => [m, 0])),
        total: 0,
      });
    }
    const row = byUser.get(r.userId)!;
    row.monthly[r.monthYear] = r.cnt;
    row.total += r.cnt;
    monthlyTotals[r.monthYear] += r.cnt;
    grandTotal += r.cnt;
  }

  return {
    months,
    rows: Array.from(byUser.values()),
    monthlyTotals,
    grandTotal,
  };
}
