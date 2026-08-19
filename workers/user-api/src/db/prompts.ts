export type Prompt = {
  id: string;
  article_type_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function getPromptByArticleTypeId(
  db: D1Database,
  articleTypeId: string
): Promise<Prompt | null> {
  return db
    .prepare(
      `
        SELECT
          id,
          article_type_id,
          content,
          created_by,
          created_at,
          updated_at
        FROM prompts
        WHERE article_type_id = ?
        LIMIT 1
      `
    )
    .bind(articleTypeId)
    .first<Prompt>();
}

export async function getFallbackPrompt(
  db: D1Database
): Promise<string | null> {
  const setting = await db
    .prepare(
      `
        SELECT value
        FROM system_settings
        WHERE key = ?
        LIMIT 1
      `
    )
    .bind("fallback_prompt")
    .first<{ value: string }>();

  return setting?.value ?? null;
}