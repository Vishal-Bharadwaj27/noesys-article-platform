import { Hono } from "hono";
import { Env } from "../types";
import {
  getArticleById,
  getArticles,
  getArticleStats,
} from "../services/articles.service";
import {
  getParameterResults,
  storeParameterResults,
} from "../services/articleParameterResults.service";

const articlesRoute = new Hono<{ Bindings: Env }>();

articlesRoute.get("/", async (c) => {
  const month = c.req.query("month");
  const status = c.req.query("status");
  const type = c.req.query("type");

  const data = await getArticles(c.env.DB, month, status, type);

  return c.json({
    message: "Articles fetched successfully",
    data,
  });
});

articlesRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  const article = await getArticleById(c.env.DB, id);

  if (!article) {
    return c.json(
      {
        message: "Article not found",
      },
      404,
    );
  }

  return c.json({
    message: "Article fetched successfully",
    data: article,
  });
});

articlesRoute.get("/:id/parameter-results", async (c) => {
  const id = c.req.param("id");
  const data = await getParameterResults(c.env.DB, id);
  return c.json({ message: "Parameter results fetched", data });
});

articlesRoute.post("/:id/parameter-results", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  if (!Array.isArray(body.results))
    return c.json({ message: "results array required" }, 400);
  const data = await storeParameterResults(
    c.env.DB,
    id,
    body.results,
    body.ai_score,
    body.ai_feedback,
  );
  return c.json({ message: "Parameter results stored", data }, 201);
});

// for dashboard stats
articlesRoute.get("/stats", async (c) => {
  const month = c.req.query("month");

  const data = await getArticleStats(c.env.DB, month);

  return c.json({
    message: "Stats fetched successfully",
    data,
  });
});

export default articlesRoute;
