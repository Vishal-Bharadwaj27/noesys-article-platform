export type OtpCode = {
  id: string;
  email: string;
  code: string;
  purpose: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
};

export type CreateOtpInput = {
  id: string;
  email: string;
  code: string;
  purpose?: string;
  expires_at: string;
  created_at: string;
};

export async function createOtp(
  db: D1Database,
  otp: CreateOtpInput,
): Promise<void> {
  await db
    .prepare(
      `
        INSERT INTO otp_codes (
          id,
          email,
          code,
          purpose,
          expires_at,
          created_at,
          used_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NULL)
      `,
    )
    .bind(
      otp.id,
      otp.email,
      otp.code,
      otp.purpose ?? "login",
      otp.expires_at,
      otp.created_at,
    )
    .run();
}

export async function findValidOtp(
  db: D1Database,
  email: string,
  code: string,
): Promise<OtpCode | null> {
  return db
    .prepare(
      `
        SELECT
          id,
          email,
          code,
          purpose,
          expires_at,
          created_at,
          used_at
        FROM otp_codes
        WHERE email = ? AND code = ? AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .bind(email, code)
    .first<OtpCode>();
}

export async function invalidateOtp(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `
        UPDATE otp_codes
        SET used_at = ?
        WHERE id = ?
      `,
    )
    .bind(new Date().toISOString(), id)
    .run();
}
