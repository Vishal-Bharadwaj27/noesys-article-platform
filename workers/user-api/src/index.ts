import { Hono } from "hono";
import authRoutes from "./routes/auth";
import articleRoutes from "./routes/articles";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "User API is running",
  });
});

app.get("/health", (c) => {
  return c.json(
    {
      message: "Service is healthy",
    },
    200,
  );
});

app.route("/auth", authRoutes);
app.route("/articles", articleRoutes);
app.route("/", articleRoutes);

app.onError((err, c) => {
  return c.json(
    {
      message: err.message,
    },
    500,
  );
});

export default app;