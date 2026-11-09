import path from 'path';
import type { Knex } from 'knex';

interface KnexConfigOptions {
  connectionString: string;
  useSsl: boolean;
  poolMax: number;
}

// pg lets `sslmode` in the URL override the `ssl` option below. Supabase URLs
// ship with sslmode=require, which pg treats as full certificate verification
// and fails against Supabase's certificate chain, so we control SSL in code.
function removeSslModeParam(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

export function buildKnexConfig({ connectionString, useSsl, poolMax }: KnexConfigOptions): Knex.Config {
  return {
    client: 'pg',
    connection: {
      connectionString: removeSslModeParam(connectionString),
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    },
    // min 0 lets idle serverless instances release their connections.
    pool: { min: 0, max: poolMax },
    migrations: {
      directory: path.resolve(__dirname, '../../migrations'),
      extension: 'ts',
      loadExtensions: ['.ts'],
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, '../../seeds'),
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
  };
}
