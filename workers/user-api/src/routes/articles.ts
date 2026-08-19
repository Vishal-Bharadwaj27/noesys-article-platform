import { Hono } from "hono";
import { getArticlesByUser, getArticleById, createArticle } from "../db/articles";
import { getArticleHistory, snapshotArticle, updateArticleForRewrite } from "../db/articleHistory";
import { getArticleTypes } from "../db/articleTypes";
import type { AppEnv } from "../types";

const articleRoutes = new Hono<AppEnv>();

articleRoutes.get("/mine", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  if (!user) {
    return c.json({
      success: false,
      message: "Unauthorized",
    }, 401);
  }

  const month = c.req.query("month");
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
return c.json({
      success: false,
      message: "Invalid month format. Expected YYYY-MM.",
    }, 400);
  }

  const articles = await getArticlesByUser(db, user.id, month);

  return c.json({
    success: true,
    data: articles.map((article) => ({
      article: {
        id: article.id,
        title: article.title,
        version: article.version,
        ai_score: article.ai_score,
      },
      author: {
        id: user.id,
        name: user.name,
      },
    })),
  });
});

articleRoutes.get("/mine/:id", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const articleId = c.req.param("id");

  if (!user) {
    return c.json({
      success: false,
      message: "Unauthorized",
    }, 401);
  }

  const article = await getArticleById(db, articleId, user.id);
  if (!article) {
    return c.json({
      success: false,
      message: "Article not found",
    }, 404);
  }

  const history = await getArticleHistory(db, articleId);
  if (history.length > 0) {
    history.sort((a, b) => a.version - b.version);
  }

  return c.json({
    message: "Article fetched successfully",
    data: {
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
      },
      current_feedback: "",
      current_score: article.ai_score,
      history: history.map((item) => ({
        article_id: item.article_id,
        score: item.ai_score,
        status: article.status,
      })),
    },
  });
});

articleRoutes.post("/", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  if (!user) {
    return c.json({
      success: false,
      message: "Unauthorized",
    }, 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      message: "Invalid JSON body",
    }, 400);
  }

  const { id: requestedId, article_type_id, title, content } = body;
  if (!article_type_id || !title || !content) {
    return c.json({
      success: false,
      message: "Missing required fields: article_type_id, title, content",
    }, 400);
  }

  const now = new Date().toISOString();
  const month_year = now.slice(0, 7);

  if (requestedId) {
    // Rewrite attempt
    const existingArticle = await getArticleById(db, requestedId, user.id);
    if (!existingArticle) {
      return c.json({
        success: false,
        message: "Article not found or does not belong to user",
      }, 404);
    }

    const historyId = "hist_" + crypto.randomUUID();
    await snapshotArticle(db, requestedId, historyId, now);
    await updateArticleForRewrite(db, requestedId, title, content);

    return c.json({
      message: "Article submitted successfully",
      data: {
        id: requestedId,
        status: "pending",
      },
    });
  } else {
    // New article
    const newId = "art_" + crypto.randomUUID();
    await createArticle(db, {
      id: newId,
      user_id: user.id,
      article_type_id,
      title,
      content,
      status: "pending",
      version: 1,
      submitted_at: now,
      month_year,
      retry_count: 0,
    });

    return c.json({
      message: "Article submitted successfully",
      data: {
        id: newId,
        status: "pending",
      },
    });
  }
});

articleRoutes.get("/article-types", async (c) => {
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

export default articleRoutes;