export type Env = {
  DB: D1Database;
};

// types.ts
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  auth_role: "super_admin" | "admin" | "user";
  job_role: string;
  is_active: number;
};