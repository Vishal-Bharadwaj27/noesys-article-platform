export type Article = {
  id: string;
  user_id: string;
  article_type_id: string;
  title: string;
  content: string;
  status: string;
  ai_score: number | null;
  version: number;
  submitted_at: string;
  scored_at: string | null;
  month_year: string;
  retry_count: number;
};

export async function getArticlesByUser(
  db: D1Database,
  userId: string,
  month?: string
): Promise<Article[]> {
  if (month) {
    const result = await db
      .prepare(
        `
          SELECT
            id,
            user_id,
            article_type_id,
            title,
            content,
            status,
            ai_score,
            version,
            submitted_at,
            scored_at,
            month_year,
            retry_count
          FROM articles
          WHERE user_id = ?
            AND month_year = ?
          ORDER BY submitted_at DESC
          WHERE id IN (
            SELECT id
            FROM (
              SELECT id, MAX(version) as max_version
              FROM articles
              WHERE user_id = ?
              GROUP BY id
            ) as latest_versions
            WHERE version = latest_versions.max_version
          )
        `
      )
      .bind(userId, month)
      .all<Article>();

    return result.results;
  }

  const result = await db
    .prepare(
      `
        SELECT
          id,
          user_id,
          article_type_id,
          title,
          content,
          status,
          ai_score,
          version,
          submitted_at,
          scored_at,
          month_year,
          retry_count
        FROM articles
        WHERE user_id = ?
        ORDER BY submitted_at DESC
        WHERE id IN (
          SELECT id
          FROM (
            SELECT id, MAX(version) as max_version
            FROM articles
            WHERE user_id = ?
            GROUP BY id
          ) as latest_versions
          WHERE version = latest_versions.max_version
        )
      `
    )
    .bind(userId)
    .all<Article>();

  return result.results;
}

export async function getArticleById(
  db: D1Database,
  articleId: string,
  userId: string
): Promise<Article | null> {
  return db
    .prepare(
      `
        SELECT
          id,
          user_id,
          article_type_id,
          title,
          content,
          status,
          ai_score,
          version,
          submitted_at,
          scored_at,
          month_year,
          retry_count
        FROM articles
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `
    )
    .bind(articleId, userId)
    .first<Article>();
}

export async function createArticle(
  db: D1Database,
  article: {
    id: string;
    user_id: string;
    article_type_id: string;
    title: string;
    content: string;
    status: string;
    version: number;
    submitted_at: string;
    month_year: string;
    retry_count: number;
  }
): Promise<void> {
  await db
    .prepare(
      `
        INSERT INTO articles (
          id,
          user_id,
          article_type_id,
          title,
          content,
          status,
          version,
          submitted_at,
          month_year,
          retry_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      article.id,
      article.user_id,
      article.article_type_id,
      article.title,
      article.content,
      article.status,
      article.version,
      article.submitted_at,
      article.month_year,
      article.retry_count
    )
    .run();
}