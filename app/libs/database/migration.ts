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
  CONSTRAINT audio_provider_id FOREIGN KEY (provider_id) REFERENCES audio_provider (id)
);`
    },
  },
  {
    version: 3,
    description: 'Create table playlist and playlist_audio',
    query(sql) {
      return sql`
CREATE TABLE playlist (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE playlist_audio (
  playlist_id TEXT NOT NULL,
  audio_id TEXT NOT NULL,
  PRIMARY KEY (playlist_id, audio_id),
  CONSTRAINT playlist_audio_playlist_id FOREIGN KEY (playlist_id) REFERENCES playlist (id) ON DELETE CASCADE,
  CONSTRAINT playlist_audio_audio_id FOREIGN KEY (audio_id) REFERENCES audio (id) ON DELETE CASCADE
);`
    },
  },
]
