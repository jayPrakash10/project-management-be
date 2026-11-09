import knex from 'knex';
import { types } from 'pg';
import { env } from './env';
import { buildKnexConfig } from './database';
import { camelToSnake, convertKeysToCamelCase } from '../utils/caseConversion';

// Return DATE columns (e.g. due_date) as 'YYYY-MM-DD' strings instead of JS Dates,
// which would otherwise be shifted by the server's timezone.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

export const db = knex({
  ...buildKnexConfig({
    connectionString: env.DATABASE_URL,
    useSsl: env.DB_SSL,
    poolMax: env.DB_POOL_MAX,
  }),
  // The database uses snake_case, the API uses camelCase. These hooks convert
  // identifiers at the boundary so the rest of the code only sees camelCase.
  wrapIdentifier: (value, originalImpl) => originalImpl(value === '*' ? value : camelToSnake(value)),
  postProcessResponse: (result) => convertKeysToCamelCase(result),
});
