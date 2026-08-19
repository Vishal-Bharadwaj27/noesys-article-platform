import type { Context, Next } from "hono";
import type { Bindings, AuthenticatedUser } from "../types";

export type AuthContext = {
  Variables: {
    user: AuthenticatedUser;
  };
};

export async function authMiddleware(
  c: Context<{ Bindings: Bindings } & AuthContext>,
  next: Next
) {
  await next();
}