import type { Knex } from 'knex';
import { db } from '../config/db';
import { ACTIVITY_ACTIONS, DONE_STATUS, type TaskStatus } from '../config/constants';
import * as activityRepository from '../repositories/activity.repository';
import * as memberRepository from '../repositories/member.repository';
import * as sectionRepository from '../repositories/section.repository';
import * as taskRepository from '../repositories/task.repository';
import type { AuthUser, PageResult, Project, Task } from '../types/models';
import { todayIsoDate } from '../utils/date';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  CreateTaskInput,
  ListMyTasksQuery,
  ListProjectTasksQuery,
  UpdateTaskInput,
} from '../validators/task.validator';
import { assertCanManageProject, getProjectForMember } from './access.service';

export interface TaskResponse extends Task {
  isOverdue: boolean;
}

// ---------- Helpers ----------

function isOverdue(task: Task): boolean {
  return task.dueDate !== null && task.status !== DONE_STATUS && task.dueDate < todayIsoDate();
}

function toTaskResponse(task: Task): TaskResponse {
  return { ...task, isOverdue: isOverdue(task) };
}

async function findTaskOrThrow(taskId: string, conn: Knex = db): Promise<Task> {
  const task = await taskRepository.findById(taskId, conn);
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  return task;
}

// Also used by the comment service, which applies the same task-level access rules.
export async function getTaskForMember(actor: AuthUser, taskId: string): Promise<{ task: Task; project: Project }> {
  const task = await findTaskOrThrow(taskId);
  const project = await getProjectForMember(task.projectId, actor);
  return { task, project };
}

function assertDueDateNotInPast(dueDate: string | null | undefined): void {
  if (dueDate && dueDate < todayIsoDate()) {
    throw new ValidationError('Due date cannot be in the past', [
      { field: 'body.dueDate', message: 'Due date cannot be in the past' },
    ]);
  }
}

async function assertSectionInProject(sectionId: string, projectId: string): Promise<void> {
  const section = await sectionRepository.findById(sectionId);
  if (!section || section.projectId !== projectId) {
    throw new ValidationError('Section does not belong to this project', [
      { field: 'body.sectionId', message: 'Section does not belong to this project' },
    ]);
  }
}

async function assertAssigneeIsMember(assigneeId: string, projectId: string): Promise<void> {
  if (!(await memberRepository.isMember(projectId, assigneeId))) {
    throw new ValidationError('Assignee must be a member of this project', [
      { field: 'body.assigneeId', message: 'Assignee must be a member of this project' },
    ]);
  }
}

// New tasks land in the requested section, or the project's first section (like Asana).
async function resolveSectionId(projectId: string, sectionId: string | undefined): Promise<string | null> {
  if (sectionId) {
    await assertSectionInProject(sectionId, projectId);
    return sectionId;
  }
  const firstSection = await sectionRepository.findFirstInProject(projectId);
  return firstSection?.id ?? null;
}

// ---------- Queries ----------

export async function listProjectTasks(
  actor: AuthUser,
  projectId: string,
  query: ListProjectTasksQuery,
): Promise<PageResult<TaskResponse>> {
  await getProjectForMember(projectId, actor);
  const result = await taskRepository.list({ ...query, projectId });
  return { items: result.items.map(toTaskResponse), total: result.total };
}

export async function listMyTasks(actor: AuthUser, query: ListMyTasksQuery): Promise<PageResult<TaskResponse>> {
  const result = await taskRepository.list({ ...query, assigneeId: actor.id });
  return { items: result.items.map(toTaskResponse), total: result.total };
}

export async function getTask(actor: AuthUser, taskId: string): Promise<TaskResponse> {
  const { task } = await getTaskForMember(actor, taskId);
  return toTaskResponse(task);
}

// ---------- Commands ----------

export async function createTask(actor: AuthUser, projectId: string, input: CreateTaskInput): Promise<TaskResponse> {
  const project = await getProjectForMember(projectId, actor);
  assertDueDateNotInPast(input.dueDate);
  if (input.assigneeId) {
    assertCanManageProject(project, actor);
    await assertAssigneeIsMember(input.assigneeId, projectId);
  }
  const sectionId = await resolveSectionId(projectId, input.sectionId);

  return db.transaction(async (trx) => {
    const created = await taskRepository.create({ ...input, projectId, sectionId, createdBy: actor.id }, trx);
    await activityRepository.record(
      {
        projectId,
        taskId: created.id,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.TASK_CREATED,
        details: { title: created.title },
      },
      trx,
    );
    if (input.assigneeId) {
      await activityRepository.record(
        {
          projectId,
          taskId: created.id,
          actorId: actor.id,
          action: ACTIVITY_ACTIONS.TASK_ASSIGNED,
          details: { assigneeId: input.assigneeId, previousAssigneeId: null },
        },
        trx,
      );
    }
    return toTaskResponse(await findTaskOrThrow(created.id, trx));
  });
}

export async function updateTask(actor: AuthUser, taskId: string, input: UpdateTaskInput): Promise<TaskResponse> {
  const { task } = await getTaskForMember(actor, taskId);
  assertDueDateNotInPast(input.dueDate);
  if (input.sectionId) {
    await assertSectionInProject(input.sectionId, task.projectId);
  }
  await taskRepository.update(taskId, input);
  return toTaskResponse(await findTaskOrThrow(taskId));
}

export async function assignTask(actor: AuthUser, taskId: string, assigneeId: string | null): Promise<TaskResponse> {
  const { task, project } = await getTaskForMember(actor, taskId);
  assertCanManageProject(project, actor);
  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId, task.projectId);
  }
  if (assigneeId === task.assigneeId) {
    return toTaskResponse(task);
  }

  return db.transaction(async (trx) => {
    await taskRepository.update(taskId, { assigneeId }, trx);
    await activityRepository.record(
      {
        projectId: task.projectId,
        taskId,
        actorId: actor.id,
        action: assigneeId ? ACTIVITY_ACTIONS.TASK_ASSIGNED : ACTIVITY_ACTIONS.TASK_UNASSIGNED,
        details: { assigneeId, previousAssigneeId: task.assigneeId },
      },
      trx,
    );
    return toTaskResponse(await findTaskOrThrow(taskId, trx));
  });
}

// Any status can move to any other; completedAt tracks when a task was finished.
export async function changeStatus(actor: AuthUser, taskId: string, status: TaskStatus): Promise<TaskResponse> {
  const { task } = await getTaskForMember(actor, taskId);
  if (status === task.status) {
    return toTaskResponse(task);
  }
  const completedAt = status === DONE_STATUS ? new Date() : null;

  return db.transaction(async (trx) => {
    await taskRepository.update(taskId, { status, completedAt }, trx);
    await activityRepository.record(
      {
        projectId: task.projectId,
        taskId,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
        details: { from: task.status, to: status },
      },
      trx,
    );
    return toTaskResponse(await findTaskOrThrow(taskId, trx));
  });
}

export async function deleteTask(actor: AuthUser, taskId: string): Promise<void> {
  const { task, project } = await getTaskForMember(actor, taskId);
  assertCanManageProject(project, actor);

  await db.transaction(async (trx) => {
    await taskRepository.remove(taskId, trx);
    await activityRepository.record(
      {
        projectId: task.projectId,
        actorId: actor.id,
        action: ACTIVITY_ACTIONS.TASK_DELETED,
        details: { taskId, title: task.title },
      },
      trx,
    );
  });
}
