import type { Context, Next } from "hono";
import type { Env, AuthenticatedUser } from "../types";

export type AuthContext = {
  Variables: {
    user: AuthenticatedUser;
  };
};

export async function authMiddleware(
  c: Context<{ Bindings: Env } & AuthContext>,
  next: Next,
) {
  const jwt = c.req.header("Cf-Access-Jwt-Assertion");

  if (!jwt) {
    return c.json({ message: "Unauthorized: missing access token" }, 401);
  }

  // Cloudflare Access already verifies the JWT signature at the edge
  // before it reaches your Worker, so here you just need the claims.
  // Decode the payload (base64) to get the verified email.
  const payload = JSON.parse(atob(jwt.split(".")[1]));
  const email = payload.email as string | undefined;

  if (!email) {
    return c.json({ message: "Unauthorized: invalid token" }, 401);
  }

  const user = await c.env.DB.prepare(
    `SELECT id, email, name, auth_role, job_role, is_active
     FROM users
     WHERE email = ?`,
  )
    .bind(email)
    .first<AuthenticatedUser>();

  if (!user) {
    return c.json({ message: "Unauthorized: user not found" }, 401);
  }

  if (!user.is_active) {
    return c.json({ message: "Forbidden: account is inactive" }, 403);
  }

  c.set("user", user);
  return await next();
}

