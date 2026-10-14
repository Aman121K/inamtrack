import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret"
);

export interface TokenPayload {
  agentId: string;
  phone: string;
}

export interface AdminTokenPayload {
  role: "super_admin";
  phone: string;
}

export async function signAdminToken(
  payload: AdminTokenPayload
): Promise<string> {
  console.log(`[JWT] Signing admin token for ${payload.phone}`);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "super_admin") return null;
    return payload as unknown as AdminTokenPayload;
  } catch (e) {
    console.warn(`[JWT] Admin token verification failed: ${(e as Error).message}`);
    return null;
  }
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  console.log(`[JWT] Signing access token for agent ${payload.agentId}`);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  console.log(`[JWT] Signing refresh token for agent ${payload.agentId}`);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (e) {
    console.warn(`[JWT] Access token verification failed: ${(e as Error).message}`);
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as TokenPayload;
  } catch (e) {
    console.warn(`[JWT] Refresh token verification failed: ${(e as Error).message}`);
    return null;
  }
}
