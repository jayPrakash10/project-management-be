import type { Request } from 'express';
import type { AuthUser } from '../types/models';
import { UnauthorizedError } from './errors';

// Typed access to the user set by the authenticate middleware.
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}
