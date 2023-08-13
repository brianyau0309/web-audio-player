'use client'

import { useContext } from 'react'
import { AudioPlayerContext } from '../libs/audio-player'
import { Music } from '../libs/audio-player/music'
import { OPFSContext } from '../libs/opfs'
import { Button } from '../libs/components/Button'
import AudioCard from './AudioCard'

export default function PlaylistPage() {
  const { dlDir, playlist, removeMusicToPlaylist } = useContext(OPFSContext)
  const { setAudioSrc } = useContext(AudioPlayerContext)

  const setMusic = async (music: Music) => {
    if (dlDir) {
      try {
        const file = await dlDir?.getFileHandle(
          `${music.musicId}.${music.codec.toLowerCase()}`,
        )
        const url = URL.createObjectURL(await file.getFile())
        setAudioSrc(url)
      } catch (e) {
        console.error(
          `Failed to get file handle for ${
            music.musicId
          }.${music.codec.toLowerCase()}`,
        )
      }
    }
  }

  const removeMusic = async (music: Music) => {
    if (removeMusicToPlaylist) removeMusicToPlaylist(music)
  }

  return (
    <>
      <h1 className="text-4xl font-bold">Playlist</h1>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {playlist?.downloaded.map((music) => (
          <AudioCard
            key={music.title}
            audio={{
              title: music.title,
              artist: music.artist,
              thumbnail: music.covers?.[0].data
                ? `data:image/jpeg;base64,${music.covers?.[0].data}`
                : undefined,
            }}
            onClick={() => setMusic(music)}
            onDelete={() => removeMusic(music)}
          />
        ))}
      </ul>
    </>
  )
}
