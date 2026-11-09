import type { Knex } from 'knex';
import { db } from '../config/db';
import type { SortOrder } from '../config/constants';
import type { PageResult, Project } from '../types/models';
import { getOffset, type PageQuery } from '../utils/pagination';

interface NewProject {
  name: string;
  description?: string | null;
  ownerId: string;
}

interface ProjectChanges {
  name?: string;
  description?: string | null;
}

export interface ProjectFilters extends PageQuery {
  // When set, only projects this user is a member of are returned.
  memberUserId?: string;
  search?: string;
  sortBy: 'createdAt' | 'name';
  order: SortOrder;
}

export function findById(id: string): Promise<Project | undefined> {
  return db('projects').where({ id }).first();
}

export async function create(project: NewProject, conn: Knex = db): Promise<Project> {
  const [created] = await conn('projects').insert(project).returning('*');
  return created;
}

export async function update(id: string, changes: ProjectChanges): Promise<Project> {
  const [updated] = await db('projects')
    .where({ id })
    .update({ ...changes, updatedAt: db.fn.now() })
    .returning('*');
  return updated;
}

export async function remove(id: string): Promise<void> {
  await db('projects').where({ id }).delete();
}

export async function list(filters: ProjectFilters): Promise<PageResult<Project>> {
  const query = db('projects');
  if (filters.memberUserId) {
    query.whereIn('id', db('project_members').select('projectId').where({ userId: filters.memberUserId }));
  }
  if (filters.search) {
    query.whereILike('name', `%${filters.search}%`);
  }

  const [items, [{ count }]] = await Promise.all([
    query
      .clone()
      .select('*')
      .orderBy(filters.sortBy, filters.order)
      .limit(filters.limit)
      .offset(getOffset(filters)),
    query.clone().count({ count: '*' }),
  ]);
  return { items, total: Number(count) };
}
