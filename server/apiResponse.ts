import { Response, Request } from 'express';
import { ZodError } from 'zod';

/**
 * Standardized API Response utility class
 * Provides consistent error and success response formatting
 */
export class ApiResponse {
  /**
   * Send a successful response
   */
  static success(res: Response, data: any = null, message: string = 'Success') {
    return res.json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send a generic error response
   */
  static error(res: Response, statusCode: number, code: string, message: string, details?: any) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    });
  }

  /**
   * 400 Bad Request - Validation Error
   */
  static badRequest(res: Response, message: string = 'Bad Request', details?: any) {
    return this.error(res, 400, 'BAD_REQUEST', message, details);
  }

  /**
   * 400 Bad Request - Zod Validation Error
   */
  static zodValidation(res: Response, error: ZodError, req?: Request) {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    return this.error(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return this.error(res, 401, 'UNAUTHORIZED', message);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(res: Response, message: string = 'Forbidden') {
    return this.error(res, 403, 'FORBIDDEN', message);
  }

  /**
   * 404 Not Found
   */
  static notFound(res: Response, message: string = 'Resource not found') {
    return this.error(res, 404, 'NOT_FOUND', message);
  }

  /**
   * 409 Conflict
   */
  static conflict(res: Response, message: string = 'Conflict') {
    return this.error(res, 409, 'CONFLICT', message);
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(res: Response, message: string = 'Too many requests, please try again later') {
    return this.error(res, 429, 'RATE_LIMIT_EXCEEDED', message);
  }

  /**
   * 500 Internal Server Error
   */
  static internalError(res: Response, message: string = 'Internal server error', details?: any) {
    // In production, don't expose internal error details
    const isProd = process.env.NODE_ENV === 'production';
    return this.error(
      res, 
      500, 
      'INTERNAL_ERROR', 
      message,
      isProd ? undefined : details
    );
  }

  /**
   * 502 Bad Gateway
   */
  static badGateway(res: Response, message: string = 'Bad gateway') {
    return this.error(res, 502, 'BAD_GATEWAY', message);
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable(res: Response, message: string = 'Service temporarily unavailable') {
    return this.error(res, 503, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * This prevents the need for try-catch blocks in every route
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * This should be registered last in the middleware stack
 */
export const standardErrorMiddleware = (err: any, req: Request, res: Response, next: Function) => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log the error
  console.error('Error:', err);

  // Handle different error types
  if (err.name === 'ZodError') {
    return ApiResponse.zodValidation(res, err, req);
  }

  if (err.name === 'UnauthorizedError') {
    return ApiResponse.unauthorized(res, err.message || 'Unauthorized');
  }

  if (err.status === 404) {
    return ApiResponse.notFound(res, err.message || 'Resource not found');
  }

  if (err.status === 429) {
    return ApiResponse.tooManyRequests(res, err.message || 'Too many requests');
  }

  // Default to internal server error
  return ApiResponse.internalError(res, err.message || 'Internal server error', err);
};