'use client'

import { useContext, useEffect, useState } from 'react'
import { AudioContext } from '../libs/db/audio'
import AudioCard, { Audio } from './AudioCard'

export default function PlaylistPage() {
  const [playlist, setPlaylist] = useState<Audio[]>([])
  const { fetchAudio, removeAudio } = useContext(AudioContext)
  // const { setAudio } = useContext(AudioPlayerContext)

  useEffect(() => {
    fetchAudio(100)
      .then((res) => {
        setPlaylist(res)
      })
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [fetchAudio])

  const removeMusic = async (audio: Audio) => {
    await removeAudio(audio.id)
    const res = await fetchAudio(100)
    setPlaylist(res)
  }

  return (
    <>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {playlist.map((audio) => (
          <AudioCard
            key={audio.id}
            className="border-gray-200 dark:border-gray-700 md:border-t"
            audio={audio}
            // onClick={() => setAudio(index)}
            onDelete={() => removeMusic(audio)}
          />
        ))}
      </ul>
    </>
  )
}
