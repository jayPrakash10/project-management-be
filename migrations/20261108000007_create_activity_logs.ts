import type { Knex } from 'knex';

const ACTION_MAX_LENGTH = 50;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    // Logs outlive deleted tasks so the project history stays intact.
    table.uuid('task_id').references('id').inTable('tasks').onDelete('SET NULL');
    table.uuid('actor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action', ACTION_MAX_LENGTH).notNullable();
    table.jsonb('details').notNullable().defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['project_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('activity_logs');
}
