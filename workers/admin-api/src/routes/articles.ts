import { Hono } from "hono";
import { Env } from "../types";
import { getArticleById, getArticles } from "../services/articles.service";

const articlesRoute = new Hono<{ Bindings: Env }>();

articlesRoute.get("/", async (c) => {
  const month = c.req.query("month");
  const status = c.req.query("status");

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ message: "Invalid month format. Expected YYYY-MM" }, 400);
  }

  const allowedStatuses = ["approved", "rewrite_required"];

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

export default articlesRoute;
