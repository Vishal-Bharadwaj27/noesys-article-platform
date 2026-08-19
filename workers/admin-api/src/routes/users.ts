import { Hono } from "hono";
import {
  getUserById, 
  getUsers,
  updateUser,
  updateUserAuthRole,
} from "../services/users.service";
import type { Env } from "../types";

const usersRoute = new Hono<{ Bindings: Env }>();

usersRoute.get("/debug", async (c) => {
  const result = await c.env.DB
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type='table'
    `)
    .all();

  console.log(result);

  return c.json(result);
});

// get users based on submission_status and month_year
usersRoute.get("/", async (c) => {
  const db = c.env.DB;
  const month_year = c.req.query("month");
  const submissionStatus = c.req.query("submission_status");

  try {
    const users = await getUsers(db, month_year, submissionStatus);
    console.log(users)

    return c.json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (e: any) {
    if (e.message === "Invalid month format. Expected YYYY-MM") {
      return c.json({ message: e.message }, 403);
    }
    return c.json({ message: e.message }, 500);
  }
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

  try {
    await updateUserAuthRole(c.env.DB, id, body.role);
    return c.json({ message: "User role updated successfully" });
  } catch (e: any) {
    if (e.message === "Cannot change super_admin role") {
      return c.json({ message: e.message }, 403);
    }
    if (e.message === "User not found") {
      return c.json({ message: e.message }, 404);
    }
    return c.json({ message: "Internal server error" }, 500);
  }
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
  try {
    await updateUser(c.env.DB, id, body.name, body.job_role, body.is_active);

    return c.json({
      message: "User updated successfully",
    });
  } catch (e: any) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

export default usersRoute;
