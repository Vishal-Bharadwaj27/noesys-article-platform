import { Hono } from "hono";
import { Env } from "../types";
import {
  createParameter,
  deactivateParameter,
  getParameterById,
  getParametersByArticleType,
  updateParameter,
  ParameterInput,
} from "../services/parameters.service";
import { requiredRole } from "../middleware/requiredRole";
import { AuthContext } from "../middleware/auth";

const parametersRoute = new Hono<{ Bindings: Env } & AuthContext>();
parametersRoute.use("*", requiredRole("admin", "super_admin"));

function parseParameterBody(body: any): ParameterInput | { error: string } {
  const name = body.name;
  const prompt = body.prompt;
  const scopeType = body.scopeType;

  if (!name?.trim()) return { error: "Parameter name is required" };
  if (!prompt?.trim()) return { error: "Parameter prompt is required" };
  if (scopeType !== "numeric" && scopeType !== "option") {
    return { error: "scopeType must be 'numeric' or 'option'" };
  }

  return {
    name: name.trim(),
    prompt: prompt.trim(),
    scopeType,
    minValue: body.minValue,
    maxValue: body.maxValue,
    options: body.options,
  };
}

parametersRoute.get("/", async (c) => {
  const articleTypeId = c.req.param("articleTypeId");
  const result = await getParametersByArticleType(c.env.DB, articleTypeId);
  return c.json({
    message: "Parameters fetched successfully",
    data: result,
  });
});

parametersRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await getParameterById(c.env.DB, id);
  return c.json({
    message: "Parameter fetched successfully",
    data,
  });
});

parametersRoute.post("/", async (c) => {
  const articleTypeId = c.req.param("articleTypeId");
  const body = await c.req.json();
  const parsed = parseParameterBody(body);

  if ("error" in parsed) {
    return c.json({ message: parsed.error }, 400);
  }

  const data = await createParameter(c.env.DB, articleTypeId, parsed, c.get("user").id);

  return c.json(
    { message: "Parameter created successfully.", data },
    201,
  );
});

parametersRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = parseParameterBody(body);

  if ("error" in parsed) {
    return c.json({ message: parsed.error }, 400);
  }

  await updateParameter(c.env.DB, id, parsed);

  return c.json({ message: "Parameter updated successfully" });
});

parametersRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await deactivateParameter(c.env.DB, id);
  return c.json({ message: "Parameter deleted successfully" });
});

export default parametersRoute;