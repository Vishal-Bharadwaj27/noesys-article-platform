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
    if (!input.options || input.options.length === 0) {
      return "At least one option is required for option parameters";
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
    let options: unknown[] = [];

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


async function syncParameterOptions(
  db: D1Database,
  parameterId: string,
  options: { id?: string; label: string }[] | undefined,
  now: string,
): Promise<D1PreparedStatement[]> {
  const statements: D1PreparedStatement[] = [];
  const incoming = options ?? [];

  const activeResult = await db
    .prepare(
      `SELECT id, label FROM parameter_options WHERE parameter_id = ? AND is_active = 1`,
    )
    .bind(parameterId)
    .all<{ id: string; label: string }>();
  const active = activeResult.results ?? [];

  const inactiveResult = await db
    .prepare(
      `SELECT id, label FROM parameter_options WHERE parameter_id = ? AND is_active = 0`,
    )
    .bind(parameterId)
    .all<{ id: string; label: string }>();
  const inactiveByLabel = new Map(
    (inactiveResult.results ?? []).map((o) => [o.label, o.id]),
  );

  const incomingIds = new Set(
    incoming.map((o) => o.id).filter((id): id is string => Boolean(id)),
  );

  // Deactivate anything currently active that's missing from the incoming list
  // (covers: option removed, or scopeType switched away from "option" entirely)
  for (const opt of active) {
    if (!incomingIds.has(opt.id)) {
      statements.push(
        db
          .prepare(
            `UPDATE parameter_options SET is_active = 0 WHERE id = ? AND parameter_id = ?`,
          )
          .bind(opt.id, parameterId),
      );
    }
  }

  incoming.forEach((option, i) => {
    const label = option.label.trim();

    if (option.id) {
      // Matched by id: update label/order and force it active (fixes the
      // reactivation bug — a row deactivated by an earlier numeric switch
      // must come back when re-selected, not stay silently hidden).
      statements.push(
        db
          .prepare(
            `UPDATE parameter_options SET label = ?, sort_order = ?, is_active = 1 WHERE id = ? AND parameter_id = ?`,
          )
          .bind(label, i, option.id, parameterId),
      );
      return;
    }

    const reuseId = inactiveByLabel.get(label);
    if (reuseId) {
      // A deactivated row with this exact label already exists for this
      // parameter — reactivate it instead of inserting a duplicate. Avoids
      // a UNIQUE(parameter_id, label) clash and preserves the id for any
      // historical article_parameter_results pointing at it.
      statements.push(
        db
          .prepare(
            `UPDATE parameter_options SET label = ?, sort_order = ?, is_active = 1 WHERE id = ? AND parameter_id = ?`,
          )
          .bind(label, i, reuseId, parameterId),
      );
      inactiveByLabel.delete(label);
      return;
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO parameter_options (id, parameter_id, label, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
        )
        .bind(crypto.randomUUID(), parameterId, label, i, now),
    );
  });

  return statements;
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

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `
        INSERT INTO parameters (
          id, article_type_id, name, prompt, scope_type,
          min_value, max_value, created_by, created_at, updated_at
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
      ),
  ];

  const optionStatements = await syncParameterOptions(
    db,
    parameterId,
    input.scopeType === "option" ? input.options : undefined,
    now,
  );
  statements.push(...optionStatements);

  await db.batch(statements);

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

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `
        UPDATE parameters
        SET name = ?, prompt = ?, scope_type = ?, min_value = ?, max_value = ?, updated_at = ?
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
      ),
  ];

  const optionStatements = await syncParameterOptions(
    db,
    parameterId,
    input.scopeType === "option" ? input.options : undefined,
    now,
  );
  statements.push(...optionStatements);

  await db.batch(statements);
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
