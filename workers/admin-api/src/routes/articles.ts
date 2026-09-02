import { Hono } from "hono";
import { Env } from "../types";
import {
  getArticleById,
  getArticleHistory,
  getArticles,
  getArticleStats,
} from "../services/articles.service";
import {
  getParameterResults,
  storeParameterResults,
} from "../services/articleParameterResults.service";
import { authMiddleware } from "../middleware/auth";
 
const articlesRoute = new Hono<{ Bindings: Env }>();
articlesRoute.use("*", authMiddleware("admin", "super_admin"));
 
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
  const articleId = c.req.param("id");
  const db = c.env.DB;
 
  const article = await getArticleById(db, articleId);
 
  if (!article) {
    return c.json(
      {
        success: false,
        message: "Article not found",
      },
      404,
    );
  }
 
  const history = await getArticleHistory(db, articleId);
 
  const currentFeedback =
    article.ai_feedback ||
    (history.length > 0
      ? history[history.length - 1].ai_feedback || ""
      : "");
 
  const parameter_results = await getParameterResults(db, articleId);
 
  return c.json({
    message: "Article fetched successfully",
    data: {
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        article_type_id: article.article_type_id,
        article_type_name: article.article_type_name,
        status: article.status,
        version: article.version,
        ai_score: article.ai_score,
        ai_feedback: article.ai_feedback || null,
        author_name: article.author_name,
        author_email: article.author_email,
        job_role: article.job_role,
      },
      current_feedback: currentFeedback,
      current_score: article.ai_score,
      parameter_results,
      history: history.map((item: { article_id: string; version: number; title: string | null; content: string | null; ai_score: number | null; ai_feedback: string | null; submitted_at: string }) => ({
        article_id: item.article_id,
        version: item.version,
        title: item.title ?? "",
        content: item.content ?? "",
        score: item.ai_score,
        feedback: item.ai_feedback || null,
        status:
          item.ai_score === null
            ? "pending"
            : item.ai_score >= 10
              ? "approved"
              : "rewrite_required",
        submitted_at: item.submitted_at,
      })),
    },
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