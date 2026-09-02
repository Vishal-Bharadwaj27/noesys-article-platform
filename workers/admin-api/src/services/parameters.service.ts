import { ParameterInput } from "../types";

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
    if (!input.options) {
      return `options are not defined.`;
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
  const parameters = await db
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
        is_active
      FROM parameters
      WHERE article_type_id = ?
        AND is_active = 1
      ORDER BY sort_order, created_at
    `,
    )
    .bind(articleTypeId)
    .all();

  const results = [];

  for (const parameter of parameters.results ?? []) {
    let options: any[] = [];

    if (parameter.scope_type === "option") {
      const optionResult = await db
        .prepare(
          `
          SELECT
            id,
            label,
            sort_order
          FROM parameter_options
          WHERE parameter_id = ?
            AND is_active = 1
          ORDER BY sort_order
        `,
        )
        .bind(parameter.id)
        .all();

      options = optionResult.results ?? [];
    }

    results.push({
      ...parameter,
      options,
    });
  }

  return results;
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
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      createdBy,
      now,
      now,
    )
    .run();

  if (input.scopeType === "option" && input.options?.length) {
    for (let i = 0; i < input.options?.length; i++)
      await db
        .prepare(
          `
        INSERT INTO parameter_options (
        id,
        parameter_id,
        label,
        sort_order,
        created_at,
        updated_at
        )
        VALUES(?, ?, ?, ?, ?, ?);
      `,
        )
        .bind(
          crypto.randomUUID(),
          parameterId,
          input.options[i].label.trim(),
          i,
          now,
          now,
        )
        .run();
  }

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
      now,
      parameterId,
    )
    .run();

  if (input.scopeType === "option" && input.options?.length) {
    for (let i = 0; i < input.options?.length; i++) {
      const option = input.options[i];

      // update parameter option with regards to their id
      if (option.id) {
        await db
          .prepare(
            `
          UPDATE parameter_options 
          SET label=?,
          sort_order=?
          WHERE id=?
          AND parameter_id=?
          `,
          )
          .bind(option.label, i, option.id, parameterId)
          .run();
      } else {
        await db
          .prepare(
            `
            INSERT INTO parameter_options (
              id,
              parameter_id,
              label,
              sort_order,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          )
          .bind(crypto.randomUUID(), parameterId, option.label, i, now, now)
          .run();
      }
    }
  }
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

  await db
    .prepare(
      `
    UPDATE parameter_options
    SET
      is_active = 0,
      updated_at = ?
    WHERE parameter_id = ?    
  `,
    )
    .bind(new Date().toISOString(), parameterId)
    .run();
}
