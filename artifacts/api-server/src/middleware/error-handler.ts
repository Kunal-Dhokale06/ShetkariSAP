import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { createErrorResponse } from "../common/response";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction) {
  res.status(404).json(createErrorResponse("Route not found"));
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json(createErrorResponse(message));
};
