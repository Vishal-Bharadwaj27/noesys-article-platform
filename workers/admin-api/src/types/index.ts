export type Env = {
  DB: D1Database;
  DEV_EMAIL?: string;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  auth_role: "super_admin" | "admin";
  job_role: string;
  is_active: number;
};
