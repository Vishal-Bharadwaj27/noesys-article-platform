export type ArticleType = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function getArticleTypes(
  db: D1Database
): Promise<ArticleType[]> {
  const result = await db
    .prepare(
      `
        SELECT
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        FROM article_types
        ORDER BY name ASC
      `
    )
    .all<ArticleType>();

  return result.results;
}

export async function getArticleTypeById(
  db: D1Database,
  articleTypeId: string
): Promise<ArticleType | null> {
  return db
    .prepare(
      `
        SELECT
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        FROM article_types
        WHERE id = ?
        LIMIT 1
      `
    )
    .bind(articleTypeId)
    .first<ArticleType>();
}