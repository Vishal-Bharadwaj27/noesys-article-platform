export async function getUsers(
  db: D1Database,
  month_year?: string,
  submissionStatus?: string,
) {
  if (month_year && !/^\d{4}-\d{2}$/.test(month_year)) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  const allowedStatuses = ["submitted", "not_submitted"];
  if (submissionStatus && !allowedStatuses.includes(submissionStatus)) {
    throw new Error("Invalid submission_status");
  }

  let stmt;

  // GET /users?month=2026-08&submission_status=submitted
  if (month_year && submissionStatus === "submitted") {
    stmt = db
      .prepare(
        `
        SELECT
          u.id,
          u.name,
          u.email,
          u.job_role,
          u.is_active,
          u.auth_role
        FROM users u
        WHERE u.is_active = 1
          AND EXISTS (
            SELECT 1
            FROM articles a
            WHERE a.user_id = u.id
              AND a.month_year = ?
          )
        ORDER BY u.name ASC
      `,
      )
      .bind(month_year);
  }

  // GET /users?month=2026-08&submission_status=not_submitted
  else if (month_year && submissionStatus === "not_submitted") {
    stmt = db
      .prepare(
        `
        SELECT
          u.id,
          u.name,
          u.email,
          u.job_role,
          u.is_active,
          u.auth_role
        FROM users u
        WHERE u.is_active = 1
          AND NOT EXISTS (
            SELECT 1
            FROM articles a
            WHERE a.user_id = u.id
              AND a.month_year = ?
          )
        ORDER BY u.name ASC
      `,
      )
      .bind(month_year);
  }

  // GET /users
  else {
    stmt = db.prepare(`
      SELECT
        id,
        name,
        email,
        job_role,
        is_active,
        auth_role
      FROM users
      WHERE is_active = 1
      ORDER BY name ASC
    `);
  }

  const result = await stmt.all();

  return result.results;
}

// single user function - fetch a user by id
export async function getUserById(db: D1Database, id: string) {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        email,
        auth_role,
        job_role,
        is_active,
        created_at,
        created_by
      FROM users
      WHERE id = ?
    `,
    )
    .bind(id)
    .first();
}

export async function updateUser(
  db: D1Database,
  id: string,
  name: string,
  jobRole: string,
  isActive: boolean,
) {
  await db
    .prepare(
      `
      UPDATE users
      SET
        name = ?,
        job_role = ?,
        is_active = ?
      WHERE id = ?
    `,
    )
    .bind(name, jobRole, isActive, id)
    .run();
}

export async function updateUserAuthRole(
  db: D1Database,
  id: string,
  role: string,
) {
  const allowedRoles = ["user", "admin"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  if (role === "super_admin") {
    throw new Error("Cannot change super_admin role");
  }

  const result = await db
    .prepare(
      `
      UPDATE users
      SET auth_role = ?
      WHERE id = ?
    `,
    )
    .bind(role, id)
    .run();

  if (!result) {
    throw new Error("Some error occurred. Couldn't update the user's role.");
  }
}

export async function getArticlesByUser(
  db: D1Database,
  userId: string,
  month?: string,
  status?: string,
  type?: string,
) {
  const conditions = ["a.user_id = ?"];
  const params: unknown[] = [userId];

  if (month) {
    conditions.push("a.month_year = ?");
    params.push(month);
  }

  if (status) {
    conditions.push("a.status = ?");
    params.push(status);
  }

  if (type) {
    conditions.push("a.article_type_id = ?");
    params.push(type);
  }

  const sql = `
    SELECT
      a.id,
      a.title,
      a.status,
      a.ai_score,
      a.version,
      a.submitted_at,

      a.user_id,

      u.name AS author_name,

      at.id AS article_type_id,
      at.name AS article_type_name

    FROM articles a

    JOIN users u
      ON u.id = a.user_id

    JOIN article_types at
      ON at.id = a.article_type_id

    WHERE ${conditions.join(" AND ")}

    ORDER BY a.submitted_at DESC
  `;

  const results = (
    await db
      .prepare(sql)
      .bind(...params)
      .all()
  ).results as any[];

  return results.map((article) => ({
    ...article,

    // keep same shape as All Articles page
    parameters: [],
  }));
}

export async function updateUserStatus(
  db: D1Database,
  id: string,
  isActive: boolean,
) {
  return db
    .prepare(
      `
      UPDATE users
      SET is_active = ?
      WHERE id = ?
    `,
    )
    .bind(isActive ? 1 : 0, id)
    .run();
}
