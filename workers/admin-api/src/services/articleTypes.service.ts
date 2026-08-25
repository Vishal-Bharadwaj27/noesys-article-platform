export default async function getArticleTypes(db: D1Database) {
  const sql = `
   
  SELECT
  at.id,
  at.name,
  at.description,
  at.pass_threshold,
  at.score_prompt,
  at.score_max,
  at.is_active,
  json_group_array(
    json_object(
      'id', p.id,
      'name', p.name,
      'scopeType', p.scope_type,
      'options', p.options
    )
  ) AS parameters
FROM article_types at
LEFT JOIN parameters p
  ON p.article_type_id = at.id
  AND p.is_active = 1
WHERE at.is_active = 1
GROUP BY
  at.id,
  at.name,
  at.description,
  at.pass_threshold,
  at.score_prompt,
  at.score_max,
  at.is_active;`;

  const data = await db.prepare(sql).all();
  console.log(data.results);
  return data.results.map((row: any) => ({
    ...row,

    parameters: JSON.parse(row.parameters ?? "[]").filter((p: any) => p?.id),
  }));
}

export async function getArticleTypeById(
  db: D1Database,
  articleTypeId: string,
) {
  const articleType = await db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        pass_threshold,
        score_prompt,
        score_min,
        score_max,
        is_active
      FROM article_types
      WHERE id = ?
        AND is_active = 1
    `,
    )
    .bind(articleTypeId)
    .first();

  if (!articleType) {
    throw new Error("Article type not found");
  }

  return articleType;
}

export interface ArticleTypeInput {
  name: string;
  description?: string;
  passThreshold: number;
  scorePrompt: string;
  scoreMin: number;
  scoreMax: number;
}

export async function createArticleType(
  db: D1Database,
  input: ArticleTypeInput,
  createdBy: string,
) {
  const existing = await db
    .prepare(
      `
      SELECT id
      FROM article_types
      WHERE LOWER(name) = LOWER(?)
        AND is_active = 1
    `,
    )
    .bind(input.name)
    .first();
  if (existing) {
    throw new Error("Article type already exists");
  }

  if (input.scoreMax <= input.scoreMin) {
    throw new Error("score_max must be greater than score_min");
  }

  if (
    input.passThreshold < input.scoreMin ||
    input.passThreshold > input.scoreMax
  ) {
    throw new Error("pass_threshold must fall within score_min and score_max");
  }

  const articleTypeId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await db
      .prepare(
        `
        INSERT INTO article_types (
          id,
          name,
          description,
          pass_threshold,
          score_prompt,
          score_min,
          score_max,
          created_by,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(
        articleTypeId,
        input.name,
        input.description ?? null,
        input.passThreshold,
        input.scorePrompt,
        input.scoreMin,
        input.scoreMax,
        createdBy,
        now,
        now,
      )
      .run();
  } catch (err) {
    console.error("INSERT article_types failed:", err);
    throw err;
  }

  return { id: articleTypeId };
}

export async function updateArticleType(
  db: D1Database,
  articleTypeId: string,
  input: ArticleTypeInput,
) {
  const existing = await db
    .prepare(
      `
      SELECT id
      FROM article_types
      WHERE id = ?
        AND is_active = 1
    `,
    )
    .bind(articleTypeId)
    .first();

  if (!existing) {
    throw new Error("Article type not found");
  }

  const duplicate = await db
    .prepare(
      `
      SELECT id
      FROM article_types
      WHERE LOWER(name) = LOWER(?)
        AND id != ?
        AND is_active = 1
    `,
    )
    .bind(input.name, articleTypeId)
    .first();

  if (duplicate) {
    throw new Error("Article type already exists");
  }

  if (input.scoreMax <= input.scoreMin) {
    throw new Error("score_max must be greater than score_min");
  }

  if (
    input.passThreshold < input.scoreMin ||
    input.passThreshold > input.scoreMax
  ) {
    throw new Error("pass_threshold must fall within score_min and score_max");
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `
      UPDATE article_types
      SET
        name = ?,
        description = ?,
        pass_threshold = ?,
        score_prompt = ?,
        score_min = ?,
        score_max = ?,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(
      input.name,
      input.description ?? null,
      input.passThreshold,
      input.scorePrompt,
      input.scoreMin,
      input.scoreMax,
      now,
      articleTypeId,
    )
    .run();
}

export async function deactivateArticleType(
  db: D1Database,
  articleTypeId: string,
) {
  const existing = await db
    .prepare(
      `
      SELECT id
      FROM article_types
      WHERE id = ?
        AND is_active = 1
    `,
    )
    .bind(articleTypeId)
    .first();

  if (!existing) {
    throw new Error("Article type not found");
  }

  await db
    .prepare(
      `
      UPDATE article_types
      SET
        is_active = 0,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(new Date().toISOString(), articleTypeId)
    .run();
}
