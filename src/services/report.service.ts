import { DONE_STATUS, TASK_STATUSES, type TaskStatus } from '../config/constants';
import * as activityRepository from '../repositories/activity.repository';
import * as taskRepository from '../repositories/task.repository';
import type { ActivityLog, AuthUser, PageResult } from '../types/models';
import type { PageQuery } from '../utils/pagination';
import { getProjectForMember } from './access.service';

const PERCENT = 100;

export interface ProjectSummary {
  projectId: string;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTasks: number;
  completionPercentage: number;
}

function emptyStatusCounts(): Record<TaskStatus, number> {
  return Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;
}

export async function getProjectSummary(actor: AuthUser, projectId: string): Promise<ProjectSummary> {
  await getProjectForMember(projectId, actor);
  const [statusCounts, overdueTasks] = await Promise.all([
    taskRepository.countByStatus(projectId),
    taskRepository.countOverdue(projectId),
  ]);

  const tasksByStatus = emptyStatusCounts();
  for (const { status, count } of statusCounts) {
    tasksByStatus[status] = count;
  }
  const totalTasks = statusCounts.reduce((sum, { count }) => sum + count, 0);
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((tasksByStatus[DONE_STATUS] / totalTasks) * PERCENT);

  return { projectId, totalTasks, tasksByStatus, overdueTasks, completionPercentage };
}

export async function getProjectActivity(
  actor: AuthUser,
  projectId: string,
  page: PageQuery,
): Promise<PageResult<ActivityLog>> {
  await getProjectForMember(projectId, actor);
  return activityRepository.listByProject(projectId, page);
}
