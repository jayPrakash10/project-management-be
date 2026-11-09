import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '../config/constants';
import { ForbiddenError } from '../utils/errors';
import { getAuthUser } from '../utils/request';

// Global role check. Project-level rules (owner, member) live in the services.
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = getAuthUser(req);
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
