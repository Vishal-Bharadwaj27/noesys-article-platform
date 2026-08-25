import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth";
import articleRoutes from "./routes/articles";
import { getArticleTypes } from "./db/articleTypes";
import { authMiddleware } from "./middleware/auth";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: ["https://noesys-article-platform.pages.dev", "https://article-platform-router.vishal-97a.workers.dev", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  })
);

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

app.get("/article-types", authMiddleware, async (c) => {
  const db = c.env.DB;
  const types = await getArticleTypes(db);
  return c.json({
    message: "Article types fetched successfully",
    data: types.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
  });
});

app.onError((err, c) => {
  return c.json(
    {
      message: err.message,
    },
    500,
  );
});

export default app;