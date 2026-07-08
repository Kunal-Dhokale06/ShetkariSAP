import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

interface TokenPayload {
  sub: string;
  role?: string;
  exp?: number;
  iat?: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

export function signAccessToken(payload: TokenPayload): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + TOKEN_TTL_SECONDS,
    ver: TOKEN_VERSION,
  };

  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const body = JSON.stringify(tokenPayload);
  const headerSegment = base64UrlEncode(header);
  const bodySegment = base64UrlEncode(body);
  const signingInput = `${headerSegment}.${bodySegment}`;
  const signature = createSignature(signingInput);

  return `${signingInput}.${signature}`;
}

export function verifyAccessToken(token: string): TokenPayload {
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new Error("Invalid access token format");
  }

  const [headerSegment, payloadSegment, signature] = segments;
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = createSignature(signingInput);
  const actualSignature = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualSignature.length !== expectedBuffer.length || !timingSafeEqual(actualSignature, expectedBuffer)) {
    throw new Error("Invalid access token signature");
  }

  const payload = JSON.parse(base64UrlDecode(payloadSegment)) as TokenPayload & { exp?: number };
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp <= now) {
    throw new Error("Access token expired");
  }

  if (!payload.sub) {
    throw new Error("Access token missing subject");
  }

  return payload;
}
