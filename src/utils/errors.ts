import { HTTP_STATUS } from '../config/constants';

export interface ErrorDetail {
  field: string;
  message: string;
}

// Errors that are safe to show to the client. Anything else becomes a generic 500.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetail[]) {
    super(HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS.CONFLICT, 'CONFLICT', message);
  }
}
