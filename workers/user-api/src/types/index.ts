export type Bindings = {
  DB: D1Database;
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