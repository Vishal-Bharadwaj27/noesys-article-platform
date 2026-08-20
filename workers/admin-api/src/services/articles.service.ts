export type ArticleListItem = {
  id: string;
  title: string;
  status: string;
  ai_score: number | null;
  version: number;
  month_year: string;
  submitted_at: string;
  user_id: string;
  user_name: string;
  email: string;
  job_role: string;
};

export async function getArticles(
  db: D1Database,
  month?: string,
  status?: string,
): Promise<ArticleListItem[]> {
  let sql = `
    SELECT
      a.id,
      a.title,
      a.status,
      a.ai_score,
      a.version,
      a.month_year,
      a.submitted_at,

      u.id AS user_id,
      u.name AS user_name,
      u.email,
      u.job_role

    FROM articles a
    INNER JOIN users u
      ON u.id = a.user_id

    WHERE 1 = 1
  `;

  const bindings: string[] = [];

  if (month) {
    sql += ` AND a.month_year = ?`;
    bindings.push(month);
  }

  if (status) {
    sql += ` AND a.status = ?`;
    bindings.push(status);
  }

  sql += `
    ORDER BY u.name ASC, a.submitted_at DESC
  `;

  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<ArticleListItem>();

  return result.results;
}

export async function getArticleById(db: D1Database, id: string) {
  const article = await db
    .prepare(
      `
            SELECT 
                a.*,

                u.name AS author_name,
                u.email AS author_mail,
                u.job_role 

                FROM articles a
                INNER JOIN 
                users u
                ON a.user_id = u.id

                WHERE a.id = ?
        `,
    )
    .bind(id)
    .first();

  if (!article) {
    throw new Error("No article found");
  }

  const history = await db
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

        from article_history 
        WHERE 
        article_history.article_id = ? 
        Order By version ASC;
        `,
    )
    .bind(id)
    .all();

  return { article, history };
}
