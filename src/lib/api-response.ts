/**
 * Centralized API Response & Error Handling Helper
 * 
 * Provides standardized JSON response formatting and high-order error handling
 * for all Next.js API route handlers.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Creates a standard JSON success response
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json(data, { status });
}

/**
 * Creates a standard JSON error response
 */
export function errorResponse(message: string, status: number = 400): Response {
  return Response.json(
    { error: message, statusCode: status },
    { status }
  );
}

/**
 * Higher-order function wrapping API route handlers with centralized error handling.
 */
export function withErrorHandler(
  handler: (request: Request, context: any) => Promise<Response>
) {
  return async (request: Request, context: any = {}): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      console.error(`[API Error] ${request.method} ${request.url}:`, error);
      const message = error?.message || "Internal Server Error";
      return errorResponse(message, 500);
    }
  };
}
