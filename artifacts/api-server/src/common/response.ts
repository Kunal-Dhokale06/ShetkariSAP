export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  metadata?: Record<string, unknown>;
}

export function createSuccessResponse<T>(
  data: T,
  message = "Success",
  metadata?: Record<string, unknown>,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    errors: [],
    metadata,
  };
}

export function createErrorResponse(
  message: string,
  errors: string[] = [],
): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
    errors,
  };
}
