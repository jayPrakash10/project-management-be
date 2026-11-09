import type { Knex } from 'knex';
import { db } from '../config/db';
import type { ProjectMember } from '../types/models';

const MEMBER_COLUMNS = ['users.id as userId', 'users.name', 'users.email', 'users.role', 'project_members.joinedAt'];

function membersQuery(conn: Knex) {
  return conn('project_members').join('users', 'users.id', 'project_members.userId').select(MEMBER_COLUMNS);
}

export async function isMember(projectId: string, userId: string): Promise<boolean> {
  const row = await db('project_members').where({ projectId, userId }).first('userId');
  return row !== undefined;
}

export function findMember(projectId: string, userId: string, conn: Knex = db): Promise<ProjectMember | undefined> {
  return membersQuery(conn).where({ 'project_members.projectId': projectId, 'users.id': userId }).first();
}

export function listByProject(projectId: string): Promise<ProjectMember[]> {
  return membersQuery(db).where('project_members.projectId', projectId).orderBy('users.name');
}

export async function add(projectId: string, userId: string, conn: Knex = db): Promise<void> {
  await conn('project_members').insert({ projectId, userId });
}

export async function remove(projectId: string, userId: string, conn: Knex = db): Promise<void> {
  await conn('project_members').where({ projectId, userId }).delete();
}
