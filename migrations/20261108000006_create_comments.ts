import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('body').notNullable();
    table.timestamps(true, true);

    table.index('task_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comments');
}
