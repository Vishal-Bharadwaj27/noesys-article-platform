import { Hono } from "hono";
import { cors } from "hono/cors";
import usersRoute from "./routes/users";

// type
import type { Env } from "./types";
import articlesRoute from "./routes/articles";
import articleTypesRoute from "./routes/articleTypes";
import authRoutes from "./routes/authRoute";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5174",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Backend is working",
    e: c.env
  });
});

// auth routes
app.route("/api/auth", authRoutes);

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
