import type { Context, Next } from "hono";
import { getUserById } from "../services/users.service";
import type { AuthContext, Env } from "../types";
import { verifyJWT } from "../utils/jwt";

export function authMiddleware(...allowedRoles: ("admin" | "super_admin")[]) {
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
    let payload;
    try {
      payload = await verifyJWT(token, c.env.JWT_SECRET);
    } catch (error) {
      return c.json(
        {
          success: false,
          message: "Unauthorized: Invalid or expired token",
        },
        401,
      );
    }

    if (!payload?.sub) {
      return c.json(
        {
          success: false,
          message: "Unauthorized: Invalid or expired token",
        },
        401,
      );
    }

    const user = await getUserById(c.env.DB, payload.sub as string);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Unauthorized: User not found",
        },
        401,
      );
    }

    if (user.is_active !== 1) {
      return c.json(
        {
          success: false,
          message: "Forbidden: Account is inactive",
        },
        403,
      );
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.auth_role as any)
    ) {
      return c.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
        },
        403,
      );
    }
    c.set("user", {
      id: user.id,
      email: user.email,
      name: user.name,
      job_role: user.job_role,
      auth_role: user.auth_role,
      is_active: user.is_active,
    });

    await next();
  };
}
