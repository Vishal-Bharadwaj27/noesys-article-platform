import type { Context, Next } from "hono";
import type { Env , AuthenticatedUser } from "../types";

export type AuthContext = {
  Variables: {
    user: AuthenticatedUser;
  };
};

type AuthRole = "super_admin" | "admin" | "user";

export function requireRole(...allowedRoles: AuthRole[]) {
  return async (
    c: Context<{ Bindings: Env } & AuthContext>,
    next: Next,
  ) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    if (!allowedRoles.includes(user.auth_role as AuthRole)) {
      return c.json({ message: "Forbidden" }, 403);
    }

    await next();
  };
}
