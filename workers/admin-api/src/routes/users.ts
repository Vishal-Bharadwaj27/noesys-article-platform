import { Hono } from "hono";
import {
  getUserArticles,
  getUserById,
  getUsers,
  updateUser,
  updateUserAuthRole,
} from "../services/users.service";
import type { Env } from "../types";
import { AuthContext, authMiddleware } from "../middleware/auth";
import { requiredRole } from "../middleware/requiredRole";

const usersRoute = new Hono<{ Bindings: Env } & AuthContext>();
// usersRoute.use("*", requiredRole("admin", "super_admin"));

// get users based on submission_status and month_year
usersRoute.get("/", async (c) => {
  const db = c.env.DB;
  const month_year = c.req.query("month");
  const submissionStatus = c.req.query("submission_status");

  const users = await getUsers(db, month_year, submissionStatus);

  return c.json({
    message: "Users fetched successfully",
    data: users,
  });
});

// return article of a specific user GET /users/:id/articles
usersRoute.get("/:id/articles", async (c) => {
  const db = c.env.DB;

  const id = c.req.param("id");
  const month = c.req.query("month");
  const status = c.req.query("status");

  if (!id || id.trim() === "") {
    return c.json({ message: "Invalid id" }, 400);
  }

  const data = await getUserArticles(
    db,
    id,
    month || undefined,
    status || undefined,
  );

  if (!data) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({
    message: "User articles fetched successfully",
    user: data.user,
    data: data.articles,
  });
});

// update a specific user's role
usersRoute.patch("/:id/role", async (c) => {
  const id = c.req.param("id");
  if (!id || id.trim() === "") {
    return c.json({ message: "Invalid id" }, 400);
  }

  const body = await c.req.json<{ role: string }>();
  const allowedRoles = ["user", "admin", "super_admin"];
  if (!body.role || !allowedRoles.includes(body.role)) {
    return c.json({ message: "Invalid role" }, 400);
  }

  await updateUserAuthRole(c.env.DB, id, body.role);
  return c.json({ message: "User role updated successfully" });
});

// get a particular user's profile
usersRoute.get("/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  if (!id || id.trim() === "") {
    return c.json({ message: "Invalid id" }, 400);
  }

  const user = await getUserById(db, id);

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({
    message: "User fetched successfully",
    data: user,
  });
});

// update a specific user's data
usersRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  if (!id || id.trim() === "") {
    return c.json({ message: "Invalid id" }, 400);
  }

  if (!body.name || !body.job_role || body.is_active === undefined) {
    return c.json({ message: "Invalid role" }, 400);
  }

  await updateUser(c.env.DB, id, body.name, body.job_role, body.is_active);

  return c.json({
    message: "User updated successfully",
  });
});

export default usersRoute;
