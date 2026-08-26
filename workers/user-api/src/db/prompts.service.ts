export async function getPromptForArticleType(
  db: D1Database,
  articleTypeId: string,
) {
  const result = await db
    .prepare(
      `
      SELECT content
      FROM prompts
      WHERE article_type_id = ?
    `,
    )
    .bind(articleTypeId)
    .first<{ content: string }>();

  if (!result) {
    return null;
  }

  return result.content;
}
