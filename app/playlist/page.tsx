'use client'

import { useContext } from 'react'
import { AudioContext } from '@/libs/state/db/audio'
import AudioCard, { Audio } from './AudioCard'
import { AudioPlayerContext } from '@/libs/state/audio-player'
import cx from '@/libs/cx'

export default function PlaylistPage() {
  const { fetchAudio, removeAudio } = useContext(AudioContext)
  const { currentIndex, setCurrentIndex, playlist, setPlaylist } =
    useContext(AudioPlayerContext)

  const removeMusic = async (audio: Audio) => {
    await removeAudio(audio.id)
    const res = await fetchAudio(100)
    setPlaylist(res)
  }

  return (
    <>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {playlist.map((audio, index) => (
          <AudioCard
            key={audio.id}
            className={cx('border-gray-200 dark:border-gray-700 md:border-t', {
              'bg-slate-900': index === currentIndex,
            })}
            audio={audio}
            onClick={() => setCurrentIndex(index)}
            onDelete={() => removeMusic(audio)}
          />
        ))}
      </ul>
    </>
  )
}
