import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  req.user = verifyAccessToken(header.slice(BEARER_PREFIX.length));
  next();
}
