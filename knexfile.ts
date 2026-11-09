import 'dotenv/config';
import type { Knex } from 'knex';
import { buildKnexConfig } from './src/config/database';

// Migrations need a direct (session) connection; the transaction-mode
// pooler used at runtime does not support the session features knex relies on.
const connectionString =
  process.env.DATABASE_URL_DIRECT ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Set DATABASE_URL_DIRECT (or DATABASE_URL) before running migrations');
}

const config: Knex.Config = buildKnexConfig({
  connectionString,
  useSsl: process.env.DB_SSL !== 'false',
  poolMax: 1,
});

export = config;
