'use client'

import { Database } from '.'
import { Generated, Insertable, Selectable, Updateable } from 'kysely'

export const AudioProviderType = {
  SELFHOST: 'selfhost',
} as const

export type AudioProviderType =
  (typeof AudioProviderType)[keyof typeof AudioProviderType]

export type AudioProviderTable = {
  id: Generated<string>
  name: string
  url: string
  headers: string
  provider_type: AudioProviderType
  created_at: Generated<string>
}

export type AudioProvider = Selectable<AudioProviderTable>

export type AudioProviders = Pick<AudioProvider, 'id' | 'name'>[]

export type NewAudioProvider = Insertable<AudioProviderTable>

export type AudioProviderUpdate = Updateable<AudioProviderTable>

export async function fetchAudioProviders(
  db: Database,
  limit: number,
  offset: number = 0,
): Promise<AudioProviders> {
  const result = await db
    .selectFrom('audio_provider')
    .select(['audio_provider.id', 'audio_provider.name'])
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute()
  return result
}

export async function findAudioProvider(
  db: Database,
  id: AudioProvider['id'],
): Promise<AudioProvider | null> {
  const ap = await db
    .selectFrom('audio_provider')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
  return ap ?? null
}

export async function addAudioProvider(
  db: Database,
  audioProvider: NewAudioProvider,
) {
  await db
    .insertInto('audio_provider')
    .values({
      ...audioProvider,
      id: crypto.randomUUID(),
    })
    .execute()
}

export async function removeAudioProvider(
  db: Database,
  audioProviderId: AudioProvider['id'],
) {
  await db
    .deleteFrom('audio_provider')
    .where('audio_provider.id', '=', audioProviderId)
    .execute()
}
