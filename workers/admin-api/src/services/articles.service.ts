export type ArticleListItem = {
  id: string;
  title: string;
  status: string;
  ai_score: number | null;
  version: number;
  month_year: string;
  submitted_at: string;
  user_id: string;
  article_type_name: string;
  user_name: string;
  email: string;
  job_role: string;
};
 
export async function getArticles(
  db: D1Database,
  month?: string,
  status?: string,
  type?: string,
) {
  const conditions: string[] = [];
  const params: unknown[] = [];
 
  if (month) {
    conditions.push("a.month_year = ?");
    params.push(month);
  }
 
  if (status) {
    conditions.push("a.status = ?");
    params.push(status);
  }
 
  if (type) {
    conditions.push("a.article_type_id = ?");
    params.push(type);
  }
 
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
 
  const sql = `
    SELECT
      a.id,
      a.title,
      a.status,
      a.ai_score,
      a.version,
      a.submitted_at,
 
      u.id AS user_id,
      u.name AS author_name,
 
      at.id AS article_type_id,
      at.name AS article_type_name,
 
      json_group_array(
        CASE
          WHEN p.id IS NOT NULL THEN
            json_object(
              'parameterId', p.id,
              'parameterName', p.name,
              'scopeType', p.scope_type,
              'value', apr.value
            )
        END
      ) AS parameters
 
    FROM articles a
 
    JOIN users u
      ON u.id = a.user_id
 
    JOIN article_types at
      ON at.id = a.article_type_id
 
    LEFT JOIN article_parameter_results apr
      ON apr.article_id = a.id
      AND apr.version = a.version
 
    LEFT JOIN parameters p
      ON p.id = apr.parameter_id
 
    ${whereClause}
 
    GROUP BY
      a.id,
      u.id,
      at.id
 
    ORDER BY a.submitted_at DESC
  `;
 
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();
 
  return result.results.map((row: any) => ({
    ...row,
    parameters: row.parameters
      ? JSON.parse(row.parameters).filter(Boolean)
      : [],
  }));
}
 
export async function getArticleById(
  db: D1Database,
  id: string,
): Promise<any | null> {
  return db
    .prepare(
      `
      SELECT
  a.*,
  at.name AS article_type_name,
  u.name AS author_name,
  u.email AS author_email,
  u.job_role
FROM articles a
INNER JOIN users u
  ON a.user_id = u.id
INNER JOIN article_types at
  ON at.id = a.article_type_id
WHERE a.id = ?
      `,
    )
    .bind(id)
    .first();
}
 
export async function getArticleHistory(db: D1Database, articleId: string) {
  const result = await db
    .prepare(
      `
      SELECT
        id,
        article_id,
        version,
        title,
        content,
        ai_score,
        ai_feedback,
        submitted_at,
        scored_at,
        snapshotted_at
      FROM article_history
      WHERE article_id = ?
      ORDER BY version ASC
      `,
    )
    .bind(articleId)
    .all();
 
  return result.results;
}
 
function currentMonthYear() {
  return new Date().toISOString().slice(0, 7);
}
 
export async function getArticleStats(db: D1Database, month?: string) {
  const targetMonth = month || currentMonthYear();
 
  const sql = `
    SELECT
 
      COUNT(*) AS total_articles,
 
      SUM(
        CASE
          WHEN status = 'approved'
          THEN 1
          ELSE 0
        END
      ) AS approved,
 
      SUM(
        CASE
          WHEN status = 'rewrite_required'
          THEN 1
          ELSE 0
        END
      ) AS rewrite_required,
 
      SUM(
        CASE
          WHEN status = 'pending'
          THEN 1
          ELSE 0
        END
      ) AS pending,
 
      ROUND(AVG(ai_score), 2) AS average_score
 
    FROM articles
 
    WHERE month_year = ?
  `;
 
  const result = await db.prepare(sql).bind(targetMonth).first();
 
  return result;
}
 