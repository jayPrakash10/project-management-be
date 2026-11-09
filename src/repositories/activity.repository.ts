import type { Knex } from 'knex';
import { db } from '../config/db';
import type { ActivityAction } from '../config/constants';
import type { ActivityLog, PageResult } from '../types/models';
import { getOffset, type PageQuery } from '../utils/pagination';

export interface NewActivity {
  projectId: string;
  taskId?: string | null;
  actorId: string;
  action: ActivityAction;
  details?: Record<string, unknown>;
}

export async function record(activity: NewActivity, conn: Knex = db): Promise<void> {
  await conn('activity_logs').insert({ ...activity, details: activity.details ?? {} });
}

export async function listByProject(projectId: string, page: PageQuery): Promise<PageResult<ActivityLog>> {
  const [items, [{ count }]] = await Promise.all([
    db('activity_logs')
      .join('users as actor', 'actor.id', 'activity_logs.actorId')
      .select('activity_logs.*', 'actor.name as actorName')
      .where('activity_logs.projectId', projectId)
      .orderBy('activity_logs.createdAt', 'desc')
      .limit(page.limit)
      .offset(getOffset(page)),
    db('activity_logs').where({ projectId }).count({ count: '*' }),
  ]);
  return { items, total: Number(count) };
}
