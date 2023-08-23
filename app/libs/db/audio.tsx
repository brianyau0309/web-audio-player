'use client'

import { Audio } from '@/app/playlist/AudioCard'
import { createContext, useContext } from 'react'
import { DB, DatabaseContext, notReady } from '.'
import { OPFSContext } from '../opfs'

export type AudioState = {
  fetchAudio: (limit: number, offset?: number) => Promise<Audio[]>
  findAudio: (id: DB['audio']['id']) => Promise<Audio | null>
  addAudio: (audio: Audio) => Promise<void>
  removeAudio: (id: DB['audio']['id']) => Promise<void>
}

export const AudioContext = createContext<AudioState>({
  fetchAudio: notReady,
  findAudio: notReady,
  addAudio: notReady,
  removeAudio: notReady,
})

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const { dlDir } = useContext(OPFSContext)
  const db = useContext(DatabaseContext)

  const fetchAudio = async (
    limit: number,
    offset: number = 0,
  ): Promise<Audio[]> => {
    const audioList = await db()
      .selectFrom('audio')
      .innerJoin('audio_provider', 'audio_provider.id', 'audio.provider_id')
      .selectAll('audio')
      .select([
        'audio_provider.id as provider_id',
        'audio_provider.name as provider_name',
        'audio_provider.headers',
        'audio_provider.url as provider_url',
      ])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute()

    return audioList.map((audio) => ({
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      thumbnail: audio.thumbnail,
      provider: {
        id: audio.provider_id,
        name: audio.provider_name,
        headers: JSON.parse(audio.headers),
        url: audio.provider_url,
      },
    }))
  }

  const findAudio = async (id: DB['audio']['id']) => {
    const audio = await db()
      .selectFrom('audio')
      .innerJoin('audio_provider', 'audio_provider.id', 'audio.provider_id')
      .selectAll('audio')
      .select([
        'audio_provider.id as provider_id',
        'audio_provider.name as provider_name',
        'audio_provider.headers',
        'audio_provider.url as provider_url',
      ])
      .where('audio.id', '=', id)
      .executeTakeFirst()

    if (audio == null) return null

    return {
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      thumbnail: audio.thumbnail,
      provider: {
        id: audio.provider_id,
        name: audio.provider_name,
        headers: JSON.parse(audio.headers),
        url: audio.provider_url,
      },
    }
  }

  const addAudio = async (audio: Audio) => {
    await db()
      .transaction()
      .execute(async (trx) => {
        await trx
          .insertInto('audio')
          .values({
            id: audio.id,
            title: audio.title,
            artist: audio.artist,
            thumbnail: audio.thumbnail,
            url: '',
            downloaded: true,
            provider_id: audio.provider.id,
          })
          .execute()
      })
  }

  const removeAudio = async (id: DB['audio']['id']) => {
    await db().deleteFrom('audio').where('id', '=', id).execute()
  }

  return (
    <AudioContext.Provider
      value={{
        fetchAudio,
        findAudio,
        addAudio,
        removeAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}
