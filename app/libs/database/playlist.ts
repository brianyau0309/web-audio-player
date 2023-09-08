'use client'

import { Generated } from 'kysely'
import { AudioInfo } from './audio'
import { Database } from '.'

export type PlaylistTable = {
  id: string
  name: string
  created_at: Generated<string>
}

export type PlaylistAudioTable = {
  playlist_id: string
  audio_id: string
}

export type Playlist = {
  id: string
  name: string
}

export type PlaylistWithAudio = Playlist & {
  audios: AudioInfo[]
}

type PlaylistRow = {
  id: string
  name: string
  audio_id: string
  title: string
  artist: string | undefined
  url: string
  downloaded: boolean
  thumbnail: string | undefined
  provider_id: string
  headers: string
  provider_name: string
  provider_url: string
}

export async function fetchPlaylists(db: Database): Promise<Playlist[]> {
  const playlists = await db
    .selectFrom('playlist')
    .select(['playlist.id', 'playlist.name'])
    .execute()
  return playlists
}

export async function findPlaylist(
  db: Database,
  id: PlaylistWithAudio['id'],
): Promise<PlaylistWithAudio | null> {
  const playlist = await db
    .selectFrom('playlist')
    .leftJoin('playlist_audio', 'playlist_audio.playlist_id', 'playlist.id')
    .leftJoin('audio', 'audio.id', 'playlist_audio.audio_id')
    .innerJoin('audio_provider', 'audio_provider.id', 'audio.provider_id')
    .select(['playlist.id', 'playlist.name'])
    .select([
      'audio.id as audio_id',
      'audio.title',
      'audio.artist',
      'audio.url',
      'audio.downloaded',
      'audio.thumbnail',
    ])
    .select([
      'audio_provider.id as provider_id',
      'audio_provider.name as provider_name',
      'audio_provider.headers',
      'audio_provider.url as provider_url',
    ])
    .where('playlist.id', '=', id)
    .execute()

  if (playlist.length === 0) return null

  return {
    id: playlist[0].id,
    name: playlist[0].name,
    audios: playlist
      .filter((audio): audio is PlaylistRow => audio.audio_id != null)
      .map((audio) => ({
        id: audio.audio_id,
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
      })),
  }
}

export async function createPlaylist(db: Database, name: string) {
  await db
    .insertInto('playlist')
    .values({ id: crypto.randomUUID(), name })
    .execute()
}

export async function removePlaylist(db: Database, id: string) {
  await db.transaction().execute(async (sql) => {
    await sql
      .deleteFrom('playlist_audio')
      .where('playlist_id', '=', id)
      .execute()
    await sql.deleteFrom('playlist').where('id', '=', id).execute()
  })
}

export async function addAudioToPlaylist(
  db: Database,
  playlistId: string,
  audioId: string,
) {
  await db
    .insertInto('playlist_audio')
    .values({ playlist_id: playlistId, audio_id: audioId })
    .execute()
}

export async function removeAudioFromPlaylist(
  db: Database,
  playlistId: string,
  audioId: string,
) {
  await db
    .deleteFrom('playlist_audio')
    .where('playlist_id', '=', playlistId)
    .where('audio_id', '=', audioId)
    .execute()
}
