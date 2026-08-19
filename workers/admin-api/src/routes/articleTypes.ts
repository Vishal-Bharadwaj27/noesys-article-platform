import { Hono } from "hono";
import { Env } from "../types";
import getArticleTypes, {
  createArticleType,
  deactivateArticleType,
  getArticleTypeById,
  updateArticleType,
} from "../services/articleTypes.service";

const articleTypesRoute = new Hono<{ Bindings: Env }>();

articleTypesRoute.get("/", async (c) => {
  const result = await getArticleTypes(c.env.DB);
  return c.json({
    message: "Article types fetched successfully",
    data: result,
  });
});

articleTypesRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id?.trim()) {
    return c.json({ message: "Article type id is required" }, 400);
  }

  const data = await getArticleTypeById(c.env.DB, id);

  return c.json({
    message: "Article type fetched successfully",
    data,
  });
});

articleTypesRoute.post("/", async (c) => {
  const body = await c.req.json();

  const articleType = body.articleType;
  const prompt = body.prompt;
  const adminName = body.adminName;

  if (!articleType?.trim()) {
    return c.json({ message: "Article type is required" }, 400);
  }

  if (!prompt?.trim()) {
    return c.json({ message: "Prompt is required" }, 400);
  }

  const data = await createArticleType(
    c.env.DB,
    articleType.trim(),
    prompt.trim(),
    adminName,
  );

  return c.json(
    {
      message: "Article type created successfully.",
      data,
    },
    201,
  );
});

articleTypesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id?.trim()) {
    return c.json({ message: "Article type id is required" }, 400);
  }

  await deactivateArticleType(c.env.DB, id);

  return c.json({
    message: "Article type deleted successfully",
  });
});

articleTypesRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id?.trim()) {
    return c.json({ message: "Article type id is required" }, 400);
  }

  const body = await c.req.json();

  const articleType = body.articleType;
  const prompt = body.prompt;

  if (!articleType?.trim()) {
    return c.json({ message: "Article type is required" }, 400);
  }

  if (!prompt?.trim()) {
    return c.json({ message: "Prompt is required" }, 400);
  }

  await updateArticleType(c.env.DB, id, articleType.trim(), prompt.trim());

  return c.json({
    message: "Article type updated successfully",
  });
});

export default articleTypesRoute;
