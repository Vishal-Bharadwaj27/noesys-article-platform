export type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
  SENDGRID_API_KEY?: string;
  FROM_EMAIL?: string;
  GOOGLE_GEMINI_API_KEY: string;
  AI: Ai;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  job_role: string;
  auth_role: string;
  is_active: number;
};

export type AppVariables = {
  user: AuthenticatedUser;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: AppVariables;
};
