type ScopeType = "numeric" | "option";
const VALID_OPTION_KEYS = ["ABC", "HIGH_MED_LOW"] as const;

export interface ParameterInput {
  name: string;
  prompt: string;
  scopeType: ScopeType;
  minValue?: number;
  maxValue?: number;
  options?: string;
}

function validateScope(input: ParameterInput): string | null {
  if (input.scopeType === "numeric") {
    if (
      typeof input.minValue !== "number" ||
      typeof input.maxValue !== "number"
    ) {
      return "minValue and maxValue are required for numeric parameters";
    }
    if (input.maxValue <= input.minValue) {
      return "maxValue must be greater than minValue";
    }
  } else if (input.scopeType === "option") {
    if (!input.options || !VALID_OPTION_KEYS.includes(input.options as any)) {
      return `options must be one of: ${VALID_OPTION_KEYS.join(", ")}`;
    }
  } else {
    return "scopeType must be 'numeric' or 'option'";
  }
  return null;
}

export async function getParametersByArticleType(
  db: D1Database,
  articleTypeId?: string,
) {
  if (articleTypeId?.trim() === "" || !articleTypeId) {
    throw new Error("article type ID is invalid");
  }

  const sql = `
    SELECT
      id,
      article_type_id,
      name,
      prompt,
      scope_type,
      min_value,
      max_value,
      options,
      is_active
    FROM parameters
    WHERE article_type_id = ?
      AND is_active = 1
  `;

  const data = await db.prepare(sql).bind(articleTypeId).all();

  return data.results;
}

export async function getParameterById(db: D1Database, parameterId: string) {
  const parameter = await db
    .prepare(
      `
      SELECT
        id,
        article_type_id,
        name,
        prompt,
        scope_type,
        min_value,
        max_value,
        options,
        is_active
      FROM parameters
      WHERE id = ?
        AND is_active = 1
    `,
    )
    .bind(parameterId)
    .first();

  if (!parameter) {
    throw new Error("Parameter not found");
  }

  return parameter;
}

export async function createParameter(
  db: D1Database,
  input: ParameterInput,
  createdBy: string,
  articleTypeId?: string,
) {
  const scopeError = validateScope(input);
  if (scopeError) {
    throw new Error(scopeError);
  }

  if (articleTypeId?.trim() === "" || !articleTypeId) {
    throw new Error("article type ID is invalid");
  }

  const articleType = await db
    .prepare(`SELECT id FROM article_types WHERE id = ? AND is_active = 1`)
    .bind(articleTypeId)
    .first();

  if (!articleType) {
    throw new Error("Article type not found");
  }

  const existing = await db
    .prepare(
      `
      SELECT id
      FROM parameters
      WHERE article_type_id = ?
        AND LOWER(name) = LOWER(?)
        AND is_active = 1
    `,
    )
    .bind(articleTypeId, input.name)
    .first();

  if (existing) {
    throw new Error(
      "Parameter with this name already exists for this article type",
    );
  }

  const parameterId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `
      INSERT INTO parameters (
        id,
        article_type_id,
        name,
        prompt,
        scope_type,
        min_value,
        max_value,
        options,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      parameterId,
      articleTypeId,
      input.name,
      input.prompt,
      input.scopeType,
      input.minValue ?? null,
      input.maxValue ?? null,
      input.options ?? null,
      createdBy,
      now,
      now,
    )
    .run();

  return { id: parameterId };
}

export async function updateParameter(
  db: D1Database,
  parameterId: string,
  input: ParameterInput,
) {
  const scopeError = validateScope(input);
  if (scopeError) {
    throw new Error(scopeError);
  }

  const existing = await db
    .prepare(
      `SELECT article_type_id FROM parameters WHERE id = ? AND is_active = 1`,
    )
    .bind(parameterId)
    .first<{ article_type_id: string }>();

  if (!existing) {
    throw new Error("Parameter not found");
  }

  const duplicate = await db
    .prepare(
      `
      SELECT id
      FROM parameters
      WHERE article_type_id = ?
        AND LOWER(name) = LOWER(?)
        AND id != ?
        AND is_active = 1
    `,
    )
    .bind(existing.article_type_id, input.name, parameterId)
    .first();

  if (duplicate) {
    throw new Error(
      "Parameter with this name already exists for this article type",
    );
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `
      UPDATE parameters
      SET
        name = ?,
        prompt = ?,
        scope_type = ?,
        min_value = ?,
        max_value = ?,
        options = ?,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(
      input.name,
      input.prompt,
      input.scopeType,
      input.minValue ?? null,
      input.maxValue ?? null,
      input.options ?? null,
      now,
      parameterId,
    )
    .run();
}

export async function deactivateParameter(db: D1Database, parameterId: string) {
  const existing = await db
    .prepare(`SELECT id FROM parameters WHERE id = ? AND is_active = 1`)
    .bind(parameterId)
    .first();

  if (!existing) {
    throw new Error("Parameter not found");
  }

  await db
    .prepare(
      `
      UPDATE parameters
      SET
        is_active = 0,
        updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(new Date().toISOString(), parameterId)
    .run();
}
