import type { Knex } from 'knex';
import { FIELD_LIMITS } from '../src/config/constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('name', FIELD_LIMITS.SECTION_NAME).notNullable();
    table.integer('position').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['project_id', 'name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sections');
}
