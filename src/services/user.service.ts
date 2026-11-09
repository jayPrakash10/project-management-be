import type { UserRole } from '../config/constants';
import * as userRepository from '../repositories/user.repository';
import type { AuthUser, PageResult, PublicUser } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import type { ListUsersQuery } from '../validators/user.validator';

export function listUsers(query: ListUsersQuery): Promise<PageResult<PublicUser>> {
  return userRepository.list(query);
}

export async function changeRole(actor: AuthUser, userId: string, role: UserRole): Promise<PublicUser> {
  // Prevents an admin from accidentally removing the last admin access (their own).
  if (actor.id === userId) {
    throw new ConflictError('You cannot change your own role');
  }
  const updated = await userRepository.updateRole(userId, role);
  if (!updated) {
    throw new NotFoundError('User not found');
  }
  return updated;
}
