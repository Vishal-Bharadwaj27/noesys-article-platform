import { SignJWT, jwtVerify } from 'jose';
 
/**
 * Generate JWT token for authenticated user
 * @param payload - User data to encode in token
 * @param secret - JWT secret key
 * @returns Signed JWT token string
 */
export async function generateJWT(payload: {
  userId: string;
  email: string;
  role: string;
}, secret: string) {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const jwt = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(new TextEncoder().encode(secret));
 
  return jwt;
}
 
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
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
 