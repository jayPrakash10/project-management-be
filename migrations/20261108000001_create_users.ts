import type { Knex } from 'knex';
import { DEFAULT_USER_ROLE, FIELD_LIMITS, USER_ROLES } from '../src/config/constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', FIELD_LIMITS.USER_NAME).notNullable();
    table.string('email', FIELD_LIMITS.EMAIL).notNullable().unique();
    table.string('password_hash').notNullable();
    table.enu('role', [...USER_ROLES]).notNullable().defaultTo(DEFAULT_USER_ROLE);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
