import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import { ValidationError, type ErrorDetail } from '../utils/errors';

interface RequestSchemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

function toErrorDetails(location: string, error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: [location, ...issue.path].join('.'),
    message: issue.message,
  }));
}

// Parses params, query and body against Zod schemas. Parsed values replace the
// raw strings so controllers receive coerced numbers, defaults and trimmed text.
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const details: ErrorDetail[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data;
      } else {
        details.push(...toErrorDetails('params', result.error));
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        // Express 5 makes req.query read-only, so the parsed query lives on res.locals.
        res.locals.query = result.data;
      } else {
        details.push(...toErrorDetails('query', result.error));
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body ?? {});
      if (result.success) {
        req.body = result.data;
      } else {
        details.push(...toErrorDetails('body', result.error));
      }
    }

    if (details.length > 0) {
      throw new ValidationError('Validation failed', details);
    }
    next();
  };
}
