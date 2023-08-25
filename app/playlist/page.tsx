'use client'

import { DatabaseContext } from '$/database'
import { AudioInfo, fetchAudio, removeAudio } from '$/database/audio'
import { OPFSContext } from '$/opfs'
import { AudioPlayerContext } from '$/state/audio-player'
import cx from '$/utils/cx'
import { use } from 'react'
import toast from 'react-hot-toast'
import AudioCard from './AudioCard'

export default function PlaylistPage() {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const { currentIndex, setCurrentIndex, playlist, setPlaylist } =
    use(AudioPlayerContext)

  const handleDelete = async (audio: AudioInfo) => {
    if (!db || !dlDir) {
      toast.error('Failed to remove audio')
      return
    }
    await removeAudio(db, dlDir, audio.id)
    const res = await fetchAudio(db, 100)
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
            onDelete={() => handleDelete(audio)}
          />
        ))}
      </ul>
    </>
  )
}
