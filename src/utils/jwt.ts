import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { USER_ROLES, type UserRole } from '../config/constants';
import type { AuthUser } from '../types/models';
import { UnauthorizedError } from './errors';

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const { sub, role } = payload as Record<string, unknown>;
  return typeof sub === 'string' && USER_ROLES.includes(role as UserRole);
}

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!isAccessTokenPayload(payload)) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    return { id: payload.sub, role: payload.role };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
