import type { Knex } from 'knex';
import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  FIELD_LIMITS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../src/config/constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('section_id').references('id').inTable('sections').onDelete('SET NULL');
    table.string('title', FIELD_LIMITS.TASK_TITLE).notNullable();
    table.text('description');
    table.enu('status', [...TASK_STATUSES]).notNullable().defaultTo(DEFAULT_TASK_STATUS);
    table.enu('priority', [...TASK_PRIORITIES]).notNullable().defaultTo(DEFAULT_TASK_PRIORITY);
    table.uuid('assignee_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.date('due_date');
    table.timestamp('completed_at', { useTz: true });
    table.timestamps(true, true);

    table.index('project_id');
    table.index('section_id');
    table.index('assignee_id');
    table.index('due_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tasks');
}
