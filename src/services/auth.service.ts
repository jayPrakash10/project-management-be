import { DEFAULT_USER_ROLE } from '../config/constants';
import * as userRepository from '../repositories/user.repository';
import type { PublicUser } from '../types/models';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { signAccessToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

interface AuthResult {
  user: PublicUser;
  token: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }
  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: DEFAULT_USER_ROLE,
  });
  return { user, token: signAccessToken(user) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findByEmailWithPassword(input.email);
  // Same message for unknown email and wrong password so attackers can't probe for accounts.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { user: publicUser, token: signAccessToken(publicUser) };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
