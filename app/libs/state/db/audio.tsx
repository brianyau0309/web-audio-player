'use client'

import { Audio } from '@/playlist/AudioCard'
import { createContext, useContext } from 'react'
import { DB, DatabaseContext } from '.'
import { OPFSContext } from '../opfs'
import { formHeaders } from '@/libs/utils/http'

export type AudioState = {
  fetchAudio: (limit: number, offset?: number) => Promise<Audio[]>
  findAudio: (id: DB['audio']['id']) => Promise<Audio | null>
  addAudio: (audio: Audio) => Promise<Audio>
  removeAudio: (id: DB['audio']['id']) => Promise<void>
}

const notReady = (): never => {
  throw new Error('Database is not initialized')
}

export const AudioContext = createContext<AudioState>({
  fetchAudio: notReady,
  findAudio: notReady,
  addAudio: notReady,
  removeAudio: notReady,
})

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const db = useContext(DatabaseContext)
  const { dlDir } = useContext(OPFSContext)

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
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset)
      .execute()

    return audioList.map((audio) => ({
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      thumbnail: audio.thumbnail,
      url: audio.url,
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
      url: audio.url,
      provider: {
        id: audio.provider_id,
        name: audio.provider_name,
        headers: JSON.parse(audio.headers),
        url: audio.provider_url,
      },
    }
  }

  const addAudio = async (audio: Audio) => {
    if (!dlDir) throw new Error('Filesystem is not ready')
    return await db()
      .transaction()
      .execute(async (trx) => {
        const newAudio = {
          id: audio.id,
          title: audio.title,
          artist: audio.artist,
          thumbnail: audio.thumbnail,
          url: audio.url,
          downloaded: true,
          provider_id: audio.provider.id,
        }
        await trx.insertInto('audio').values(newAudio).execute()

        const res = await fetch(`${audio.provider.url}${audio.url}`, {
          headers: formHeaders(audio.provider.headers),
        })
        if (!res.ok) throw new Error('Failed to download audio')

        const file = await dlDir.getFileHandle(`${audio.id}`, {
          create: true,
        })
        const writable = await file.createWritable()
        try {
          await writable.truncate(0)
          await writable.write(await res.blob())
        } finally {
          await writable.close()
        }

        return audio
      })
  }

  const removeAudio = async (id: DB['audio']['id']) => {
    if (!dlDir) throw new Error('Filesystem is not ready')
    await db()
      .transaction()
      .execute(async (trx) => {
        await trx.deleteFrom('audio').where('id', '=', id).execute()
        await dlDir.removeEntry(`${id}`)
      })
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
