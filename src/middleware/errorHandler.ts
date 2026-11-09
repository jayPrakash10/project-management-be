import type { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../utils/errors';

const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
} as const;

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === code;
}

function isMalformedJson(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { type?: unknown }).type === 'entity.parse.failed';
}

function toHttpError(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: { code: error.code, message: error.message, details: error.details },
    };
  }
  if (isMalformedJson(error)) {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      body: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    };
  }
  if (hasCode(error, PG_ERROR_CODES.UNIQUE_VIOLATION)) {
    return {
      status: HTTP_STATUS.CONFLICT,
      body: { code: 'CONFLICT', message: 'A record with these values already exists' },
    };
  }
  if (hasCode(error, PG_ERROR_CODES.FOREIGN_KEY_VIOLATION)) {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      body: { code: 'INVALID_REFERENCE', message: 'A referenced record does not exist' },
    };
  }
  return {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    body: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  };
}

// Express recognises error handlers by their four arguments, so `_next` must stay.
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const { status, body } = toHttpError(error);
  if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }
  res.status(status).json({ error: body });
}
