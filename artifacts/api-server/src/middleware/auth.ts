import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth";
import { createErrorResponse } from "../common/response";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    res.status(401).json(createErrorResponse("Authentication required"));
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      sub: payload.sub,
      role: payload.role ?? "user",
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid authentication token";
    res.status(401).json(createErrorResponse(message));
  }
}
