import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_members', (table) => {
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(['project_id', 'user_id']);
    // The composite primary key covers lookups by project; this covers "my projects".
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('project_members');
}
