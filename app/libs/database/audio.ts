'use client'

import { formHeaders } from '$/utils/http'
import { Generated } from 'kysely'
import { Database } from '.'
import { AudioProvider } from './audio-provider'

export type AudioTable = {
  id: string
  title: string
  artist?: string
  url: string
  downloaded: boolean
  thumbnail?: string
  provider_id: string
  created_at: Generated<string>
}

export type AudioInfo = {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  url: string
  downloaded: boolean
  provider: Pick<AudioProvider, 'id' | 'name' | 'url' | 'headers'>
}

export async function fetchAudio(
  db: Database,
  limit: number,
  offset: number = 0,
): Promise<AudioInfo[]> {
  const audioList = await db
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
    downloaded: audio.downloaded,
    provider: {
      id: audio.provider_id,
      name: audio.provider_name,
      headers: audio.headers,
      url: audio.provider_url,
    },
  }))
}

export async function findAudio(db: Database, id: AudioInfo['id']) {
  const audio = await db
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
    downloaded: audio.downloaded,
    provider: {
      id: audio.provider_id,
      name: audio.provider_name,
      headers: audio.headers,
      url: audio.provider_url,
    },
  }
}

export async function addAudio(
  db: Database,
  dir: FileSystemDirectoryHandle,
  audio: AudioInfo,
) {
  return await db.transaction().execute(async (trx) => {
    // Start insert
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

    // Start download
    const res = await fetch(`${audio.provider.url}${audio.url}`, {
      headers: formHeaders(JSON.parse(audio.provider.headers)),
    })
    if (!res.ok)
      throw new Error(`Failed to download audio with ${res.statusText}`)

    // Start write to file
    const file = await dir.getFileHandle(`${audio.id}`, { create: true })
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

export async function removeAudio(
  db: Database,
  dir: FileSystemDirectoryHandle,
  id: AudioInfo['id'],
) {
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom('audio').where('id', '=', id).execute()
    await dir.removeEntry(`${id}`)
  })
}
