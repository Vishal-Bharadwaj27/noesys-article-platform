import { jwtVerify } from "jose";

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @param secret - JWT secret key
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(token: string, secret: string) {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
