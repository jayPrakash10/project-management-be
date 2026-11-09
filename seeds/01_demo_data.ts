import type { Knex } from 'knex';
import {
  ACTIVITY_ACTIONS,
  DEFAULT_SECTION_NAMES,
  DONE_STATUS,
  type TaskPriority,
  type TaskStatus,
  type UserRole,
} from '../src/config/constants';
import { addDays, todayIsoDate } from '../src/utils/date';
import { hashPassword } from '../src/utils/password';

// Seeds run through the knex CLI, which does not use the app's camelCase
// conversion, so every column here is written in snake_case.

const DEMO_PASSWORD = 'Password123!';

interface SeedUser {
  key: string;
  name: string;
  email: string;
  role: UserRole;
}

interface SeedTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  // Index into DEFAULT_SECTION_NAMES.
  section: number;
  // Relative to today; negative means the deadline has passed.
  dueInDays: number | null;
}

interface SeedProject {
  name: string;
  description: string;
  owner: string;
  members: string[];
  tasks: SeedTask[];
  comments: { taskIndex: number; author: string; body: string }[];
}

const USERS: SeedUser[] = [
  { key: 'admin', name: 'Ava Thompson', email: 'admin@taskflow.dev', role: 'admin' },
  { key: 'maya', name: 'Maya Patel', email: 'maya@taskflow.dev', role: 'manager' },
  { key: 'daniel', name: 'Daniel Kim', email: 'daniel@taskflow.dev', role: 'manager' },
  { key: 'priya', name: 'Priya Sharma', email: 'priya@taskflow.dev', role: 'member' },
  { key: 'leo', name: 'Leo Martins', email: 'leo@taskflow.dev', role: 'member' },
  { key: 'sara', name: 'Sara Chen', email: 'sara@taskflow.dev', role: 'member' },
  { key: 'omar', name: 'Omar Haddad', email: 'omar@taskflow.dev', role: 'member' },
];

const TODO = 0;
const IN_PROGRESS = 1;
const DONE = 2;

const PROJECTS: SeedProject[] = [
  {
    name: 'Website Redesign',
    description: 'Refresh the marketing site with the new brand and improve page speed.',
    owner: 'maya',
    members: ['priya', 'leo', 'sara'],
    tasks: [
      { title: 'Audit current site analytics', description: 'Find the top 20 pages by traffic and bounce rate.', status: 'done', priority: 'medium', assignee: 'priya', section: DONE, dueInDays: -10 },
      { title: 'Design new homepage hero', description: 'Three hero variations using the new brand palette.', status: 'in_review', priority: 'high', assignee: 'sara', section: IN_PROGRESS, dueInDays: 2 },
      { title: 'Build responsive navigation', description: 'Mobile-first nav with accessible dropdowns.', status: 'in_progress', priority: 'high', assignee: 'leo', section: IN_PROGRESS, dueInDays: 5 },
      { title: 'Migrate blog posts to new CMS', description: 'Move 120 posts and keep existing URLs working.', status: 'todo', priority: 'medium', assignee: 'priya', section: TODO, dueInDays: -2 },
      { title: 'Optimize images for Core Web Vitals', description: 'Convert to WebP and add lazy loading.', status: 'todo', priority: 'urgent', assignee: 'leo', section: TODO, dueInDays: 0 },
      { title: 'Write launch announcement', description: 'Blog post and newsletter copy for launch day.', status: 'todo', priority: 'low', assignee: null, section: TODO, dueInDays: 14 },
    ],
    comments: [
      { taskIndex: 1, author: 'maya', body: 'Variation B feels closest to the brand guide. Can we try it with a darker overlay?' },
      { taskIndex: 1, author: 'sara', body: 'Updated B with a 60% overlay. Ready for another look.' },
      { taskIndex: 3, author: 'priya', body: 'Blocked on CMS API credentials. Asked IT this morning.' },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Ship v1.0 of the iOS and Android apps to the stores.',
    owner: 'daniel',
    members: ['leo', 'omar'],
    tasks: [
      { title: 'Finalize onboarding flow', description: 'Three-screen onboarding with skip option.', status: 'done', priority: 'high', assignee: 'leo', section: DONE, dueInDays: -5 },
      { title: 'Set up crash reporting', description: 'Integrate crash reporting for both platforms.', status: 'in_progress', priority: 'medium', assignee: 'omar', section: IN_PROGRESS, dueInDays: 3 },
      { title: 'Prepare App Store screenshots', description: 'Six screenshots per device size.', status: 'todo', priority: 'medium', assignee: 'omar', section: TODO, dueInDays: 6 },
      { title: 'Submit build for review', description: 'Submit release candidate to both stores.', status: 'todo', priority: 'urgent', assignee: 'daniel', section: TODO, dueInDays: 9 },
      { title: 'Fix login timeout on Android', description: 'Session expires after backgrounding the app.', status: 'todo', priority: 'high', assignee: 'leo', section: TODO, dueInDays: -1 },
    ],
    comments: [
      { taskIndex: 4, author: 'leo', body: 'Reproduced on Android 14 only. Looking at the token refresh logic.' },
      { taskIndex: 1, author: 'daniel', body: 'Please include release-version tagging so we can filter by build.' },
    ],
  },
  {
    name: 'Q1 Marketing Campaign',
    description: 'Plan and run the Q1 product awareness campaign.',
    owner: 'maya',
    members: ['sara', 'omar'],
    tasks: [
      { title: 'Define campaign goals and KPIs', description: 'Agree on reach, sign-ups and cost per lead targets.', status: 'done', priority: 'high', assignee: 'sara', section: DONE, dueInDays: -15 },
      { title: 'Draft social media calendar', description: 'Eight weeks of posts across three channels.', status: 'in_progress', priority: 'medium', assignee: 'sara', section: IN_PROGRESS, dueInDays: 4 },
      { title: 'Record product demo video', description: 'Two-minute walkthrough of the core workflow.', status: 'todo', priority: 'high', assignee: 'omar', section: TODO, dueInDays: 12 },
      { title: 'Book webinar platform', description: 'Compare two vendors and book the cheaper one.', status: 'todo', priority: 'low', assignee: null, section: TODO, dueInDays: null },
    ],
    comments: [{ taskIndex: 2, author: 'maya', body: 'Keep it under two minutes; we will cut a 30-second version for ads.' }],
  },
];

async function clearTables(knex: Knex): Promise<void> {
  // Children first so foreign keys never block the delete.
  for (const table of ['activity_logs', 'comments', 'tasks', 'sections', 'project_members', 'projects', 'users']) {
    await knex(table).delete();
  }
}

async function insertUsers(knex: Knex): Promise<Map<string, string>> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const rows = await knex('users')
    .insert(USERS.map(({ name, email, role }) => ({ name, email, role, password_hash: passwordHash })))
    .returning(['id', 'email']);
  const idByEmail = new Map<string, string>(rows.map((row: { id: string; email: string }) => [row.email, row.id]));
  return new Map(USERS.map((user) => [user.key, idByEmail.get(user.email) as string]));
}

function resolveUserId(userIds: Map<string, string>, key: string): string {
  const id = userIds.get(key);
  if (!id) {
    throw new Error(`Unknown seed user: ${key}`);
  }
  return id;
}

async function insertProject(knex: Knex, spec: SeedProject, userIds: Map<string, string>): Promise<void> {
  const ownerId = resolveUserId(userIds, spec.owner);
  const [project] = await knex('projects')
    .insert({ name: spec.name, description: spec.description, owner_id: ownerId })
    .returning('id');

  const memberIds = [ownerId, ...spec.members.map((key) => resolveUserId(userIds, key))];
  await knex('project_members').insert(memberIds.map((userId) => ({ project_id: project.id, user_id: userId })));

  const sections = await knex('sections')
    .insert(DEFAULT_SECTION_NAMES.map((name, position) => ({ project_id: project.id, name, position })))
    .returning('id');

  const today = todayIsoDate();
  const tasks = await knex('tasks')
    .insert(
      spec.tasks.map((task) => ({
        project_id: project.id,
        section_id: sections[task.section].id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee ? resolveUserId(userIds, task.assignee) : null,
        created_by: ownerId,
        due_date: task.dueInDays === null ? null : addDays(today, task.dueInDays),
        completed_at: task.status === DONE_STATUS ? knex.fn.now() : null,
      })),
    )
    .returning(['id', 'title']);

  if (spec.comments.length > 0) {
    await knex('comments').insert(
      spec.comments.map((comment) => ({
        task_id: tasks[comment.taskIndex].id,
        author_id: resolveUserId(userIds, comment.author),
        body: comment.body,
      })),
    );
  }

  await knex('activity_logs').insert([
    { project_id: project.id, actor_id: ownerId, action: ACTIVITY_ACTIONS.PROJECT_CREATED, details: { name: spec.name } },
    ...tasks.map((task: { id: string; title: string }) => ({
      project_id: project.id,
      task_id: task.id,
      actor_id: ownerId,
      action: ACTIVITY_ACTIONS.TASK_CREATED,
      details: { title: task.title },
    })),
  ]);
}

export async function seed(knex: Knex): Promise<void> {
  await clearTables(knex);
  const userIds = await insertUsers(knex);
  for (const project of PROJECTS) {
    await insertProject(knex, project, userIds);
  }
  console.log(`Seeded ${USERS.length} users and ${PROJECTS.length} projects. Password for all users: ${DEMO_PASSWORD}`);
}
