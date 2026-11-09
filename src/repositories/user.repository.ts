import type { Knex } from 'knex';
import { db } from '../config/db';
import type { UserRole } from '../config/constants';
import type { PageResult, PublicUser, User } from '../types/models';
import { getOffset, type PageQuery } from '../utils/pagination';

// Every query that returns users to callers selects these columns, so the
// password hash can never leak by accident.
const PUBLIC_COLUMNS = ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'];

interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserFilters extends PageQuery {
  search?: string;
  role?: UserRole;
}

export function findByEmailWithPassword(email: string): Promise<User | undefined> {
  return db('users').where({ email }).first();
}

export function findById(id: string, conn: Knex = db): Promise<PublicUser | undefined> {
  return conn('users').select(PUBLIC_COLUMNS).where({ id }).first();
}

export function findByEmail(email: string): Promise<PublicUser | undefined> {
  return db('users').select(PUBLIC_COLUMNS).where({ email }).first();
}

export async function create(user: NewUser): Promise<PublicUser> {
  const [created] = await db('users').insert(user).returning(PUBLIC_COLUMNS);
  return created;
}

export async function updateRole(id: string, role: UserRole): Promise<PublicUser | undefined> {
  const [updated] = await db('users')
    .where({ id })
    .update({ role, updatedAt: db.fn.now() })
    .returning(PUBLIC_COLUMNS);
  return updated;
}

export async function list(filters: UserFilters): Promise<PageResult<PublicUser>> {
  const query = db('users');
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    query.where((builder) => builder.whereILike('name', pattern).orWhereILike('email', pattern));
  }
  if (filters.role) {
    query.where({ role: filters.role });
  }

  const [items, [{ count }]] = await Promise.all([
    query.clone().select(PUBLIC_COLUMNS).orderBy('name').limit(filters.limit).offset(getOffset(filters)),
    query.clone().count({ count: '*' }),
  ]);
  return { items, total: Number(count) };
}
