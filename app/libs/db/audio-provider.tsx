'use client'

import { createContext, useCallback, useContext } from 'react'
import { type DB, DatabaseContext, notReady } from '@/app/libs/db'

export type AudioProviderState = {
  setAudioProviders?: React.Dispatch<
    React.SetStateAction<{ id: string; name: string }[]>
  >
  fetchAudioProviders: (
    limit: number,
    offset?: number,
  ) => Promise<{ id: string; name: string }[]>
  findAudioProvider: (id: string) => Promise<DB['audio_provider'] | null>
  addAudioProvider: (
    audioProvider: Omit<DB['audio_provider'], 'id'>,
  ) => Promise<void>
  removeAudioProvider: (
    audioProviderId: DB['audio_provider']['id'],
  ) => Promise<void>
}

export const AudioProviderContext = createContext<AudioProviderState>({
  fetchAudioProviders: notReady,
  findAudioProvider: notReady,
  addAudioProvider: notReady,
  removeAudioProvider: notReady,
})

export const AudioProviderProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const db = useContext(DatabaseContext)

  // Audio Provider
  const fetchAudioProviders = useCallback(
    async (limit: number, offset: number = 0) => {
      const result = await db()
        .selectFrom('audio_provider')
        .select(['audio_provider.id', 'audio_provider.name'])
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute()
      return result
    },
    [db],
  )

  const findAudioProvider = async (
    id: string,
  ): Promise<DB['audio_provider'] | null> => {
    const ap = await db()
      .selectFrom('audio_provider')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    return ap ?? null
  }

  const addAudioProvider = async (
    audioProvider: Omit<DB['audio_provider'], 'id'>,
  ) => {
    await db()
      .insertInto('audio_provider')
      .values({
        id: crypto.randomUUID(),
        name: audioProvider.name,
        url: audioProvider.url,
        headers: audioProvider.headers,
        provider_type: audioProvider.provider_type,
      })
      .execute()
  }

  const removeAudioProvider = async (
    audioProviderId: DB['audio_provider']['id'],
  ) => {
    await db()
      .deleteFrom('audio_provider')
      .where('audio_provider.id', '=', audioProviderId)
      .execute()
  }

  return (
    <AudioProviderContext.Provider
      value={{
        findAudioProvider,
        fetchAudioProviders,
        addAudioProvider,
        removeAudioProvider,
      }}
    >
      {children}
    </AudioProviderContext.Provider>
  )
}
