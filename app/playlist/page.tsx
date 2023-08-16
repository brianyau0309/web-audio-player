'use client'

import { useContext } from 'react'
import { AudioPlayerContext } from '../libs/audio-player'
import { Music } from '../libs/audio-player/music'
import { OPFSContext } from '../libs/opfs'
import AudioCard from './AudioCard'

export default function PlaylistPage() {
  const { playlist, removeMusicToPlaylist } = useContext(OPFSContext)
  const { setAudio } = useContext(AudioPlayerContext)

  const removeMusic = async (music: Music) => {
    if (removeMusicToPlaylist) removeMusicToPlaylist(music)
  }

  return (
    <>
      <h1 className="text-4xl font-bold">Playlist</h1>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {playlist?.downloaded.map((music, index) => (
          <AudioCard
            key={music.musicId}
            className="border-gray-200 dark:border-gray-700 md:border-t"
            audio={{
              title:
                music.title === 'untitled'
                  ? music.filename ?? 'untitled'
                  : music.title,
              artist: music.artist,
              thumbnail: music.covers?.[0]?.data
                ? `data:image/jpeg;base64,${music.covers?.[0]?.data}`
                : undefined,
            }}
            onClick={() => setAudio(index)}
            onDelete={() => removeMusic(music)}
          />
        ))}
      </ul>
    </>
  )
}
