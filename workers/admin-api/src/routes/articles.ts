import { Hono } from "hono";
import { Env } from "../types";
import { getArticleById, getArticles } from "../services/articles.service";
import { getParameterResults, storeParameterResults } from "../services/articleParameterResults.service";

const articlesRoute = new Hono<{ Bindings: Env }>();

articlesRoute.get("/", async (c) => {
  const month = c.req.query("month");
  const status = c.req.query("status");

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ message: "Invalid month format. Expected YYYY-MM" }, 400);
  }

  const allowedStatuses = ["approved", "rewrite_required", "pending"];

  if (status && !allowedStatuses.includes(status)) {
    return c.json({ message: "Invalid status" }, 400);
  }

  const articles = await getArticles(c.env.DB, month, status);

  return c.json({
    message: "Articles fetched successfully",
    data: articles,
  });
});

articlesRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id || id.trim().length === 0) {
    return c.json({ message: "Invalid article id" }, 400);
  }

  const article = await getArticleById(c.env.DB, id);

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
  if (!Array.isArray(body.results)) return c.json({ message: "results array required" }, 400);
  const data = await storeParameterResults(c.env.DB, id, body.results, body.ai_score, body.ai_feedback);
  return c.json({ message: "Parameter results stored", data }, 201);
});

export default articlesRoute;
