'use client'

import { Generated, Kysely } from 'kysely'
import { createContext, useEffect, useState } from 'react'
import { SQLocalKysely } from 'sqlocal/kysely'
import { AudioProvider } from './audio'
import { AudioProviderProvider } from './audio-provider'

const InitialMigration: {
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

type TransactionSql = Parameters<Parameters<SQLocalKysely['transaction']>[0]>[0]

const Migrations: {
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

export const AudioProviderType = {
  SELFHOST: 'selfhost',
} as const

export type AudioProviderType =
  (typeof AudioProviderType)[keyof typeof AudioProviderType]

export type DB = {
  audio_provider: {
    id: string
    name: string
    url: string
    headers: string
    provider_type: AudioProviderType
    created_at?: string
  }
  audio: {
    id: string
    title: string
    artist?: string
    url: string
    downloaded: boolean
    thumbnail?: string
    provider_id: string
    created_at?: Generated<string>
  }
}

const notReady = (): never => {
  throw new Error('Database is not initialized')
}

export async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export const DatabaseContext = createContext<() => Kysely<DB>>(notReady)

export const DatabaseProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [database, setDatabase] = useState<Kysely<DB>>()

  function getDatabase() {
    if (database === undefined) return notReady()
    return database
  }

  useEffect(() => {
    async function prepareDatabase() {
      const { dialect, sql, transaction } = new SQLocalKysely('db.sqlite3')
      try {
        await InitialMigration.execute(sql)
        const result = await sql`SELECT MAX(version) version FROM migration`
        const lastVersion = result[0]?.version ?? 0
        for (const migration of Migrations) {
          if (lastVersion >= migration.version) continue
          await transaction((sql) => [
            sql`INSERT INTO migration (version, description) VALUES (${migration.version}, ${migration.description})`,
            migration.query(sql),
          ])
        }
        setDatabase(new Kysely<DB>({ dialect }))
      } catch (e) {
        console.error('Error During Migration:', e)
      }
    }
    prepareDatabase()
  }, [])

  return (
    <DatabaseContext.Provider value={getDatabase}>
      <AudioProviderProvider>
        <AudioProvider>{children}</AudioProvider>
      </AudioProviderProvider>
    </DatabaseContext.Provider>
  )
}
