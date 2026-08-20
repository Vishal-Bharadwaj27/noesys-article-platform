export type UserRecord = {
  id: string;
  email: string;
  name: string;
  auth_role: "super_admin" | "admin" | "user";
  job_role: string;
  is_active: number;
};

export async function findUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRecord | null> {
  const user = await db
    .prepare(
      `SELECT id, email, name, auth_role, job_role, is_active FROM users WHERE email = ?`,
    )
    .bind(email)
    .first<UserRecord>();

  return user ?? null;
}
