import { Hono } from "hono";
import { Env } from "../types";
import { AuthContext } from "../middleware/auth";
import { deleteCookie } from "hono/cookie";
import {
  createOtp,
  findValidOtp,
  invalidateOtp,
} from "../services/otp.service";
import { sendOTPWithFallback } from "./sendgrid";
import { generateJWT, verifyJWT } from "../utils/jwt";
import { findUserByEmail } from "../services/auth.service";

const authRoutes = new Hono<{ Bindings: Env & AuthContext }>();

const OTP_TTL_MS = 5 * 60 * 1000;

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@noesyssoftware\.com$/i.test(email.trim());
}

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
authRoutes.post("/otp/request", async (c) => {
  let body: { email?: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: "Invalid JSON body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return c.json(
      { success: false, message: "A valid email is required" },
      400,
    );
  }

  if (!isValidEmail(email)) {
    return c.json(
      {
        success: false,
        message: "Only @noesyssoftware.com email addresses are allowed",
      },
      400,
    );
  }

  const db = c.env.DB;
  const now = new Date();
  const otp = generateOtpCode();

  await createOtp(db, {
    id: "otp_" + crypto.randomUUID(),
    email,
    code: otp,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
  });

  try {
    await sendOTPWithFallback(
      email,
      otp,
      c.env.SENDGRID_API_KEY,
      "vishal@noesyssoftware.com",
      "development",
    );
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return c.json({ success: false, message: "Failed to send OTP email" }, 500);
  }

  return c.json({
    success: true,
    message: "OTP sent successfully",
    data: { expires_in: OTP_TTL_MS / 1000 },
  });
});

authRoutes.post("/otp/verify", async (c) => {
  let body: { email?: string; code?: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: "Invalid JSON body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return c.json(
      { success: false, message: "Email and code are required" },
      400,
    );
  }

  const db = c.env.DB;
  const otp = await findValidOtp(db, email, code);

  if (!otp) {
    return c.json({ success: false, message: "Invalid or expired code" }, 400);
  }

  if (otp.expires_at < new Date().toISOString()) {
    await invalidateOtp(db, otp.id);

    return c.json(
      {
        success: false,
        message: "Invalid or expired OTP",
      },
      401,
    );
  }

  // otp is valid, so invalidate for repeated usage
  await invalidateOtp(db, otp.id);

  // look up the user tied to this email
  const user = await db
    .prepare(
      `SELECT id, email, name, auth_role, is_active FROM users WHERE email = ?`,
    )
    .bind(email)
    .first<{
      id: string;
      email: string;
      name: string;
      auth_role: "super_admin" | "admin";
      is_active: number;
    }>();

  if (!user) {
    return c.json(
      { success: false, message: "No account found for this email" },
      404,
    );
  }

  if (!user.is_active) {
    return c.json(
      { success: false, message: "This account has been deactivated" },
      403,
    );
  }

  const token = await generateJWT(
    { userId: user.id, email: user.email, role: user.auth_role },
    c.env.JWT_SECRET,
  );

  const isProd = c.env.ENVIRONMENT === "production";

  c.header(
    "Set-Cookie",
    `session=${token}; HttpOnly; ${isProd ? "Secure; SameSite=None" : "SameSite=Lax"}; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
  );
  
  return c.json({
    success: true,
    message: "OTP verified successfully",
  });
});

function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

authRoutes.get("/me", async (c) => {
  const cookieHeader = c.req.header("Cookie");
  const token = getCookieValue(cookieHeader, "session");

  if (!token) {
    return c.json({ success: false, message: "Not authenticated" }, 401);
  }

  let payload;
  try {
    payload = await verifyJWT(token, c.env.JWT_SECRET);
  } catch {
    return c.json(
      { success: false, message: "Invalid or expired session" },
      401,
    );
  }

  const email = payload.email as string;
  const db = c.env.DB;

  let user = await findUserByEmail(db, email);

  if (!user) {
    return c.json({ message: "Admin could not be found" });
  }

  if (!user.is_active) {
    return c.json({ success: false, message: "Account is deactivated" }, 403);
  }

  return c.json({
    message: "User authenticated successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      job_role: user.job_role,
      auth_role: user.auth_role,
      is_active: Boolean(user.is_active),
    },
  });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, "session", {
    path: "/",
  });

  return c.json({
    message: "Logged out successfully",
  });
});

export default authRoutes;
