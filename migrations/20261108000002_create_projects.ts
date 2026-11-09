import type { Knex } from 'knex';
import { FIELD_LIMITS } from '../src/config/constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', FIELD_LIMITS.PROJECT_NAME).notNullable();
    table.text('description');
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.timestamps(true, true);

    table.index('owner_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('projects');
}
