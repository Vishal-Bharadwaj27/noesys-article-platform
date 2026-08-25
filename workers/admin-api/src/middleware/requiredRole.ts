import type { Context, Next } from "hono";
import type { Env, AuthenticatedUser } from "../types";
import { verifyJWT } from "../utils/jwt";
import { jwtVerify } from "jose";
import { getCookie } from "hono/cookie";

export type AuthContext = {
  Variables: {
    user: AuthenticatedUser;
  };
};

type AuthRole = "super_admin" | "admin";

export function requiredRole(...allowedRoles: AuthRole[]) {
  return async (c: Context<{ Bindings: Env } & AuthContext>, next: Next) => {
    const header = c.req.header("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          message: "Unauthorized: Missing token",
        },
        401,
      );
    }

    const token = header.slice("Bearer ".length).trim();

    if (!token) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);

      const user = await c.env.DB.prepare(
        `SELECT id, email, name, auth_role, job_role, is_active
     FROM users
     WHERE email = ?`,
      )
        .bind(payload.email)
        .first<AuthenticatedUser>();

      if (!user) {
        return c.json({ message: "User not found." });
      }

      if (!allowedRoles.includes(payload.role as AuthRole)) {
        return c.json({ message: "Forbidden" }, 403);
      }

      c.set("user", user);
      await next();
    } catch {
      return c.json({ message: "Unauthorized" }, 401);
    }
  };
}
