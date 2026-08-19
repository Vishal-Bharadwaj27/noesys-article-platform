export default async function getArticleTypes(db: D1Database) {
  const sql = `Select 
            a.id,
            a.name,
            p.content 
            FROM article_types a
            INNER JOIN
            ON
            prompts p P
            a.id = p.article_type_id`;

  const data = await db.prepare(sql).all();

  return { data };
}

export async function getArticleTypeById(
  db: D1Database,
  articleTypeId: string,
) {
  const articleType = await db
    .prepare(
      `
      SELECT
        a.id,
        a.name AS article_type,
        p.content AS prompt
      FROM article_types a
      INNER JOIN prompts p
        ON a.id = p.article_type_id
      WHERE a.id = ?
        AND a.is_active = 1
    `,
    )
    .bind(articleTypeId)
    .first();

  if (!articleType) {
    throw new Error("Article type not found");
  }

  return articleType;
}

export async function createArticleType(
  db: D1Database,
  name: string,
  prompt: string,
  createdBy: string,
) {
  const existing = await db
    .prepare(
      `
      SELECT id
      FROM article_types
      WHERE LOWER(name) = LOWER(?)
    `,
    )
    .bind(name)
    .first();

  if (existing) {
    throw new Error("Article type already exists");
  }

  const articleTypeId = crypto.randomUUID();
  const promptId = crypto.randomUUID();

  const now = new Date().toISOString();

  const batch = await db.batch([
    db
      .prepare(
        `
        INSERT INTO article_types (
          id,
          name,
          created_by,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      )
      .bind(articleTypeId, name, createdBy, now, now),

    db
      .prepare(
        `
        INSERT INTO prompts (
          id,
          article_type_id,
          content,
          created_by,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(promptId, articleTypeId, prompt, createdBy, now, now),
  ]);

  return {
    id: articleTypeId,
  };
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

export async function updateArticleType(
  db: D1Database,
  articleTypeId: string,
  articleType: string,
  prompt: string,
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
    .bind(articleType, articleTypeId)
    .first();

  if (duplicate) {
    throw new Error("Article type already exists");
  }

  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `
        UPDATE article_types
        SET
          name = ?,
          updated_at = ?
        WHERE id = ?
      `,
      )
      .bind(articleType, now, articleTypeId),

    db
      .prepare(
        `
        UPDATE prompts
        SET
          content = ?,
          updated_at = ?
        WHERE article_type_id = ?
      `,
      )
      .bind(prompt, now, articleTypeId),
  ]);
}
