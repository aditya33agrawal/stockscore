/**
 * lib/api/errors.ts
 *
 * Typed API error classes used by route wrappers and handlers.
 * withErrorHandler maps these to structured JSON responses.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message, "forbidden");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message, "not_found");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown, message = "Invalid request") {
    super(400, message, "validation", details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests") {
    super(429, message, "rate_limited");
    this.name = "RateLimitError";
  }
}

export class MethodNotAllowedError extends ApiError {
  constructor(allowed: string[]) {
    super(405, `Method not allowed. Allowed: ${allowed.join(", ")}`, "method_not_allowed");
    this.name = "MethodNotAllowedError";
  }
}
