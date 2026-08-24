import { Hono } from "hono";
import { Env } from "../types";
import getArticleTypes, {
  createArticleType,
  deactivateArticleType,
  getArticleTypeById,
  updateArticleType,
  ArticleTypeInput,
} from "../services/articleTypes.service";
import { requiredRole } from "../middleware/requiredRole";
import { AuthContext } from "../middleware/auth";

const articleTypesRoute = new Hono<{ Bindings: Env } & AuthContext>();
// articleTypesRoute.use("*", requiredRole("admin", "super_admin"));

function parseArticleTypeBody(body: any): ArticleTypeInput | { error: string } {
  const name = body.name;
  const description = body.description;
  const passThreshold = body.passThreshold;
  const scorePrompt = body.scorePrompt;
  const scoreMin = body.scoreMin;
  const scoreMax = body.scoreMax;

  if (!name?.trim()) return { error: "Article type name is required" };
  if (!scorePrompt?.trim()) return { error: "Score prompt is required" };
  if (typeof passThreshold !== "number") {
    return { error: "passThreshold must be a number" };
  }
  if (typeof scoreMin !== "number" || typeof scoreMax !== "number") {
    return { error: "scoreMin and scoreMax must be numbers" };
  }

  return {
    name: name.trim(),
    description: description?.trim() || undefined,
    passThreshold,
    scorePrompt: scorePrompt.trim(),
    scoreMin,
    scoreMax,
  };
}

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
  const parsed = parseArticleTypeBody(body);

  if ("error" in parsed) {
    return c.json({ message: parsed.error }, 400);
  }

  const data = await createArticleType(c.env.DB, parsed, c.get("user").id);

  return c.json(
    {
      message: "Article type created successfully.",
      data,
    },
    201,
  );
});

articleTypesRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id?.trim()) {
    return c.json({ message: "Article type id is required" }, 400);
  }

  const body = await c.req.json();
  const parsed = parseArticleTypeBody(body);

  if ("error" in parsed) {
    return c.json({ message: parsed.error }, 400);
  }

  await updateArticleType(c.env.DB, id, parsed);

  return c.json({ message: "Article type updated successfully" });
});

articleTypesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id?.trim()) {
    return c.json({ message: "Article type id is required" }, 400);
  }

  await deactivateArticleType(c.env.DB, id);

  return c.json({ message: "Article type deleted successfully" });
});

export default articleTypesRoute;