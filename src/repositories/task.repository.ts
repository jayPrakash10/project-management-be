import type { Knex } from 'knex';
import { db } from '../config/db';
import {
  DAYS_IN_WEEK,
  DONE_STATUS,
  TASK_PRIORITIES,
  type DueStatus,
  type SortOrder,
  type TaskPriority,
  type TaskStatus,
} from '../config/constants';
import type { PageResult, Task } from '../types/models';
import { addDays, todayIsoDate } from '../utils/date';
import { getOffset, type PageQuery } from '../utils/pagination';

interface NewTask {
  projectId: string;
  sectionId: string | null;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  assigneeId?: string | null;
  createdBy: string;
  dueDate?: string | null;
}

export interface TaskChanges {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  sectionId?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
  completedAt?: Date | null;
}

export interface TaskFilters extends PageQuery {
  projectId?: string;
  assigneeId?: string;
  sectionId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueStatus?: DueStatus;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  sortBy: 'dueDate' | 'priority' | 'createdAt';
  order: SortOrder;
}

export interface StatusCount {
  status: TaskStatus;
  count: number;
}

function tasksWithAssignee(conn: Knex) {
  return conn('tasks')
    .leftJoin('users as assignee', 'assignee.id', 'tasks.assigneeId')
    .select('tasks.*', 'assignee.name as assigneeName');
}

function applyDueStatus(query: Knex.QueryBuilder, dueStatus: DueStatus): void {
  const today = todayIsoDate();
  if (dueStatus === 'overdue') {
    query.where('tasks.dueDate', '<', today);
  } else if (dueStatus === 'due_today') {
    query.where('tasks.dueDate', today);
  } else {
    query.whereBetween('tasks.dueDate', [today, addDays(today, DAYS_IN_WEEK - 1)]);
  }
  // A finished task is never overdue or "due".
  query.whereNot('tasks.status', DONE_STATUS);
}

function applyFilters(query: Knex.QueryBuilder, filters: TaskFilters): void {
  const exactMatches = {
    projectId: filters.projectId,
    assigneeId: filters.assigneeId,
    sectionId: filters.sectionId,
    status: filters.status,
    priority: filters.priority,
  };
  for (const [column, value] of Object.entries(exactMatches)) {
    if (value !== undefined) {
      query.where(`tasks.${column}`, value);
    }
  }
  if (filters.dueStatus) {
    applyDueStatus(query, filters.dueStatus);
  }
  if (filters.dueBefore) {
    query.where('tasks.dueDate', '<=', filters.dueBefore);
  }
  if (filters.dueAfter) {
    query.where('tasks.dueDate', '>=', filters.dueAfter);
  }
  if (filters.search) {
    query.whereILike('tasks.title', `%${filters.search}%`);
  }
}

// Priorities are stored as text, so rank them explicitly instead of sorting alphabetically.
function orderByPriority(query: Knex.QueryBuilder, order: SortOrder): void {
  const cases = TASK_PRIORITIES.map(() => 'WHEN ? THEN ?').join(' ');
  const bindings = TASK_PRIORITIES.flatMap((priority, rank) => [priority, rank]);
  query.orderByRaw(`CASE tasks.priority ${cases} END ${order}`, bindings);
}

function applySorting(query: Knex.QueryBuilder, sortBy: TaskFilters['sortBy'], order: SortOrder): void {
  if (sortBy === 'priority') {
    orderByPriority(query, order);
  } else if (sortBy === 'dueDate') {
    query.orderBy('tasks.dueDate', order, 'last');
  }
  query.orderBy('tasks.createdAt', sortBy === 'createdAt' ? order : 'desc');
}

export function findById(id: string, conn: Knex = db): Promise<Task | undefined> {
  return tasksWithAssignee(conn).where('tasks.id', id).first();
}

export async function create(task: NewTask, conn: Knex = db): Promise<Task> {
  const [created] = await conn('tasks').insert(task).returning('*');
  return created;
}

export async function update(id: string, changes: TaskChanges, conn: Knex = db): Promise<void> {
  await conn('tasks')
    .where({ id })
    .update({ ...changes, updatedAt: db.fn.now() });
}

export async function remove(id: string, conn: Knex = db): Promise<void> {
  await conn('tasks').where({ id }).delete();
}

export async function list(filters: TaskFilters): Promise<PageResult<Task>> {
  const itemsQuery = tasksWithAssignee(db);
  const countQuery = db('tasks').count({ count: '*' });
  applyFilters(itemsQuery, filters);
  applyFilters(countQuery, filters);
  applySorting(itemsQuery, filters.sortBy, filters.order);

  const [items, [{ count }]] = await Promise.all([
    itemsQuery.limit(filters.limit).offset(getOffset(filters)),
    countQuery,
  ]);
  return { items, total: Number(count) };
}

export async function unassignOpenTasks(projectId: string, userId: string, conn: Knex = db): Promise<number> {
  return conn('tasks')
    .where({ projectId, assigneeId: userId })
    .whereNot({ status: DONE_STATUS })
    .update({ assigneeId: null, updatedAt: db.fn.now() });
}

export async function countByStatus(projectId: string): Promise<StatusCount[]> {
  const rows: { status: TaskStatus; count: string }[] = await db('tasks')
    .where({ projectId })
    .groupBy('status')
    .select('status', db.raw('count(*) as count'));
  return rows.map((row) => ({ status: row.status, count: Number(row.count) }));
}

export async function countOverdue(projectId: string): Promise<number> {
  const [{ count }] = await db('tasks')
    .where({ projectId })
    .where('dueDate', '<', todayIsoDate())
    .whereNot({ status: DONE_STATUS })
    .count({ count: '*' });
  return Number(count);
}
