import type { Knex } from 'knex';
import { db } from '../config/db';
import type { Section } from '../types/models';

interface NewSection {
  projectId: string;
  name: string;
  position: number;
}

interface SectionChanges {
  name?: string;
  position?: number;
}

export function findById(id: string): Promise<Section | undefined> {
  return db('sections').where({ id }).first();
}

export function findFirstInProject(projectId: string): Promise<Section | undefined> {
  return db('sections').where({ projectId }).orderBy([{ column: 'position' }, { column: 'createdAt' }]).first();
}

export function listByProject(projectId: string): Promise<Section[]> {
  return db('sections').where({ projectId }).orderBy([{ column: 'position' }, { column: 'createdAt' }]);
}

export async function getNextPosition(projectId: string): Promise<number> {
  const row = await db('sections').where({ projectId }).max({ maxPosition: 'position' }).first();
  const maxPosition = row?.maxPosition;
  if (maxPosition === null || maxPosition === undefined) {
    return 0;
  }
  return Number(maxPosition) + 1;
}

export async function create(section: NewSection): Promise<Section> {
  const [created] = await db('sections').insert(section).returning('*');
  return created;
}

export async function createMany(sections: NewSection[], conn: Knex = db): Promise<Section[]> {
  return conn('sections').insert(sections).returning('*');
}

export async function update(id: string, changes: SectionChanges): Promise<Section> {
  const [updated] = await db('sections').where({ id }).update(changes).returning('*');
  return updated;
}

export async function remove(id: string): Promise<void> {
  await db('sections').where({ id }).delete();
}
