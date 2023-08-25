import { SQLocalKysely } from 'sqlocal/kysely'

type TransactionSql = Parameters<Parameters<SQLocalKysely['transaction']>[0]>[0]

export const initialMigration: {
  version: number
  description: string
  execute: (sql: SQLocalKysely['sql']) => Promise<void>
} = {
  version: 0,
  description: 'Create migration table',
  async execute(sql) {
    await sql`PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS migration (
  version INTEGER PRIMARY KEY ,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
  },
}

export const migrations: {
  version: number
  description: string
  query: (sql: TransactionSql) => ReturnType<TransactionSql>
}[] = [
  {
    version: 1,
    description: 'Create table audio_provider',
    query(sql) {
      return sql`CREATE TABLE audio_provider (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  headers TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
  },
  {
    version: 2,
    description: 'Create table audio',
    query(sql) {
      return sql`CREATE TABLE audio (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  downloaded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provider_id TEXT NOT NULL,
  artist TEXT,
  thumbnail TEXT,
  FOREIGN KEY (provider_id) REFERENCES audio_provider (id)
);`
    },
  },
]
