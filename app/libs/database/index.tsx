'use client'

import { Kysely } from 'kysely'
import { createContext, useEffect, useState } from 'react'
import { SQLocalKysely } from 'sqlocal/kysely'
import { AudioProviderTable } from './audio-provider'
import { initialMigration, migrations } from './migration'
import { AudioTable } from './audio'

export type Tables = {
  audio_provider: AudioProviderTable
  audio: AudioTable
}
export type Database = Kysely<Tables>

export class DatabaseError extends Error {}

export class DatabaseNotInitialized extends DatabaseError {
  constructor() {
    super('Database is not initialized')
  }
}

export const DatabaseContext = createContext<Database | null>(null)

export const DatabaseProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [database, setDatabase] = useState<Database | null>(null)

  useEffect(() => {
    prepareDatabase()
  }, [])

  const prepareDatabase = async () => {
    const { dialect, sql, transaction } = new SQLocalKysely('db.sqlite3')
    try {
      await initialMigration.execute(sql)
      const result = await sql`SELECT MAX(version) version FROM migration`
      const lastVersion = result[0]?.version ?? 0
      for (const migration of migrations) {
        if (lastVersion >= migration.version) continue
        await transaction((sql) => [
          sql`INSERT INTO migration (version, description) VALUES (${migration.version}, ${migration.description})`,
          migration.query(sql),
        ])
      }
      setDatabase(new Kysely<Tables>({ dialect }))
    } catch (e) {
      console.error('Error During Migration:', e)
    }
  }

  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  )
}
