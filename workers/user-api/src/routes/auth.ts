import { Hono } from "hono";
import type { AppEnv } from "../types";

const authRoutes = new Hono<AppEnv>();

authRoutes.get("/me", (c) => {
  return c.json({
    success: true,
    message: "Authentication endpoint",
  });
});

export default authRoutes;