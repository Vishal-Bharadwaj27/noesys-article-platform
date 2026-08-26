import { Hono } from "hono";
import {
  getArticlesByUser,
  getArticleById,
  createArticle,
  updateArticleStatus,
} from "../db/articles";
import {
  getArticleHistory,
  snapshotArticle,
  updateArticleForRewrite,
} from "../db/articleHistory";
import { getArticleTypes, updateEvaluation } from "../db/articleTypes";
import type { AppEnv } from "../types";
import { getPromptForArticleType } from "../db/prompts.service";
import { evaluateArticle } from "../db/ai.service";
import { authMiddleware } from "../middleware/auth";

const articleRoutes = new Hono<AppEnv>();

articleRoutes.use("*", authMiddleware);

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function toListItem(article: {
  id: string;
  title: string;
  article_type_name: string;
  version: number;
  ai_score: number | null;
  status: string;
  submitted_at: string;
  authorName: string;
  authorId: string;
}) {
  return {
    article: {
      id: article.id,
      title: article.title,
      type: article.article_type_name,
      version: article.version,
      ai_score: article.ai_score,
      status: article.status,
      created: article.submitted_at,
    },
    author: {
      id: article.authorId,
      name: article.authorName,
    },
  };
}

articleRoutes.get("/mine", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  const viewAllRaw = c.req.query("viewAll");
  const viewAll = viewAllRaw === "true" || viewAllRaw === "1";

  const month = c.req.query("month");

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return c.json(
      {
        success: false,
        message: "Invalid month format. Expected YYYY-MM.",
      },
      400,
    );
  }

  const pageRaw = c.req.query("page");
  const limitRaw = c.req.query("limit");

  let page: number | undefined;
  let limit: number | undefined;

  if (viewAll) {
    page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;
    limit = limitRaw
      ? Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 10))
      : 10;
  }

  const { articles, pagination } = await getArticlesByUser(
    db,
    user.id,
    viewAll ? undefined : month || currentMonth(),
    viewAll,
    page,
    limit,
  );

  const data = articles.map((article) =>
    toListItem({
      id: article.id,
      title: article.title,
      article_type_name: article.article_type_name,
      version: article.version,
      ai_score: article.ai_score,
      status: article.status,
      submitted_at: article.submitted_at,
      authorName: user.name,
      authorId: user.id,
    }),
  );

  return c.json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  });
});

articleRoutes.get("/mine/:id", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const articleId = c.req.param("id");

  const article = await getArticleById(db, articleId, user.id);

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

  if (history.length > 0) {
    history.sort((a, b) => a.version - b.version);
  }

  const isPending = article.status === "pending" || article.status === "processing";
  const currentFeedback = isPending ? "" : (article.ai_feedback || (history.length > 0 ? history[history.length - 1].ai_feedback || "" : ""));

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
      },
      current_feedback: currentFeedback,
      current_score: article.ai_score,
      history: history.map((item) => {
        let status = "pending";

        if (item.ai_score !== null) {
          status = item.ai_score >= 7 ? "approved" : "rewrite_required";
        }

        return {
          article_id: item.article_id,
          version: item.version,
          score: item.ai_score,
          feedback: item.ai_feedback || null,
          status,
          submitted_at: item.submitted_at,
        };
      }),
    },
  });
});

articleRoutes.post("/", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  type CreateArticleBody = {
    id?: string;
    article_type_id?: string;
    title?: string;
    content?: string;
  };

  let body: CreateArticleBody;

  try {
    body = await c.req.json<CreateArticleBody>();
  } catch {
    return c.json(
      {
        success: false,
        message: "Invalid JSON body",
      },
      400,
    );
  }

  const {
    id: requestedId,
    article_type_id,
    title,
    content,
  } = body;

  if (!article_type_id || !title || !content) {
    return c.json(
      {
        success: false,
        message: "Missing required fields: article_type_id, title, content",
      },
      400,
    );
  }

  const now = new Date().toISOString();
  const month_year = now.slice(0, 7);

  let articleId: string;

  if (requestedId) {
    // Rewrite attempt
    const existingArticle = await getArticleById(
      db,
      requestedId,
      user.id,
    );

    if (!existingArticle) {
      return c.json(
        {
          success: false,
          message: "Article not found or does not belong to user",
        },
        404,
      );
    }

    const historyId = "hist_" + crypto.randomUUID();

    await snapshotArticle(
      db,
      requestedId,
      historyId,
      now,
    );

    await updateArticleForRewrite(
      db,
      requestedId,
      title,
      content,
    );

    articleId = requestedId;

    c.executionCtx.waitUntil(
      (async () => {
        const prompt = await getPromptForArticleType(
          db,
          article_type_id,
        );

        if (!prompt) {
          await updateArticleStatus(
            db,
            articleId,
            "failed",
          );
          return;
        }

        try {
          const evaluation = await evaluateArticle(
            c.env.GOOGLE_GENERATIVE_AI_API_KEY,
            prompt,
            title,
            content,
          );

          const status =
            evaluation.score >= 7
              ? "approved"
              : "rewrite_required";

          await updateEvaluation(
            db,
            articleId,
            evaluation.score,
            evaluation.feedback,
            status,
          );
        } catch (err) {
          console.error("Gemini Error:", err);

          await updateArticleStatus(
            db,
            articleId,
            "failed",
          );
        }
      })(),
    );

    return c.json({
      message: "Article rewrite submitted successfully",
      data: {
        id: articleId,
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
      status: "processing",
      version: 1,
      submitted_at: now,
      month_year,
      retry_count: 0,
    });

    articleId = newId;

    c.executionCtx.waitUntil(
      (async () => {
        const prompt = await getPromptForArticleType(
          db,
          article_type_id,
        );

        if (!prompt) {
          await updateArticleStatus(
            db,
            articleId,
            "failed",
          );
          return;
        }

        try {
          const evaluation = await evaluateArticle(
            c.env.GOOGLE_GENERATIVE_AI_API_KEY,
            prompt,
            title,
            content,
          );

          const status =
            evaluation.score >= 7
              ? "approved"
              : "rewrite_required";

          await updateEvaluation(
            db,
            articleId,
            evaluation.score,
            evaluation.feedback,
            status,
          );
        } catch (err) {
          console.error("Gemini Error:", err);

          await updateArticleStatus(
            db,
            articleId,
            "failed",
          );
        }
      })(),
    );

    return c.json({
      message: "Article submitted successfully",
      data: {
        id: articleId,
        status: "processing",
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