import { Hono } from "hono";
import usersRoute from "./routes/users";

// type
import type { Env } from "./types";
import articlesRoute from "./routes/articles";
import articleTypesRoute from "./routes/articleTypes";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Backend is working",
  });
});

// user routes
app.route("/api/users", usersRoute);

// article routes
app.route("/api/articles", articlesRoute);

// article types route
app.route("/api/article-types", articleTypesRoute);

app.get("/api/health", (c) => {
  return c.json({
    status: "healthy",
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
